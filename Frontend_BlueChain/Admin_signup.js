// src/Admin_signup.js
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminSignup() {
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
        <div className="col-md-10 col-lg-8">
          <div className="text-center mb-4">
            <img src="/logo192.png" alt="logo" width={56} height={56} className="rounded-circle shadow-sm" />
            <h3 className="mt-2 brand-gradient">Request Admin Access</h3>
          </div>
          <div className="card-neo p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input className="form-control" placeholder="Your name" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Work Email</label>
                <input type="email" className="form-control" placeholder="you@organization.org" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Organization</label>
                <input className="form-control" placeholder="Legal org name" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Role</label>
                <select className="form-select">
                  <option>Verifier</option>
                  <option>Supervisor</option>
                  <option>Program Admin</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Invitation Code (optional)</label>
                <input className="form-control" placeholder="If provided" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone (optional)</label>
                <input className="form-control" placeholder="+1 555 123 4567" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="Create password" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" placeholder="Repeat password" />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="terms" />
                  <label className="form-check-label" htmlFor="terms">I agree to the terms of admin access and data handling.</label>
                </div>
              </div>
              <div className="col-12">
                <button className="btn btn-primary w-100 btn-glow">Submit Request</button>
              </div>
            </div>
            <small className="text-muted d-block mt-3">
              Note: Access may require supervisor approval and identity verification.
            </small>
          </div>
          <div className="text-center mt-4">
            <Link to="/">← Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSignup;
