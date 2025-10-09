// src/LoginPage.js
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState("");

  const captchaRef = useRef(null);
  const googleBtnRef = useRef(null);
  const faceRef = useRef(null);
  const [isPwFocus, setIsPwFocus] = useState(false);

  // Inject Google reCAPTCHA v2
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.getElementById("recaptcha-script")) return;
    const s = document.createElement("script");
    s.id = "recaptcha-script";
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.grecaptcha && captchaRef.current) {
        window.grecaptcha.ready(() => {
          try {
            window.grecaptcha.render(captchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: (token) => setCaptchaToken(token),
              "expired-callback": () => setCaptchaToken(""),
              "error-callback": () => setCaptchaToken(""),
            });
          } catch {}
        });
      }
    };
    document.body.appendChild(s);
  }, []);

  // Inject Google Identity Services
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
            if (resp && resp.credential) {
              // TODO: send to backend for verification
              navigate("/home");
            }
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
  }, [navigate]);

  // Character: eye tracking
  useEffect(() => {
    const node = faceRef.current;
    if (!node) return;
    const pupils = node.querySelectorAll(".pupil");
    const onMove = (e) => {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      const px = clamp(dx * 14, -12, 12);
      const py = clamp(dy * 14, -12, 12);
      pupils.forEach((p) => (p.style.transform = `translate(${px}px, ${py}px)`));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  const validate = () => {
    const e = {};
    if (!email || !EMAIL_REGEX.test(email)) e.email = "Enter a valid email.";
    if (!pw) e.pw = "Password is required.";
    if (RECAPTCHA_SITE_KEY && !captchaToken) e.captcha = "Complete the CAPTCHA.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: pw, captchaToken }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Login failed");
      navigate("/home");
    } catch (err) {
      setErrors((p) => ({ ...p, form: err.message || "Login failed." }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-root text-dark">
      <style>{`
        .login-root { min-height: 100vh; display:flex; align-items:center; background:#0b1220; position:relative; overflow:hidden; }
        .bg-img { position:absolute; inset:0; background-image:url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop'); background-size:cover; background-position:center; filter:brightness(.72); animation:pan 24s ease-in-out infinite alternate; }
        @keyframes pan { from { transform: scale(1);} to { transform: scale(1.06);} }
        .overlay-grad { position:absolute; inset:0; background: radial-gradient(circle at 20% 10%, rgba(37,99,235,.25), transparent 45%); }
        .card-neo { background: rgba(255,255,255,.96); border: 1px solid rgba(0,0,0,.06); border-radius: 18px; box-shadow: 0 10px 30px rgba(2,6,23,.2); }
        .brand-gradient { background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-glow:hover { box-shadow: 0 8px 24px rgba(37,99,235,.35); transform: translateY(-1px); }
        .char { width: 120px; height: 120px; position: relative; margin: 0 auto 12px; transition: transform .25s ease; }
        .head { width: 100%; height: 100%; background: #f2f7ff; border-radius: 50%; border: 3px solid #a5c4ff; position: relative; }
        .eye { position: absolute; top: 38%; width: 28px; height: 28px; background: #fff; border-radius: 50%; border: 2px solid #3663f6; overflow: hidden; }
        .eye.left { left: 28%; }
        .eye.right { right: 28%; }
        .pupil { width: 12px; height: 12px; background: #111; border-radius: 50%; position: absolute; left: 8px; top: 8px; transition: transform .08s linear; }
        .hand { position:absolute; width: 34px; height: 34px; background:#f2f7ff; border: 3px solid #a5c4ff; border-radius: 50%; top: 58%; transition: transform .25s ease, top .25s ease; }
        .hand.left { left: 16%; }
        .hand.right { right: 16%; }
        .char.shy .hand { top: 35%; transform: translateY(-8px); }
        .char:hover { transform: translateY(-3px); }
        .eye-toggle { border: 1px solid #dde3ee; background: #fff; }
        .eye-toggle.active { background: #e8f0ff; }
        .g-btn-wrap { display:flex; justify-content:center; margin-top:8px; }
        .captcha-wrap { display:flex; justify-content:center; margin-top:8px; }
        .hint { font-size: 12px; color: #6c757d; }
      `}</style>

      <div className="bg-img" />
      <div className="overlay-grad" />

      <div className="container position-relative py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card-neo p-4">
              <div ref={faceRef} className={`char ${isPwFocus ? "shy" : ""}`} aria-hidden>
                <div className="head">
                  <div className="eye left"><div className="pupil" /></div>
                  <div className="eye right"><div className="pupil" /></div>
                  <div className="hand left" />
                  <div className="hand right" />
                </div>
              </div>

              <h3 className="text-center mb-1 brand-gradient fw-bold">Welcome Back</h3>
              <p className="text-center text-muted mb-4">Login with email and password or use Google.</p>

              {errors.form && <div className="alert alert-danger py-2">{errors.form}</div>}

              <form onSubmit={onSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  <div className="hint">Use your registered email.</div>
                </div>

                <div className="mb-2">
                  <label className="form-label d-flex align-items-center justify-content-between">
                    <span>Password</span>
                    <button
                      type="button"
                      className={`btn btn-sm eye-toggle ${showPw ? "active" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? "🙈 Hide" : "👁 Show"}
                    </button>
                  </label>
                  <input
                    className={`form-control ${errors.pw ? "is-invalid" : ""}`}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onFocus={() => setIsPwFocus(true)}
                    onBlur={() => setIsPwFocus(false)}
                    autoComplete="current-password"
                  />
                  {errors.pw && <div className="invalid-feedback">{errors.pw}</div>}
                  <div className="d-flex justify-content-end">
                    <Link to="/forgot" className="small">Forgot password?</Link>
                  </div>
                </div>

                {RECAPTCHA_SITE_KEY ? (
                  <div className="captcha-wrap"><div ref={captchaRef} /></div>
                ) : (
                  <div className="alert alert-warning py-2">CAPTCHA not configured. Set REACT_APP_RECAPTCHA_SITE_KEY.</div>
                )}
                {errors.captcha && <div className="text-danger small mt-1 text-center">{errors.captcha}</div>}

                <button type="submit" className="btn btn-primary w-100 mt-3 btn-glow" disabled={submitting}>
                  {submitting ? "Signing in..." : "Login"}
                </button>

                {GOOGLE_CLIENT_ID && (
                  <div className="g-btn-wrap"><div ref={googleBtnRef} /></div>
                )}
              </form>

              <div className="text-center mt-3">
                <span className="text-muted small">New here? </span>
                <Link to="/signup">Create an account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
