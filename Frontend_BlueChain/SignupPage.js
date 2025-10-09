// src/SignupPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const COUNTRIES = [
  "India","Bangladesh","Sri Lanka","Indonesia","Philippines","Kenya","Tanzania","Nigeria","Vietnam","Malaysia","Mexico","Brazil","USA","UK","Australia","Other"
];
const CATEGORIES = ["Local", "Organization", "NGO", "Other"];

function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [category, setCategory] = useState("Local");
  const [idNote, setIdNote] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const captchaRef = useRef(null);
  const googleBtnRef = useRef(null);

  // Inject reCAPTCHA v2
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.getElementById("recaptcha-script")) {
      if (window.grecaptcha && captchaRef.current) {
        try {
          window.grecaptcha.render(captchaRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (t) => setCaptchaToken(t),
            "expired-callback": () => setCaptchaToken(""),
            "error-callback": () => setCaptchaToken("")
          });
        } catch {}
      }
      return;
    }
    const s = document.createElement("script");
    s.id = "recaptcha-script";
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.grecaptcha && captchaRef.current) {
        window.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (t) => setCaptchaToken(t),
          "expired-callback": () => setCaptchaToken(""),
          "error-callback": () => setCaptchaToken("")
        });
      }
    };
    document.body.appendChild(s);
  }, []);

  // Optional Google Sign-Up
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.google && window.google.accounts && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            // TODO: decode and pre-fill profile via backend
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 280,
        });
      }
    };
    document.body.appendChild(s);
  }, []);

  // Sanitizers/validators
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const PHONE_SAN = (s) => (s || "").replace(/\D/g, "").slice(0, 15);
  const hasUpper = (s) => /[A-Z]/.test(s);
  const hasLower = (s) => /[a-z]/.test(s);
  const hasDigit = (s) => /\d/.test(s);
  const hasSymbol = (s) => /[^A-Za-z0-9]/.test(s);

  const pwScore = useMemo(() => {
    let score = 0;
    if (pw.length >= 12) score++;
    if (hasUpper(pw)) score++;
    if (hasLower(pw)) score++;
    if (hasDigit(pw)) score++;
    if (hasSymbol(pw)) score++;
    return score;
  }, [pw]);

  const validate = () => {
    const e = {};
    if (!fullName || fullName.trim().length < 3) e.fullName = "Enter full name (min 3 chars).";
    if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email.";
    if (!PHONE_SAN(phone)) e.phone = "Enter a valid phone (digits only).";
    if (!city || city.trim().length < 2) e.city = "Enter city/town.";
    if (!country) e.country = "Select country.";
    if (!category) e.category = "Select category.";
    if (pw.length < 12) e.pw = "Password must be at least 12 characters.";
    if (!hasUpper(pw) || !hasLower(pw) || !hasDigit(pw) || !hasSymbol(pw)) {
      e.pw = (e.pw ? e.pw + " " : "") + "Include upper, lower, number, and symbol.";
    }
    if (pw2 !== pw) e.pw2 = "Passwords do not match.";
    if (RECAPTCHA_SITE_KEY && !captchaToken) e.captcha = "Please complete the CAPTCHA.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Secret modal
  const [showSecret, setShowSecret] = useState(false);
  const [userUid, setUserUid] = useState("");
  const [secretWords, setSecretWords] = useState("");

  const WORDS = [
    "mangrove","seagrass","tidal","delta","estuary","blue","carbon","oyster","coral","pelican","lagoon",
    "sediment","marsh","root","shoot","salinity","brackish","nursery","dolphin","wave","tide","kelp","meadow"
  ];
  const generateUid = () => "USR-" + Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
  const generateSecret = () => Array.from({ length: 5 }, () => WORDS[Math.floor(Math.random()*WORDS.length)]).join("-");

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setUserUid(generateUid());
    setSecretWords(generateSecret());
    setShowSecret(true);
  };

  const [submittingServer, setSubmittingServer] = useState(false);
  const finalizeSignup = async () => {
    setSubmittingServer(true);
    try {
      const r = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fullName,
          email,
          password: pw,
          phone: PHONE_SAN(phone),
          city,
          country,
          category,
          idNote,
          captchaToken,
          userUid,
          recoveryWords: secretWords,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Signup failed");
      setShowSecret(false);
      navigate("/home");
    } catch (e) {
      alert(e.message || "Signup failed");
    } finally {
      setSubmittingServer(false);
    }
  };

  return (
    <div className="signup-root text-dark">
      <style>{`
        .signup-root { min-height: 100vh; display:flex; align-items:center; background:#0b1220; position:relative; overflow:hidden; }
        .bg-img { position:absolute; inset:0; background-image:url('https://images.unsplash.com/photo-1533119408463-b0f487eec1e8?q=80&w=1920&auto=format&fit=crop'); background-size:cover; background-position:center; filter:brightness(.72); animation:pan2 26s ease-in-out infinite alternate; }
        @keyframes pan2 { from { transform: scale(1);} to { transform: scale(1.05);} }
        .overlay-grad { position:absolute; inset:0; background: radial-gradient(circle at 80% 20%, rgba(6,182,212,.18), transparent 45%); }
        .card-neo { background: rgba(255,255,255,.96); border: 1px solid rgba(0,0,0,.06); border-radius: 18px; box-shadow: 0 10px 30px rgba(2,6,23,.2); }
        .brand-gradient { background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-glow:hover { box-shadow: 0 8px 24px rgba(37,99,235,.35); transform: translateY(-1px); }
        .meter { height: 8px; border-radius: 999px; overflow: hidden; background: #e9ecef; }
        .meter-fill { height: 100%; transition: width .25s ease; }
        .meter-0 { width:0%; background:#e9ecef; }
        .meter-1 { width:20%; background:#dc3545; }
        .meter-2 { width:40%; background:#fd7e14; }
        .meter-3 { width:60%; background:#ffc107; }
        .meter-4 { width:80%; background:#20c997; }
        .meter-5 { width:100%; background:#198754; }
        .eye-toggle { border: 1px solid #dde3ee; background: #fff; }
        .eye-toggle.active { background: #e8f0ff; }
        .secret-modal-backdrop { position: fixed; inset:0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index: 2000; }
        .secret-card { width: 92%; max-width: 680px; background:#0b1220; color:#fff; border-radius: 16px; padding: 18px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .noselect, .secret-card * { -webkit-user-select:none; user-select:none; }
      `}</style>

      <div className="bg-img" />
      <div className="overlay-grad" />

      <div className="container position-relative py-5">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="card-neo p-4">
              <h3 className="text-center mb-1 brand-gradient fw-bold">Create your account</h3>
              <p className="text-center text-muted mb-4">KYC-lite profile to personalize your dashboard and verification flow.</p>

              <form onSubmit={onSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input className={`form-control ${errors.fullName ? "is-invalid" : ""}`} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                    {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className={`form-control ${errors.email ? "is-invalid" : ""}`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input className={`form-control ${errors.phone ? "is-invalid" : ""}`} value={phone} onChange={(e) => setPhone(PHONE_SAN(e.target.value))} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City/Town</label>
                    <input className={`form-control ${errors.city ? "is-invalid" : ""}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" autoComplete="address-level2" />
                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <select className={`form-select ${errors.country ? "is-invalid" : ""}`} value={country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select className={`form-select ${errors.category ? "is-invalid" : ""}`} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Identification (note or reference)</label>
                    <input className="form-control" value={idNote} onChange={(e) => setIdNote(e.target.value)} placeholder="e.g., ID reference or brief identifying note" maxLength={120} />
                    <div className="form-text">For verification context (optional, kept private).</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label d-flex align-items-center justify-content-between">
                      <span>Password</span>
                      <button type="button" className={`btn btn-sm eye-toggle ${showPw ? "active" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPw((s) => !s)}>
                        {showPw ? "🙈 Hide" : "👁 Show"}
                      </button>
                    </label>
                    <input className={`form-control ${errors.pw ? "is-invalid" : ""}`} type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 12 chars with upper/lower/digit/symbol" autoComplete="new-password" />
                    {errors.pw && <div className="invalid-feedback">{errors.pw}</div>}
                    <div className="meter mt-1"><div className={`meter-fill meter-${pwScore}`} /></div>
                    <div className="form-text">Strength: {["Very weak","Weak","Fair","Good","Strong","Excellent"][pwScore]}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label d-flex align-items-center justify-content-between">
                      <span>Confirm Password</span>
                      <button type="button" className={`btn btn-sm eye-toggle ${showPw2 ? "active" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPw2((s) => !s)}>
                        {showPw2 ? "🙈 Hide" : "👁 Show"}
                      </button>
                    </label>
                    <input className={`form-control ${errors.pw2 ? "is-invalid" : ""}`} type={showPw2 ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
                    {errors.pw2 && <div className="invalid-feedback">{errors.pw2}</div>}
                  </div>
                  <div className="col-12">
                    {RECAPTCHA_SITE_KEY ? (
                      <div className="d-flex justify-content-center"><div ref={captchaRef} /></div>
                    ) : (
                      <div className="alert alert-warning py-2">CAPTCHA not configured. Set REACT_APP_RECAPTCHA_SITE_KEY.</div>
                    )}
                    {errors.captcha && <div className="text-danger small mt-1 text-center">{errors.captcha}</div>}
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary w-100 btn-glow" disabled={submitting}> {submitting ? "Submitting..." : "Create account"} </button>
                    {GOOGLE_CLIENT_ID && (
                      <div className="d-flex justify-content-center mt-2"><div ref={googleBtnRef} /></div>
                    )}
                  </div>
                </div>
              </form>

              <div className="text-center mt-3">
                <span className="text-muted small">Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSecret && (
        <div className="secret-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowSecret(false)}>
          <div className="secret-card noselect" onContextMenu={(e) => e.preventDefault()}>
            <h5 className="mb-2">Your Unique ID and Recovery Words</h5>
            <p className="mb-2" style={{ opacity: 0.85 }}>Write these down. Do not screenshot. We will not show them again.</p>
            <div className="p-3 rounded" style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)" }}>
              <div><strong>ID:</strong> {userUid}</div>
              <div className="mt-2"><strong>Recovery words:</strong> {secretWords}</div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-outline-light" onClick={() => setShowSecret(false)}>Back</button>
              <button className="btn btn-success" disabled={submittingServer} onClick={finalizeSignup}>
                {submittingServer ? "Finalizing..." : "I wrote it down — Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SignupPage;
