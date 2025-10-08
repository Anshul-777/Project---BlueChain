// src/AdminLanding.js
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminLanding() {
  // Tailwind (CDN) injection without CRA build changes
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

  // Smooth in-page scroll for anchor links
  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handler = (e) => {
      const href = e.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const el = document.getElementById(href.slice(1));
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    anchors.forEach((a) => a.addEventListener("click", handler));
    return () => anchors.forEach((a) => a.removeEventListener("click", handler));
  }, []);

  // Reveal-on-scroll animations
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal-on-scroll").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const sidebarRef = useRef(null);
  const backdropRef = useRef(null);
  const openSidebar = () => {
    sidebarRef.current?.classList.add("sidebar-open");
    backdropRef.current?.classList.add("backdrop-show");
  };
  const closeSidebar = () => {
    sidebarRef.current?.classList.remove("sidebar-open");
    backdropRef.current?.classList.remove("backdrop-show");
  };

  return (
    <div className="admin-landing-root bg-white text-gray-800">
      <style>{`
        .admin-landing-root { min-height: 100vh; overflow-x: hidden; }
        .brand-gradient { background: linear-gradient(135deg, #1d4ed8, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-blur { backdrop-filter: blur(10px); background: rgba(255,255,255,0.85); }
        .btn-glow:hover { box-shadow: 0 8px 24px rgba(29,78,216,.35); transform: translateY(-1px); }
        .link-underline { position: relative; }
        .link-underline::after { content: ""; position: absolute; left: 0; bottom: -2px; height: 2px; width: 0; background: linear-gradient(90deg, #1d4ed8, #06b6d4); transition: width .25s ease; }
        .link-underline:hover::after { width: 100%; }

        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 280px; z-index: 1100; background: #0b1220; color: #d1d5db; transform: translateX(-100%); transition: transform .35s ease; box-shadow: 8px 0 30px rgba(2,6,23,.28); }
        .sidebar a { color: #e5e7eb; text-decoration: none; display: block; padding: 10px 14px; border-radius: 8px; }
        .sidebar a:hover { background: rgba(59,130,246,.15); color: #fff; }
        .sidebar-open { transform: translateX(0); }
        .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity .3s ease; }
        .backdrop-show { opacity: 1; pointer-events: auto; }

        /* Hero */
        .hero { position: relative; min-height: 92vh; display:flex; align-items:center; justify-content:center; background: radial-gradient(circle at 20% 10%, #e0f2fe 0%, #ffffff 48%); overflow:hidden; }
        .hero::before { content:""; position:absolute; inset:0; background-image: url("https://images.unsplash.com/photo-1550534791-ef9a97cb6c3d?q=80&w=1600&auto=format&fit=crop"); background-size: cover; background-position: center; mix-blend-mode: multiply; opacity: .10; pointer-events:none; animation: slowPan 24s ease-in-out infinite alternate; }

        /* Animations (same set as user landing, 24) */
        @keyframes slowPan { from { transform: scale(1) translateY(0);} to { transform: scale(1.06) translateY(-12px);} }
        @keyframes fadeUp { from { opacity:0; transform: translateY(28px);} to { opacity:1; transform: translateY(0);} }
        @keyframes fadeDown { from { opacity:0; transform: translateY(-28px);} to { opacity:1; transform: translateY(0);} }
        @keyframes fadeLeft { from { opacity:0; transform: translateX(-36px);} to { opacity:1; transform: translateX(0);} }
        @keyframes fadeRight { from { opacity:0; transform: translateX(36px);} to { opacity:1; transform: translateX(0);} }
        @keyframes zoomIn { from { opacity:0; transform: scale(.94);} to { opacity:1; transform: scale(1);} }
        @keyframes zoomOut { from { opacity:0; transform: scale(1.06);} to { opacity:1; transform: scale(1);} }
        @keyframes rotateIn { from { opacity:0; transform: rotate(-6deg);} to { opacity:1; transform: rotate(0);} }
        @keyframes rotateInR { from { opacity:0; transform: rotate(6deg);} to { opacity:1; transform: rotate(0);} }
        @keyframes flipInX { from { opacity:0; transform: rotateX(70deg);} to { opacity:1; transform: rotateX(0);} }
        @keyframes flipInY { from { opacity:0; transform: rotateY(70deg);} to { opacity:1; transform: rotateY(0);} }
        @keyframes tiltIn { from { opacity:0; transform: translateY(16px) rotate(-2deg);} to { opacity:1; transform: translateY(0) rotate(0);} }
        @keyframes bounceIn { 0%{transform: scale(0.9);} 50%{transform: scale(1.05);} 100%{transform: scale(1);} }
        @keyframes glowPulse { 0%{ box-shadow: 0 0 0 rgba(29,78,216,0);} 100%{ box-shadow: 0 0 30px rgba(29,78,216,0.35);} }
        @keyframes blurIn { from { filter: blur(12px); opacity: 0;} to { filter: blur(0px); opacity: 1;} }
        @keyframes slideDiag { from { opacity:0; transform: translate(-28px,28px);} to { opacity:1; transform: translate(0,0);} }
        @keyframes floatUp { 0%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} 100%{ transform: translateY(0);} }
        @keyframes parallaxY { from { transform: translateY(12px);} to { transform: translateY(-12px);} }
        @keyframes rippleIn { from { clip-path: circle(0% at 50% 50%);} to { clip-path: circle(140% at 50% 50%);} }
        @keyframes skewIn { from { transform: skewY(4deg); opacity:0;} to { transform: skewY(0); opacity:1;} }
        @keyframes lineSweep { from { width: 0;} to { width: 100%;} }
        @keyframes popIn { 0%{ opacity:0; transform: scale(.9);} 60%{ opacity:1; transform: scale(1.05);} 100%{ transform: scale(1);} }
        @keyframes slideUpLong { from { opacity:0; transform: translateY(60px);} to { opacity:1; transform: translateY(0);} }
        @keyframes revealMaskX { from { clip-path: inset(0 100% 0 0);} to { clip-path: inset(0 0 0 0);} }
        @keyframes shimmerBg { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }
        @keyframes hueShift { 0%{ filter: hue-rotate(0deg);} 100%{ filter: hue-rotate(15deg);} }

        .anim-fadeUp.in-view { animation: fadeUp .7s ease both; }
        .anim-fadeDown.in-view { animation: fadeDown .7s ease both; }
        .anim-fadeLeft.in-view { animation: fadeLeft .7s ease both; }
        .anim-fadeRight.in-view { animation: fadeRight .7s ease both; }
        .anim-zoomIn.in-view { animation: zoomIn .65s ease both; }
        .anim-zoomOut.in-view { animation: zoomOut .65s ease both; }
        .anim-rotateL.in-view { animation: rotateIn .6s ease both; }
        .anim-rotateR.in-view { animation: rotateInR .6s ease both; }
        .anim-flipX.in-view { animation: flipInX .75s ease both; transform-origin: top; }
        .anim-flipY.in-view { animation: flipInY .75s ease both; transform-origin: left; }
        .anim-tilt.in-view { animation: tiltIn .6s ease both; }
        .anim-bounce.in-view { animation: bounceIn .7s ease both; }
        .anim-glow.in-view { animation: glowPulse 1.6s ease both; }
        .anim-blur.in-view { animation: blurIn .8s ease both; }
        .anim-diag.in-view { animation: slideDiag .7s ease both; }
        .anim-float { animation: floatUp 3.5s ease-in-out infinite; }
        .anim-parallax { animation: parallaxY 6s ease-in-out infinite alternate; }
        .anim-ripple.in-view { animation: rippleIn .8s ease both; }
        .anim-skew.in-view { animation: skewIn .65s ease both; }
        .anim-line .line { height: 3px; background: linear-gradient(90deg, #1d4ed8, #06b6d4); width: 0; }
        .anim-line.in-view .line { animation: lineSweep 1s .15s ease forwards; }
        .anim-pop.in-view { animation: popIn .65s ease both; }
        .anim-slideLong.in-view { animation: slideUpLong .8s cubic-bezier(.2,.8,.2,1) both; }
        .anim-maskX.in-view { animation: revealMaskX .8s ease both; }
        .bg-shimmer { background: linear-gradient(90deg, rgba(203,213,225,0.25), rgba(29,78,216,0.12), rgba(203,213,225,0.25)); background-size: 200% 100%; animation: shimmerBg 4s linear infinite; }
        .fx-hue.in-view img { animation: hueShift 2.5s ease both; }

        .card-neo { background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.06); border-radius: 16px; box-shadow: 0 10px 30px rgba(2,6,23,.08); transition: transform .2s ease, box-shadow .2s ease; }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,.12); }

        .sec-tools { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
        .sec-workflow { background: #ffffff; }
        .sec-criteria { background: linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%); }
        .sec-research { background: #ffffff; }
        .sec-about { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
        .sec-contact { background: #ffffff; }
        .sec-help { background: linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%); }
      `}</style>

      {/* Header */}
      <header className="header-blur position-sticky top-0 z-50 w-100 border-bottom">
        <div className="container py-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <img src="/logo192.png" alt="BlueChain Admin logo" width={40} height={40} className="rounded-circle shadow-sm anim-float" />
            <div>
              <div className="h4 m-0 brand-gradient fw-bold">BlueChain Admin</div>
              <div className="small text-muted">Verification & Credit Issuance Suite</div>
            </div>
          </div>
          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a href="#home" className="text-decoration-none text-dark link-underline">Home</a>
            <a href="#tools" className="text-decoration-none text-dark link-underline">Tools</a>
            <a href="#workflow" className="text-decoration-none text-dark link-underline">Workflow</a>
            <a href="#criteria" className="text-decoration-none text-dark link-underline">Criteria</a>
            <a href="#research" className="text-decoration-none text-dark link-underline">Standards</a>
            <a href="#about" className="text-decoration-none text-dark link-underline">About</a>
            <a href="#contact" className="text-decoration-none text-dark link-underline">Contact</a>
            <a href="#help" className="text-decoration-none text-dark link-underline">Help</a>
          </nav>
          <div className="d-none d-lg-flex align-items-center gap-2">
            <Link to="/admin/login" className="btn btn-outline-primary btn-sm btn-glow">Admin Login</Link>
            <Link to="/admin/signup" className="btn btn-primary btn-sm btn-glow">Admin Sign up</Link>
          </div>
          <button aria-label="Open menu" className="btn btn-light d-lg-none" onClick={openSidebar}>☰</button>
        </div>
      </header>

      {/* Sidebar */}
      <div ref={sidebarRef} className="sidebar p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="fw-bold">Admin Menu</div>
          <button aria-label="Close menu" className="btn btn-sm btn-outline-light" onClick={closeSidebar}>×</button>
        </div>
        <hr className="border-secondary" />
        <a href="#home" onClick={closeSidebar}>Home</a>
        <a href="#tools" onClick={closeSidebar}>Tools</a>
        <a href="#workflow" onClick={closeSidebar}>Workflow</a>
        <a href="#criteria" onClick={closeSidebar}>Criteria</a>
        <a href="#research" onClick={closeSidebar}>Standards</a>
        <a href="#about" onClick={closeSidebar}>About</a>
        <a href="#contact" onClick={closeSidebar}>Contact</a>
        <a href="#help" onClick={closeSidebar}>Help</a>
        <hr className="border-secondary" />
        <div className="d-flex gap-2">
          <Link to="/admin/login" className="btn btn-outline-info btn-sm w-50" onClick={closeSidebar}>Login</Link>
          <Link to="/admin/signup" className="btn btn-info btn-sm text-white w-50" onClick={closeSidebar}>Sign up</Link>
        </div>
      </div>
      <div ref={backdropRef} className="backdrop" onClick={closeSidebar} />

      {/* Hero */}
      <section id="home" className="hero">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7 reveal-on-scroll anim-maskX">
              <div className="display-5 fw-bold brand-gradient">Welcome, Verifiers & Program Admins</div>
              <div className="anim-line mt-2"><div className="line"></div></div>
              <p className="lead text-muted mt-3">
                A dedicated suite for screening, validating, verifying and issuing credits for blue carbon
                projects — with evidence review, geospatial checks, MRV analytics, and on-chain anchoring.
              </p>
              <ul className="text-muted mb-4">
                <li>Review project packages (Local/Org) with GPS, boundaries, and documents</li>
                <li>Run MRV checks, lab report validation, satellite imagery overlays</li>
                <li>Approve/reject/needs-info and anchor approved hashes to blockchain</li>
              </ul>
              <div className="d-flex gap-2">
                <Link to="/admin/signup" className="btn btn-primary btn-glow">Request Admin Access</Link>
                <Link to="/admin/login" className="btn btn-outline-primary btn-glow">Admin Login</Link>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0 d-flex justify-content-center fx-hue reveal-on-scroll anim-pop">
              <div className="card-neo p-3">
                <img
                  className="rounded-3 anim-parallax"
                  alt="Verifier dashboard preview"
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1600&auto=format&fit=crop"
                  style={{ maxWidth: "520px", width: "100%" }}
                />
                <small className="text-muted d-block mt-2">
                  Admin tools streamline objective verification and auditability.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Capabilities */}
      <section id="tools" className="py-5 sec-tools">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Core Admin Tools</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            Designed for rigorous MRV workflows with audit trails.
          </p>
          <div className="row g-4">
            {[
              {
                title: "Project Intake Queue",
                text:
                  "Prioritized queue with filters (status, date, ecosystem, risk score), bulk actions, SLA timers.",
                img:
                  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-flipX",
              },
              {
                title: "Evidence Review",
                text:
                  "Onset/monitoring photos, permits, lab reports with MIME checks and metadata previews.",
                img:
                  "https://images.unsplash.com/photo-1523958203904-cdcb402031fd?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-tilt",
              },
              {
                title: "Geo & Boundary Tools",
                text:
                  "Boundary validation (GeoJSON/KML), centroid checks, area computation, CRS normalization.",
                img:
                  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-rotateL",
              },
              {
                title: "MRV Analytics",
                text:
                  "Plot-level time series, NDVI/indices overlays, sampling schemas, QC flags and anomalies.",
                img:
                  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-zoomOut",
              },
              {
                title: "AI Assistance",
                text:
                  "Draft evidence summaries, flag inconsistencies, suggest follow-ups (admin-reviewed).",
                img:
                  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-fadeRight",
              },
              {
                title: "Decision & Anchoring",
                text:
                  "Approve/reject/needs-info, issue credits, compute package hash, anchor on-chain.",
                img:
                  "https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-diag",
              },
            ].map((card, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className={`card-neo h-100 p-3 reveal-on-scroll ${card.anim}`}>
                  <img
                    alt={card.title}
                    src={card.img}
                    className="rounded-3 mb-3 w-100"
                    style={{ height: 180, objectFit: "cover" }}
                  />
                  <h5 className="fw-bold">{card.title}</h5>
                  <p className="text-muted">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-5 sec-workflow">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-slideLong">Verification Workflow</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            A structured pathway from intake to issuance and anchoring.
          </p>
          <div className="row g-4">
            {[
              { step: "1. Intake", text: "Queueing, triage, duplicate checks, basic completeness review.", anim: "anim-fadeLeft" },
              { step: "2. Spatial", text: "Boundary geometry, centroid, area, coordinate range & CRS checks.", anim: "anim-fadeRight" },
              { step: "3. Evidence", text: "Photos/documents validation, lab report consistency, permits & consent.", anim: "anim-skew" },
              { step: "4. Methodology", text: "Method alignment, sampling design, uncertainty and assumptions.", anim: "anim-ripple" },
              { step: "5. MRV", text: "Time series, plots, indices overlays, QC flags and anomaly detection.", anim: "anim-blur" },
              { step: "6. Decision", text: "Approve/reject/needs-info with rationale; set issuance schedule.", anim: "anim-rotateR" },
              { step: "7. Anchoring", text: "Compute package hash; anchor to blockchain; store audit trail.", anim: "anim-zoomIn" },
              { step: "8. Notifications", text: "Notify proponents; expose public-safe info; lock approved data.", anim: "anim-tilt" },
            ].map((w, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className={`card-neo h-100 p-3 reveal-on-scroll ${w.anim}`}>
                  <h6 className="fw-bold">{w.step}</h6>
                  <p className="text-muted">{w.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Criteria */}
      <section id="criteria" className="py-5 sec-criteria">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Verification Criteria</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">Key checks to ensure integrity and auditability.</p>
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipX h-100">
                <h5 className="fw-bold">Spatial & Evidence</h5>
                <ul className="text-muted">
                  <li>Coordinates within valid ranges; area > 0; boundary polygon validity (no self-intersections).</li>
                  <li>Minimum evidence set: required count of photos and/or satellite tiles.</li>
                  <li>Permits/consent where applicable; confidentiality flags respected.</li>
                </ul>
                <h6 className="fw-bold mt-3">MRV & Methodology</h6>
                <ul className="text-muted">
                  <li>Method cited (e.g., IPCC, program methodologies), sampling plan defined.</li>
                  <li>Consistency across lab reports, field logs, and remote sensing indicators.</li>
                  <li>Uncertainty treatment and conservative assumptions documented.</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card-neo p-0 overflow-hidden reveal-on-scroll anim-rotateR h-100 bg-shimmer">
                <img src="https://images.unsplash.com/photo-1531972111231-7482a960e109?q=80&w=1600&auto=format&fit=crop" alt="Geospatial validation" style={{ width: "100%", height: 320, objectFit: "cover" }} />
                <div className="p-4">
                  <h5 className="fw-bold">Risk & Quality Control</h5>
                  <ul className="text-muted">
                    <li>Outlier detection in time series; data completeness thresholds.</li>
                    <li>Versioning for re-submissions; audit trail with immutable references.</li>
                    <li>Peer review / second-eyes for sensitive decisions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Standards */}
      <section id="research" className="py-5 sec-research">
        <div className="container">
          <h2 className="fw-bold text-center mb-4 reveal-on-scroll anim-fadeUp">Standards & Guidance</h2>
          <div className="row g-4">
            {[
              { name: "ICVCM - Core Carbon Principles", url: "https://icvcm.org/ccp/", desc: "Integrity framework for high-quality carbon credits." },
              { name: "VCMI - Claims Code of Practice", url: "https://vcmi.market/claims-code-of-practice/", desc: "Guidance on credible corporate claims using credits." },
              { name: "Verra - VCS Program", url: "https://verra.org/", desc: "One of the most used voluntary standards and methodologies." },
              { name: "Gold Standard - Certification", url: "https://www.goldstandard.org/", desc: "Certification standard emphasizing sustainable development." },
              { name: "IPCC - Wetlands Supplement", url: "https://www.ipcc-nggip.iges.or.jp/public/wetlands/", desc: "Methods for estimating emissions and removals in wetlands." },
              { name: "FAO MRV Guidance", url: "https://www.fao.org/", desc: "Technical resources on MRV and land use." },
            ].map((it, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card-neo p-3 h-100 reveal-on-scroll anim-glow">
                  <h5 className="fw-bold">{it.name}</h5>
                  <p className="text-muted">{it.desc}</p>
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">Open →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Admin */}
      <section id="about" className="py-5 sec-about">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card-neo p-4 reveal-on-scroll anim-fadeLeft">
                <h2 className="fw-bold mb-1">About the Admin Suite</h2>
                <div className="anim-line mt-2"><div className="line"></div></div>
                <p className="text-muted mt-3">
                  Built to support rigorous, transparent decisions. Tooling emphasizes reproducibility,
                  clear rationale, and auditability with minimal friction.
                </p>
                <h6 className="fw-bold mt-3">Principles</h6>
                <ul className="text-muted">
                  <li>Verifier-first workflows and clear checks</li>
                  <li>Evidence integrity and minimal subjectivity</li>
                  <li>Conservative, standards-aligned decisions</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card-neo p-0 overflow-hidden reveal-on-scroll anim-zoomIn">
                <img src="https://images.unsplash.com/photo-1451186859696-371d9477be93?q=80&w=1600&auto=format&fit=crop" alt="Admin technology" style={{ width: "100%", height: 340, objectFit: "cover" }} />
                <div className="p-4">
                  <h5 className="fw-bold">Security & Access</h5>
                  <p className="text-muted">
                    Role-based access (verifier, supervisor), session security best-practices, and immutable
                    logs for approved records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-5 sec-contact">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Contact</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            Request verifier onboarding or technical documentation.
          </p>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card-neo p-4 reveal-on-scroll anim-rotateL">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input className="form-control" placeholder="Your name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" placeholder="you@example.org" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={4} placeholder="Topic (onboarding, docs, support)..."></textarea>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary btn-glow">Send</button>
                  </div>
                </div>
                <small className="text-muted d-block mt-3">Note: Demo form in development.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help */}
      <section id="help" className="py-5 sec-help">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Help</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            Quick guidance for common admin actions.
          </p>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipX">
                <h5 className="fw-bold">Review Checklist</h5>
                <ul className="text-muted">
                  <li>Spatial validity: coordinates, boundary polygon, area</li>
                  <li>Evidence sufficiency: photos, documents, lab reports</li>
                  <li>Method alignment and MRV plan consistency</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipY">
                <h5 className="fw-bold">Support & Escalation</h5>
                <p className="text-muted">
                  Use second-eyes review for sensitive cases; document rationale and keep
                  audit logs current. Engage domain experts when needed.
                </p>
                <div className="d-flex gap-2">
                  <Link to="/admin/login" className="btn btn-outline-primary btn-sm">Login</Link>
                  <Link to="/admin/signup" className="btn btn-primary btn-sm text-white">Sign up</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-top py-4">
        <div className="container d-flex flex-column flex-lg-row align-items-center justify-content-between">
          <div className="text-muted small">© {new Date().getFullYear()} BlueChain Admin. All rights reserved.</div>
          <div className="d-flex gap-3 small">
            <a href="#about" className="text-decoration-none link-underline">About</a>
            <a href="#research" className="text-decoration-none link-underline">Standards</a>
            <a href="#contact" className="text-decoration-none link-underline">Contact</a>
            <a href="#help" className="text-decoration-none link-underline">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AdminLanding;
