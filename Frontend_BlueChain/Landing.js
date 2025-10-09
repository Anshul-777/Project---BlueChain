// src/Landing.js
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function LandingPage() {

  // Smooth scroll for in-page section links
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

  // Sidebar controls
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
    <div className="landing-root bg-white text-dark">
      <style>{`
        /* Base layout/theme */
        .landing-root { min-height: 100vh; overflow-x: hidden; }
        .brand-gradient { background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-blur { backdrop-filter: blur(10px); background: rgba(255,255,255,0.85); }
        .link-underline { position: relative; }
        .link-underline::after { content: ""; position: absolute; left: 0; bottom: -2px; height: 2px; width: 0; background: linear-gradient(90deg, #2563eb, #06b6d4); transition: width .25s ease; }
        .link-underline:hover::after { width: 100%; }
        .btn-glow:hover { box-shadow: 0 8px 24px rgba(37,99,235,.35); transform: translateY(-1px); }

        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 280px; z-index: 1100; background: #0b1220; color: #d1d5db; transform: translateX(-100%); transition: transform .35s ease; box-shadow: 8px 0 30px rgba(2,6,23,.28); }
        .sidebar a { color: #e5e7eb; text-decoration: none; display: block; padding: 10px 14px; border-radius: 8px; }
        .sidebar a:hover { background: rgba(59,130,246,.15); color: #fff; }
        .sidebar-open { transform: translateX(0); }
        .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity .3s ease; }
        .backdrop-show { opacity: 1; pointer-events: auto; }

        /* HERO background */
        .hero {
          position: relative; min-height: 92vh; display:flex; align-items:center; justify-content:center;
          background: radial-gradient(circle at 20% 10%, #e0f2fe 0%, #ffffff 48%);
          overflow:hidden;
        }
        .hero::before {
          content:""; position:absolute; inset:0;
          background-image:
            url("https://images.unsplash.com/photo-1614961514187-24d6a53e9e08?q=80&w=1600&auto=format&fit=crop"),
            url("https://images.unsplash.com/photo-1533119408463-b0f487eec1e8?q=80&w=1600&auto=format&fit=crop");
          background-size: cover, cover; background-position: center, center; mix-blend-mode: multiply; opacity: .10; pointer-events:none;
          animation: slowPan 24s ease-in-out infinite alternate;
        }

        /* 24 distinct animations (and utility effects) */
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
        @keyframes glowPulse { 0%{ box-shadow: 0 0 0 rgba(59,130,246,0);} 100%{ box-shadow: 0 0 30px rgba(59,130,246,0.35);} }
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
        .anim-line .line { height: 3px; background: linear-gradient(90deg, #2563eb, #06b6d4); width: 0; }
        .anim-line.in-view .line { animation: lineSweep 1s .15s ease forwards; }
        .anim-pop.in-view { animation: popIn .65s ease both; }
        .anim-slideLong.in-view { animation: slideUpLong .8s cubic-bezier(.2,.8,.2,1) both; }
        .anim-maskX.in-view { animation: revealMaskX .8s ease both; }
        .bg-shimmer { background: linear-gradient(90deg, rgba(203,213,225,0.25), rgba(59,130,246,0.12), rgba(203,213,225,0.25)); background-size: 200% 100%; animation: shimmerBg 4s linear infinite; }
        .fx-hue.in-view img { animation: hueShift 2.5s ease both; }

        /* Cards */
        .card-neo { background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.06); border-radius: 16px; box-shadow: 0 10px 30px rgba(2,6,23,.08); transition: transform .2s ease, box-shadow .2s ease; }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,.12); }

        /* Section tone variants for visual uniqueness */
        .sec-features { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
        .sec-how { background: #ffffff; }
        .sec-info { background: linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%); }
        .sec-research { background: #ffffff; }
        .sec-about { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
        .sec-contact { background: #ffffff; }
        .sec-help { background: linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%); }
      `}</style>

      {/* Header */}
      <header className="header-blur position-sticky top-0 z-50 w-100 border-bottom">
        <div className="container py-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <img
              src="/logo192.png"
              alt="BlueChain logo"
              width={40}
              height={40}
              className="rounded-circle shadow-sm anim-float"
            />
            <div>
              <div className="h4 m-0 brand-gradient fw-bold">BlueChain</div>
              <div className="small text-muted">Blue Carbon Registry & MRV</div>
            </div>
          </div>
          <nav className="d-none d-lg-flex align-items-center gap-4">
            <a href="#home" className="text-decoration-none text-dark link-underline">Home</a>
            <a href="#features" className="text-decoration-none text-dark link-underline">Features</a>
            <a href="#how" className="text-decoration-none text-dark link-underline">How it works</a>
            <a href="#info" className="text-decoration-none text-dark link-underline">Information</a>
            <a href="#research" className="text-decoration-none text-dark link-underline">Research</a>
            <a href="#about" className="text-decoration-none text-dark link-underline">About</a>
            <a href="#contact" className="text-decoration-none text-dark link-underline">Contact</a>
            <a href="#help" className="text-decoration-none text-dark link-underline">Help</a>
          </nav>
          <div className="d-none d-lg-flex align-items-center gap-2">
            <Link to="/login" className="btn btn-outline-primary btn-sm btn-glow">Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm btn-glow">Sign up</Link>
          </div>
          <button aria-label="Open menu" className="btn btn-light d-lg-none" onClick={openSidebar}>☰</button>
        </div>
      </header>

      {/* Sidebar */}
      <div ref={sidebarRef} className="sidebar p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="fw-bold">Menu</div>
          <button aria-label="Close menu" className="btn btn-sm btn-outline-light" onClick={closeSidebar}>×</button>
        </div>
        <hr className="border-secondary" />
        <a href="#home" onClick={closeSidebar}>Home</a>
        <a href="#features" onClick={closeSidebar}>Features</a>
        <a href="#how" onClick={closeSidebar}>How it works</a>
        <a href="#info" onClick={closeSidebar}>Information</a>
        <a href="#research" onClick={closeSidebar}>Research</a>
        <a href="#about" onClick={closeSidebar}>About</a>
        <a href="#contact" onClick={closeSidebar}>Contact</a>
        <a href="#help" onClick={closeSidebar}>Help</a>
        <hr className="border-secondary" />
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-info btn-sm w-50" onClick={closeSidebar}>Login</Link>
          <Link to="/signup" className="btn btn-info btn-sm text-white w-50" onClick={closeSidebar}>Sign up</Link>
        </div>
      </div>
      <div ref={backdropRef} className="backdrop" onClick={closeSidebar} />

      {/* Hero (Welcome) */}
      <section id="home" className="hero">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7 reveal-on-scroll anim-maskX">
              <div className="display-5 fw-bold brand-gradient">Welcome to BlueChain</div>
              <div className="reveal-on-scroll anim-line mt-2"><div className="line"></div></div>
              <p className="lead text-muted mt-3">
                A blockchain-based blue carbon registry and MRV system for registering, monitoring,
                and verifying coastal ecosystem restoration: mangroves, seagrasses, and salt marshes.
              </p>
              <ul className="text-muted mb-4">
                <li>Register Local or Organization projects with GPS, area, and evidence</li>
                <li>MRV via field data, lab reports, and satellite imagery</li>
                <li>Verifier approval gates on-chain anchoring and credit issuance</li>
              </ul>
              <div className="d-flex gap-2">
                <Link to="/signup" className="btn btn-primary btn-glow">Get Started</Link>
                <Link to="/login" className="btn btn-outline-primary btn-glow">Login</Link>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0 d-flex justify-content-center fx-hue reveal-on-scroll anim-pop">
              <div className="card-neo p-3">
                <img
                  className="rounded-3 anim-parallax"
                  alt="Mangrove ecosystem"
                  src="https://images.unsplash.com/photo-1610122767636-7cf8a2e8f0eb?q=80&w=1600&auto=format&fit=crop"
                  style={{ maxWidth: "520px", width: "100%" }}
                />
                <small className="text-muted d-block mt-2">
                  Healthy blue carbon ecosystems store carbon and protect coasts.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features (distinct animations per card) */}
      <section id="features" className="py-5 sec-features">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Key Features</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            Transparent registry, rigorous evidence, and verifiable outcomes.
          </p>
          <div className="row g-4">
            {[
              {
                title: "Project Registry",
                text:
                  "Register Local/Org projects with coordinates, area, photos, permits, and digital signatures.",
                img:
                  "https://images.unsplash.com/photo-1546500840-ae38253aba9b?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-flipX",
              },
              {
                title: "MRV & Analytics",
                text:
                  "Monitoring, Reporting, Verification with field sampling, lab analysis, and satellite data.",
                img:
                  "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-tilt",
              },
              {
                title: "Evidence & Compliance",
                text:
                  "Baseline, methodology, permits, community consent, audit-ready document storage.",
                img:
                  "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-rotateL",
              },
              {
                title: "Blockchain Anchoring",
                text:
                  "Hash project packages and anchor post-approval for immutable traceability.",
                img:
                  "https://images.unsplash.com/photo-1500920514900-04eb1e7d2b71?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-zoomOut",
              },
              {
                title: "Admin Verification",
                text:
                  "Verifier dashboard to approve/reject and manage credits with recognized standards.",
                img:
                  "https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?q=80&w=1600&auto=format&fit=crop",
                anim: "anim-fadeRight",
              },
              {
                title: "Credits & Impact",
                text:
                  "Connect restoration outcomes to credits, prioritizing rigorous methods and benefits.",
                img:
                  "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=1600&auto=format&fit=crop",
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

      {/* How it works (timeline-style, different animations) */}
      <section id="how" className="py-5 sec-how">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-slideLong">How It Works</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            From registration to verification and on-chain anchoring.
          </p>
          <div className="row g-4">
            {[
              {
                step: "1. Register",
                text:
                  "Create a project (Local/Org). Provide GPS, area, ecosystem types, evidence (photos, permits), and digital signatures.",
                anim: "anim-fadeLeft",
              },
              {
                step: "2. Monitor",
                text:
                  "Upload monitoring evidence (photos, lab reports, satellite). Define methodology and monitoring plan.",
                anim: "anim-fadeRight",
              },
              {
                step: "3. Verify",
                text:
                  "Verifier reviews evidence, validates spatial/baseline data, and approves or requests changes.",
                anim: "anim-skew",
              },
              {
                step: "4. Anchor",
                text:
                  "Upon approval, compute project package hash and anchor on-chain for immutable traceability.",
                anim: "anim-ripple",
              },
              {
                step: "5. Credits",
                text:
                  "Issue credits where applicable, aligned with accepted standards and safeguards.",
                anim: "anim-blur",
              },
            ].map((it, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className={`card-neo h-100 p-3 reveal-on-scroll ${it.anim}`}>
                  <h5 className="fw-bold">{it.step}</h5>
                  <p className="text-muted">{it.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Information (Blue carbon, CC, MRV) */}
      <section id="info" className="py-5 sec-info">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipY h-100">
                <h2 className="fw-bold mb-1">Blue Carbon & MRV</h2>
                <div className="reveal-on-scroll anim-line mt-2"><div className="line"></div></div>
                <p className="text-muted mt-3">
                  Blue carbon refers to carbon captured by oceanic and coastal ecosystems—mangroves,
                  seagrasses, and salt marshes. These systems store carbon in biomass and especially
                  in sediments, contributing to climate mitigation and coastal protection.
                </p>
                <h6 className="mt-3 fw-bold">MRV (Monitoring, Reporting, Verification)</h6>
                <p className="text-muted">
                  MRV ensures transparency and credibility using field sampling, lab analysis,
                  and geospatial data. Verification aligns outcomes with recognized methodologies.
                </p>
                <h6 className="mt-3 fw-bold">Carbon Credits (CC)</h6>
                <p className="text-muted">
                  Verified reductions/removals may be issued as credits following standards and
                  only after independent verification. BlueChain supports data capture and verification;
                  anchoring occurs post-approval for integrity.
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card-neo p-0 overflow-hidden reveal-on-scroll anim-rotateR h-100 bg-shimmer">
                <img
                  src="https://images.unsplash.com/photo-1540755107611-967174e22a2a?q=80&w=1600&auto=format&fit=crop"
                  alt="Seagrass meadow"
                  style={{ width: "100%", height: 320, objectFit: "cover" }}
                />
                <div className="p-4">
                  <h5 className="fw-bold">Ecosystems</h5>
                  <ul className="text-muted">
                    <li>Mangroves: intertidal forests with high sediment carbon burial.</li>
                    <li>Seagrasses: underwater meadows stabilizing sediments.</li>
                    <li>Salt marshes: tidal wetlands with strong organic accumulation.</li>
                  </ul>
                  <h6 className="fw-bold">Data Inputs</h6>
                  <ul className="text-muted">
                    <li>GPS/area, boundary files (GeoJSON/KML), photos</li>
                    <li>Lab reports (soil/biomass), satellite indices (e.g., NDVI)</li>
                    <li>Methodology, monitoring plan, permits, consent</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research (real links) */}
      <section id="research" className="py-5 sec-research">
        <div className="container">
          <h2 className="fw-bold text-center mb-4 reveal-on-scroll anim-fadeUp">Research & Standards</h2>
          <div className="row g-4">
            {[
              {
                name: "Blue Carbon Initiative",
                url: "https://www.thebluecarboninitiative.org/",
                desc: "Global partnership focused on coastal ecosystems in climate mitigation.",
              },
              {
                name: "IPCC Wetlands Supplement",
                url: "https://www.ipcc-nggip.iges.or.jp/public/wetlands/",
                desc: "Guidance for national inventories, including coastal wetland methods.",
              },
              {
                name: "UNEP Blue Carbon",
                url: "https://www.unep.org/explore-topics/oceans-seas/what-we-do/working-coastal-ecosystems/blue-carbon",
                desc: "UNEP resources on blue carbon ecosystems and policy.",
              },
              {
                name: "Verra VM0033 (Mangroves)",
                url: "https://verra.org/methodologies/vm0033-mredd-for-wetlands/",
                desc: "Program methodology elements for mangrove restoration.",
              },
              {
                name: "NOAA Blue Carbon",
                url: "https://oceanservice.noaa.gov/ecosystems/coasts/bluecarbon.html",
                desc: "NOAA overview and resources on blue carbon science/management.",
              },
              {
                name: "FAO Blue Carbon",
                url: "https://www.fao.org/americas/prioridades/ambiente-y-cambio-climatico/blue-carbon/en/",
                desc: "FAO materials on blue carbon initiatives.",
              },
            ].map((it, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card-neo p-3 h-100 reveal-on-scroll anim-glow">
                  <h5 className="fw-bold">{it.name}</h5>
                  <p className="text-muted">{it.desc}</p>
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                    Visit resource →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About (different tone) */}
      <section id="about" className="py-5 sec-about">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card-neo p-4 reveal-on-scroll anim-fadeLeft">
                <h2 className="fw-bold mb-1">About BlueChain</h2>
                <div className="reveal-on-scroll anim-line mt-2"><div className="line"></div></div>
                <p className="text-muted mt-3">
                  BlueChain enables trustworthy blue carbon project registration, monitoring,
                  and verification—prioritizing scientific rigor, transparency, and community impact.
                  Blockchain anchoring is applied post-approval to provide immutable traceability.
                </p>
                <h6 className="fw-bold mt-3">Design Principles</h6>
                <ul className="text-muted">
                  <li>Clarity of evidence and methodology</li>
                  <li>Verifier-first, audit-ready workflows</li>
                  <li>Open information with confidentiality controls</li>
                  <li>Compatibility with recognized standards</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card-neo p-0 overflow-hidden reveal-on-scroll anim-zoomIn">
                <img
                  src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1600&auto=format&fit=crop"
                  alt="Coastal marsh"
                  style={{ width: "100%", height: 340, objectFit: "cover" }}
                />
                <div className="p-4">
                  <h5 className="fw-bold">Community & Integrity</h5>
                  <p className="text-muted">
                    We emphasize additionality, permanence, and safeguards. Community inclusion and
                    benefits are central, alongside transparent documentation and monitoring.
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
            Collaboration, research support, or verification access.
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
                    <input type="email" className="form-control" placeholder="you@example.com" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={4} placeholder="How can we help?"></textarea>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary btn-glow">Send</button>
                  </div>
                </div>
                <small className="text-muted d-block mt-3">
                  Note: This demo form does not send email in development mode.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help (distinct style) */}
      <section id="help" className="py-5 sec-help">
        <div className="container">
          <h2 className="fw-bold text-center mb-1 reveal-on-scroll anim-fadeUp">Help</h2>
          <p className="text-center text-muted mb-4 reveal-on-scroll anim-fadeDown">
            Start with Guidelines and Research links for project registration and MRV.
          </p>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipX">
                <h5 className="fw-bold">Registry Guidance</h5>
                <ul className="text-muted">
                  <li>Use accurate lat/lng, area (ha), and ensure evidence files meet size/type limits.</li>
                  <li>For organizations: include methodology, monitoring plan, and species details.</li>
                  <li>Attach permits/consents where applicable and set confidentiality flags responsibly.</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-neo p-4 reveal-on-scroll anim-flipY">
                <h5 className="fw-bold">Support</h5>
                <p className="text-muted">
                  Refer to listed resources, engage domain experts, and coordinate with verifiers
                  to ensure completeness and methodological alignment.
                </p>
                <div className="d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-primary btn-sm">Login</Link>
                  <Link to="/signup" className="btn btn-primary btn-sm text-white">Sign up</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-top py-4">
        <div className="container d-flex flex-column flex-lg-row align-items-center justify-content-between">
          <div className="text-muted small">© {new Date().getFullYear()} BlueChain. All rights reserved.</div>
          <div className="d-flex gap-3 small">
            <a href="#about" className="text-decoration-none link-underline">About</a>
            <a href="#research" className="text-decoration-none link-underline">Research</a>
            <a href="#contact" className="text-decoration-none link-underline">Contact</a>
            <a href="#help" className="text-decoration-none link-underline">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
