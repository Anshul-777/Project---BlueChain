// src/Admin_login.js
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminLogin() {
  useEffect(() => {
    if (!document.getElementById("tw-cdn")) {
      const link = document.createElement("link");
      link.id = "tw-cdn";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="container py-5">
      <style>{`
        .brand-gradient { background: linear-gradient(135deg, #1d4ed8, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card-neo { background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.06); border-radius: 16px; box-shadow: 0 10px 30px rgba(2,6,23,.08); transition: transform .2s ease, box-shadow .2s ease; }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,.12); }
        .btn-glow:hover { box-shadow: 0 8px 24px rgba(29,78,216,.35); transform: translateY(-1px); }
      `}</style>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="text-center mb-4">
            <img src="/logo192.png" alt="logo" width={56} height={56} className="rounded-circle shadow-sm" />
            <h3 className="mt-2 brand-gradient">BlueChain Admin Login</h3>
          </div>
          <div className="card-neo p-4">
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="admin@example.org" />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="••••••••" />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label" htmlFor="remember">Remember me</label>
              </div>
              <Link to="#" className="small">Forgot password?</Link>
            </div>
            <button className="btn btn-primary w-100 btn-glow">Login</button>
            <div className="text-center mt-3 small text-muted">
              Need an account? <Link to="/admin/signup">Request admin access</Link>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/">← Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
