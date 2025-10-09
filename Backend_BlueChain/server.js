require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const pool = require("./db");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ⚡ CORS setup for React frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Mount projects API router
try {
  const projectsRouter = require("./routes/projects");
  app.use("/api/projects", projectsRouter);
} catch (e) {
  console.warn("Projects router not mounted:", e?.message);
}

// Helper: set cookie with JWT
function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 24*60*60*1000, // 1 day
    secure: false,          // production me true karna
    sameSite: "lax"
  });
}

async function verifyRecaptcha(token, ip) {
  if (!process.env.RECAPTCHA_SECRET) return true; // optional
  if (!token) return false;
  try {
    if (typeof fetch !== "function") {
      console.warn("fetch not available; skipping reCAPTCHA verify");
      return true;
    }
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET,
      response: token,
      remoteip: ip || "",
    });
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await resp.json();
    return !!data.success;
  } catch (e) {
    console.warn("reCAPTCHA verify error:", e?.message);
    return true; // do not block if verification infra missing
  }
}

// ✅ Signup route
app.post("/api/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      city,
      country,
      category,
      idNote,
      captchaToken,
      userUid,
      recoveryWords,
    } = req.body || {};

    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
    const okCaptcha = await verifyRecaptcha(captchaToken, req.ip);
    if (!okCaptcha) return res.status(400).json({ error: "CAPTCHA failed" });

    // Check existing user
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const uid = userUid && String(userUid).trim() ? userUid.trim() :
      "USR-" + Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    const recHash = recoveryWords ? crypto.createHash("sha256").update(String(recoveryWords)).digest("hex") : null;

    const result = await pool.query(
      `INSERT INTO users
       (name, email, phone, city, country, category, id_note, password_hash, user_uid, recovery_words_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, name, email, user_uid as "userUid", created_at as "createdAt"`,
      [name, email, phone || null, city || null, country || null, category || null, idNote || null, hashed, uid, recHash]
    );

    // Set cookie with JWT
    setTokenCookie(res, { id: result.rows[0].id, name: result.rows[0].name });

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ✅ Login route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });
    const okCaptcha = await verifyRecaptcha(captchaToken, req.ip);
    if (!okCaptcha) return res.status(400).json({ error: "CAPTCHA failed" });

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    // Set cookie with JWT
    setTokenCookie(res, { id: user.id, name: user.name });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Optional: login with uid + recovery words
app.post("/api/login/recovery", async (req, res) => {
  try {
    const { userUid, words } = req.body || {};
    if (!userUid || !words) return res.status(400).json({ error: "Missing fields" });
    const r = await pool.query("SELECT id, name, email, recovery_words_hash FROM users WHERE user_uid=$1", [userUid]);
    if (!r.rows.length) return res.status(400).json({ error: "Not found" });
    const user = r.rows[0];
    const hash = crypto.createHash("sha256").update(String(words)).digest("hex");
    if (user.recovery_words_hash && user.recovery_words_hash !== hash) return res.status(400).json({ error: "Invalid recovery words" });
    setTokenCookie(res, { id: user.id, name: user.name });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Recovery login failed" });
  }
});

// ✅ Get current user from cookie
app.get("/api/me", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query("SELECT id, name, email FROM users WHERE id=$1", [decoded.id]);
    const user = result.rows[0] || null;

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.json({ user: null });
  }
});

// ✅ Logout route
app.post("/api/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));