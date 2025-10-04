// src/HomePage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Offcanvas,
  Button,
  Card,
  Row,
  Col,
  Collapse,
  Form,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
  InputGroup,
} from "react-bootstrap";
import {
  FiMenu,
  FiHome,
  FiPlusCircle,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiSettings,
  FiUser,
  FiChevronDown,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiExternalLink,
  FiMapPin,
  FiSun,
  FiMoon,
  FiRefreshCw,
  FiZap,
  FiGrid,
  FiLayers,
  FiMap,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Leaflet (CDN) for map
const ensureLeaflet = () =>
  new Promise((resolve, reject) => {
    if (window.L && window.L.map) {
      resolve();
      return;
    }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    } else {
      resolve();
    }
  });

// Chatbot widget (draggable, OpenAI-ready)
const ChatBotWidget = ({ theme = "light" }) => {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I’m BlueCarbon Assistant. Ask me about your projects." },
  ]);
  const [input, setInput] = useState("");

  // IMPORTANT: Insert your real key before enabling calls below. Keep it secret.
  // const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";
  const OPENAI_API_KEY = ""; // leave empty to disable network calls

  const onMouseDown = (e) => {
    setDragging(true);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPos({ x: Math.max(10, e.clientX - offset.x), y: Math.max(10, e.clientY - offset.y) });
  };
  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => onMouseMove(e);
    const mu = () => onMouseUp();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    const userMsg = { from: "user", text: content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (!OPENAI_API_KEY) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text:
              "AI not configured. Add your OpenAI API key in HomePage.js (OPENAI_API_KEY) to enable real replies.",
          },
        ]);
      }, 300);
      return;
    }

    try {
      // Simple Chat Completions call (gpt-4o-mini or gpt-3.5-turbo)
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are BlueCarbon Assistant for a blue carbon registry." },
            { role: "user", content },
          ],
        }),
      });
      const data = await resp.json();
      const text =
        data?.choices?.[0]?.message?.content ||
        "Sorry, I could not get a response. Check your API key.";
      setMessages((prev) => [...prev, { from: "bot", text }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Network error contacting OpenAI. Please try again later." },
      ]);
    }
  };

  return (
    <>
      <style>{`
        .bot-fab {
          position: fixed; right: ${pos.x}px; bottom: ${pos.y}px; z-index: 9999;
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #4f46e5);
          box-shadow: 0 14px 40px rgba(2,6,23,0.25);
          display: flex; align-items: center; justify-content: center;
          cursor: grab; transition: transform .15s ease, box-shadow .15s ease;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .bot-fab:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 18px 50px rgba(2,6,23,0.35); }
        .bot-fab:active { cursor: grabbing; }
        .bot-face {
          width: 36px; height: 36px; border-radius: 10px; background: #fff; color: #0ea5e9;
          display: grid; place-items: center; font-size: 18px; font-weight: 900;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.08);
        }
        .bot-window {
          position: fixed; right: ${pos.x + 72}px; bottom: ${pos.y}px; z-index: 9999;
          width: 340px; max-height: 440px; border-radius: 16px; overflow: hidden;
          background: ${theme === "dark" ? "#0f172a" : "#ffffff"};
          color: ${theme === "dark" ? "#e5e7eb" : "#0f172a"};
          box-shadow: 0 24px 60px rgba(2,6,23,0.35);
          border: 1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"};
          animation: slideIn .25s ease both;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .bot-header {
          background: linear-gradient(135deg, #0ea5e9, #4f46e5); color: white; padding: 10px 12px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .bot-messages { padding: 10px; overflow: auto; max-height: 300px; }
        .msg { margin: 8px 0; padding: 8px 10px; border-radius: 12px; max-width: 85%; box-shadow: 0 4px 12px rgba(2,6,23,0.05); }
        .msg-bot { background: ${theme === "dark" ? "#0b1224" : "#f8fafc"}; }
        .msg-user { background: ${theme === "dark" ? "#1f2937" : "#e0f2fe"}; margin-left: auto; }
      `}</style>
      <div
        className="bot-fab"
        onMouseDown={(e) => {
          setDragging(true);
          setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
        }}
        onDoubleClick={() => setOpen((o) => !o)}
        title="Ask BlueCarbon Assistant"
      >
        <div className="bot-face">🤖</div>
      </div>
      {open && (
        <div className="bot-window" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
          <div className="bot-header">
            <div className="d-flex align-items-center gap-2">
              <span>🤖</span>
              <strong>BlueCarbon Assistant</strong>
            </div>
            <Button size="sm" variant="light" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          <div className="bot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === "bot" ? "msg-bot" : "msg-user"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-2">
            <InputGroup>
              <Form.Control
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>Send</Button>
            </InputGroup>
            <div className="text-muted small mt-1">
              Insert your OpenAI API key in HomePage.js to enable responses.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;

  // THEME (no localStorage; session only)
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // LIVE CLOCK
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtTime = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);

  // SIDEBAR
  const [showSidebar, setShowSidebar] = useState(false);
  const [open, setOpen] = useState({
    overview: true,
    project: true,
    monitoring: false,
    ai: false,
  });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // DATA
  const [projects, setProjects] = useState([]); // enriched
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Controls
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all|local|org
  const [ecosystemFilter, setEcosystemFilter] = useState("any"); // any|mangrove|seagrass|saltMarsh|mudflat|sediment|other
  const [sortKey, setSortKey] = useState("createdAt"); // createdAt|name|type|area
  const [sortDir, setSortDir] = useState("desc"); // asc|desc

  // MAP
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch list and full details to avoid placeholders
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setFetchError("");
      try {
        const listResp = await fetch("/api/projects?type=all");
        if (!listResp.ok) throw new Error(`HTTP ${listResp.status}`);
        const listData = await listResp.json();
        if (!listData.success) throw new Error("API error");
        const baseRows = (listData.rows || []).map((r) => ({
          id: r.id,
          type: r.type || (r.organization_name ? "org" : "local"),
          title: r.project_title || "",
          name: r.name || r.organization_name || r.owner_name || "",
          country: r.country || "",
          placeName: r.place_name || "",
          areaHa: r.area_ha ?? null,
          createdAt: r.created_at ? new Date(r.created_at) : null,
        }));

        // Fetch full details per project (no placeholders)
        const details = await Promise.all(
          baseRows.map(async (p) => {
            try {
              const r = await fetch(`/api/projects/${p.id}?type=${p.type}`);
              if (!r.ok) return { ...p };
              const d = await r.json();
              if (!d.success) return { ...p };
              const proj = d.project || {};
              const files = d.files || [];
              const species = d.species || [];
              return {
                ...p,
                // override with detailed canonical fields
                title: proj.project_title || p.title,
                country: proj.country || p.country,
                placeName: proj.place_name || p.placeName,
                areaHa: proj.area_ha ?? p.areaHa,
                createdAt: proj.created_at ? new Date(proj.created_at) : p.createdAt,
                lat: proj.lat ?? null,
                lng: proj.lng ?? null,
                ecosystems: proj.ecosystems || {}, // JSONB
                plantTypes: proj.plant_types || {},
                approxPlants: proj.approx_plants || null,
                monitoringPlan: proj.monitoring_plan || null,
                soilBulkDensity: proj.soil_bulk_density ?? null,
                soilOrganicCarbonPercent: proj.soil_organic_carbon_percent ?? null,
                waterSalinityPsu: proj.water_salinity_psu ?? null,
                waterPh: proj.water_ph ?? null,
                speciesList: species, // org only
                files, // list of file records with type
                status: "pending", // default until admin verification (server will update later)
              };
            } catch {
              return { ...p };
            }
          })
        );
        if (!alive) return;
        setProjects(details);
      } catch (e) {
        if (!alive) return;
        setFetchError(e.message || "Failed to fetch projects");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  // Derived filters and sorts (no placeholders; operate on actual values)
  const filtered = useMemo(() => {
    let arr = [...projects];
    if (typeFilter !== "all") arr = arr.filter((p) => p.type === typeFilter);
    if (ecosystemFilter !== "any") {
      arr = arr.filter((p) => !!(p.ecosystems && p.ecosystems[ecosystemFilter]));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(s) ||
          (p.name || "").toLowerCase().includes(s) ||
          (p.placeName || "").toLowerCase().includes(s) ||
          (p.country || "").toLowerCase().includes(s)
      );
    }
    arr.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return mul * (a.title || "").localeCompare(b.title || "");
      if (sortKey === "type") return mul * (a.type || "").localeCompare(b.type || "");
      if (sortKey === "area")
        return mul * (((a.areaHa ?? 0) as number) - ((b.areaHa ?? 0) as number));
      const ad = a.createdAt ? a.createdAt.getTime() : 0;
      const bd = b.createdAt ? b.createdAt.getTime() : 0;
      return mul * (ad - bd);
    });
    return arr;
  }, [projects, typeFilter, ecosystemFilter, search, sortKey, sortDir]);

  const localProjects = filtered.filter((p) => p.type === "local");
  const orgProjects = filtered.filter((p) => p.type === "org");

  // KPI counts
  const totalProjects = projects.length;
  const pending = projects.filter((p) => p.status === "pending").length;
  const verified = projects.filter((p) => p.status === "verified").length;
  const rejected = projects.filter((p) => p.status === "rejected").length;

  // Timeline from real createdAt
  const timelineData = useMemo(() => {
    if (!projects.length) return [];
    const counts = new Map();
    projects.forEach((p) => {
      const d = p.createdAt || new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort()
      .map(([month, projects]) => ({ month, projects }));
  }, [projects]);

  // Carbon estimation derived from ecosystem + area (no dummy fixed constant without relation):
  // Use ecosystem factors from literature ranges (tCO2e/ha/yr) as constants:
  // Mangrove 6.0, Seagrass 1.25, Salt marsh 2.0, Mudflat 0.7, Sediment 1.1, Other 1.0
  const ECO_FACTORS = {
    mangrove: 6.0,
    seagrass: 1.25,
    saltMarsh: 2.0,
    mudflat: 0.7,
    sediment: 1.1,
    other: 1.0,
  };
  const totalAnnualCO2 = useMemo(() => {
    // Sum per project: area * sum(factors for selected ecosystems) [cap at selecting multiple]
    return projects.reduce((acc, p) => {
      const area = Number(p.areaHa) || 0;
      if (!area || !p.ecosystems) return acc;
      const fSum = Object.entries(p.ecosystems).reduce((facc, [k, v]) => {
        if (v && ECO_FACTORS[k]) facc += ECO_FACTORS[k];
        return facc;
      }, 0);
      return acc + area * (fSum || 0);
    }, 0);
  }, [projects]);

  // Plants by type from actual data
  const plantsByType = useMemo(() => {
    const agg = { mangroves: 0, seagrasses: 0, tidalMarshes: 0 };
    projects.forEach((p) => {
      if (p.type === "local") {
        if (p.numMangroves) agg.mangroves += Number(p.numMangroves);
        if (p.numSeagrasses) agg.seagrasses += Number(p.numSeagrasses);
        if (p.numTidalMarshes) agg.tidalMarshes += Number(p.numTidalMarshes);
        if (!p.numMangroves && !p.numSeagrasses && !p.numTidalMarshes && p.approxPlants) {
          agg.mangroves += Number(p.approxPlants); // fallback for locals with approx only
        }
      } else {
        // org: prefer speciesList counts
        if (Array.isArray(p.speciesList) && p.speciesList.length) {
          const sum = p.speciesList.reduce(
            (s, r) => s + (Number(r.count_planted || r.countPlanted) || 0),
            0
          );
          agg.mangroves += sum; // show total in mangrove bucket when unknown type
        } else {
          if (p.numMangroves) agg.mangroves += Number(p.numMangroves);
          if (p.numSeagrasses) agg.seagrasses += Number(p.numSeagrasses);
          if (p.numTidalMarshes) agg.tidalMarshes += Number(p.numTidalMarshes);
        }
      }
    });
    return [
      { label: "Mangroves", value: agg.mangroves, color: "#10b981" },
      { label: "Seagrasses", value: agg.seagrasses, color: "#0ea5e9" },
      { label: "Tidal Marshes", value: agg.tidalMarshes, color: "#a78bfa" },
    ];
  }, [projects]);

  // Map markers (from real lat/lng)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await ensureLeaflet();
        if (!alive) return;
        const L = window.L;
        if (!mapRef.current) return;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [20.5937, 78.9629],
          zoom: 3,
          worldCopyJump: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const withCoords = filtered.filter(
          (p) => p.lat != null && p.lng != null && !Number.isNaN(Number(p.lat)) && !Number.isNaN(Number(p.lng))
        );
        withCoords.forEach((p) => {
          const marker = L.marker([Number(p.lat), Number(p.lng)]).addTo(mapInstanceRef.current);
          marker.bindPopup(
            `<div><strong>${p.title || "Untitled"}</strong><br/>${p.placeName || ""}, ${
              p.country || ""
            }<br/><em>${(p.type || "").toUpperCase()}</em></div>`
          );
          markersRef.current.push(marker);
        });
        if (withCoords.length) {
          const grp = L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(grp.getBounds().pad(0.25));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [filtered]);

  const statusBadge = (status) => {
    const map = {
      verified: { text: "Verified", bg: "success" },
      pending: { text: "Pending", bg: "warning" },
      rejected: { text: "Rejected", bg: "danger" },
    };
    const cfg = map[status] || map.pending;
    return (
      <Badge bg={cfg.bg} pill className="ms-1">
        {cfg.text}
      </Badge>
    );
  };

  const themeVars = theme === "dark" ? "theme-dark" : "theme-light";

  // UI-only delete (no placeholders; does not call server DELETE yet)
  const handleDelete = (proj) => {
    if (!window.confirm("Delete this project from your view?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== proj.id));
  };

  // Utils
  const projectCode = (id) => (id ? String(id).slice(0, 8).toUpperCase() : "---------");
  const createdLabel = (d) =>
    d ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

  return (
    <div className={`${themeVars}`} style={{ minHeight: "100vh" }}>
      <style>{`
        :root {
          --bg: #f1f5f9;
          --text: #0f172a;
          --muted: #64748b;
          --card: #ffffff;
          --primary1: #4f46e5;
          --primary2: #0ea5e9;
          --accent: #22c55e;
          --danger: #ef4444;
          --kpi: #0ea5e910;
          --shadow: rgba(2,6,23,0.18);
        }
        .theme-dark {
          --bg: #0b1020;
          --text: #e5e7eb;
          --muted: #93a2b1;
          --card: #0f172a;
          --primary1: #6d5ce7;
          --primary2: #22c1dc;
          --accent: #22d3ee;
          --danger: #f87171;
          --kpi: #22c55e15;
          --shadow: rgba(2,6,23,0.42);
        }
        body, .theme-light, .theme-dark { background: var(--bg); color: var(--text); }

        .nav-gradient {
          background: linear-gradient(135deg, var(--primary1), var(--primary2)) !important;
        }
        .brand-logo { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.25)); }
        .quick-btn {
          border-radius: 12px;
          padding: 8px 12px;
          color: white !important;
          background: rgba(255,255,255,0.14);
          transition: transform .15s ease, background .2s ease;
          border: 1px solid rgba(255,255,255,0.18);
        }
        .quick-btn:hover { transform: translateY(-2px); background: rgba(255,255,255,0.22); }

        .hero {
          background: radial-gradient(1200px 600px at 10% -20%, rgba(14,165,233,0.22), transparent),
                      radial-gradient(1000px 550px at 90% -10%, rgba(79,70,229,0.18), transparent),
                      linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 24px 60px var(--shadow);
          overflow: hidden;
          animation: fadeIn .6s ease both;
        }

        .card-neo {
          background: var(--card);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 28px var(--shadow);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 42px var(--shadow); }
        .kpi {
          background: var(--kpi);
          border: 1px dashed rgba(14,165,233,0.4);
          border-radius: 14px;
          padding: 12px 16px;
          animation: popIn .4s ease both;
        }
        .fadein { animation: fadeUp .45s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to {opacity:1; transform: translateY(0);} }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .sidebar-footer {
          border-top: 1px solid rgba(255,255,255,0.15);
          padding-top: 10px;
        }
        .glow:hover { filter: drop-shadow(0 0 10px rgba(14,165,233,0.6)); }
        .map-box { height: 360px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); }

        .h-scroll {
          display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scroll-behavior: smooth;
        }
        .h-scroll::-webkit-scrollbar { height: 8px; }
        .h-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 8px; }

        .project-title { font-weight: 700; letter-spacing: .2px; }
        .badge-soft {
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(14,165,233,0.1);
          color: var(--text);
        }
      `}</style>

      {/* Navbar */}
      <Navbar expand={false} fixed="top" className="px-3 nav-gradient">
        <Container fluid>
          <Button variant="outline-light" onClick={() => setShowSidebar(true)} className="me-2 glow">
            <FiMenu size={18} />
          </Button>

          <Navbar.Brand className="d-flex align-items-center text-white">
            <img
              src="/images/logo.jpg"
              width="40"
              height="40"
              className="me-2 rounded-circle brand-logo"
              alt="logo"
            />
            <span className="fw-bold">BLUECARBON</span>
          </Navbar.Brand>

          <Nav className="mx-auto d-flex flex-row gap-3">
            <Nav.Link as={Link} to="/dashboard" className="text-white quick-btn">
              <FiHome className="me-1" /> Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/register" className="text-white quick-btn">
              <FiPlusCircle className="me-1" /> Register
            </Nav.Link>
            <Nav.Link as={Link} to="/mrv" className="text-white quick-btn">
              <FiTrendingUp className="me-1" /> MRV
            </Nav.Link>
            <Nav.Link as={Link} to="/verification" className="text-white quick-btn">
              <FiClock className="me-1" /> Verification
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-2">
            <div className="text-white small fw-bold me-2">{fmtTime}</div>
            <Button
              variant="outline-light"
              className="glow"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </Button>
            <div className="text-white fw-bold border px-2 py-1 rounded">
              {user?.name || "User"}
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
        className="nav-gradient text-white"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="fw-bold">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column h-100">
          <Nav className="flex-column gap-2">
            <div
              className="d-flex justify-content-between align-items-center fw-semibold"
              style={{ cursor: "pointer" }}
              onClick={() => toggle("overview")}
            >
              <span><FiHome className="me-2" /> Overview</span>
              <FiChevronDown
                style={{
                  transition: "transform .25s",
                  transform: open.overview ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>
            <Collapse in={open.overview}>
              <div>
                <Nav.Link as={Link} to="/dashboard" className="text-white ms-4">▸ Dashboard</Nav.Link>
              </div>
            </Collapse>

            <div
              className="d-flex justify-content-between align-items-center fw-semibold mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => toggle("project")}
            >
              <span><FiPlusCircle className="me-2" /> Project</span>
              <FiChevronDown
                style={{
                  transition: "transform .25s",
                  transform: open.project ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>
            <Collapse in={open.project}>
              <div>
                <Nav.Link as={Link} to="/register" className="text-white ms-4">▸ Register</Nav.Link>
                <Nav.Link as={Link} to="/manage" className="text-white ms-4">▸ Manage</Nav.Link>
                <Nav.Link as={Link} to="/report" className="text-white ms-4">▸ Report</Nav.Link>
                <Nav.Link as={Link} to="/credits" className="text-white ms-4">▸ Credits</Nav.Link>
                <Nav.Link as={Link} to="/history" className="text-white ms-4">▸ History</Nav.Link>
              </div>
            </Collapse>

            <div
              className="d-flex justify-content-between align-items-center fw-semibold mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => toggle("monitoring")}
            >
              <span><FiTrendingUp className="me-2" /> Monitoring</span>
              <FiChevronDown
                style={{
                  transition: "transform .25s",
                  transform: open.monitoring ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>
            <Collapse in={open.monitoring}>
              <div>
                <Nav.Link as={Link} to="/verified" className="text-white ms-4">▸ Verified</Nav.Link>
                <Nav.Link as={Link} to="/pending" className="text-white ms-4">▸ Pending</Nav.Link>
                <Nav.Link as={Link} to="/rejected" className="text-white ms-4">▸ Rejected</Nav.Link>
              </div>
            </Collapse>

            <div
              className="d-flex justify-content-between align-items-center fw-semibold mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => toggle("ai")}
            >
              <span><FiLayers className="me-2" /> AI</span>
              <FiChevronDown
                style={{
                  transition: "transform .25s",
                  transform: open.ai ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>
            <Collapse in={open.ai}>
              <div>
                <Nav.Link as={Link} to="/analysis" className="text-white ms-4">▸ Analysis</Nav.Link>
              </div>
            </Collapse>
          </Nav>

          <div className="mt-auto sidebar-footer">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiUser />
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold">{user?.name || "User"}</div>
                <div className="small">Member</div>
              </div>
              <Link to="/settings" className="text-white">
                <FiSettings />
              </Link>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* CONTENT */}
      <Container fluid className="pt-5 mt-5">
        {/* HERO: Connect + KPIs */}
        <Card className="p-4 mt-3 hero">
          <Row className="align-items-center">
            <Col lg={8} md={12} className="mb-3 mb-lg-0">
              <h2 className="fw-bold mb-2">Connect Wallet / Blockchain</h2>
              <div className="text-muted mb-3">
                Link your wallet to enable anchoring of approved project hashes on-chain. Admins verify
                first; only approved projects are anchored.
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button as={Link} to="/connect" size="lg" className="glow">
                  <FiZap className="me-2" /> Connect Now
                </Button>
                <Button variant="outline-light" as={Link} to="/learn">
                  Learn More
                </Button>
                <Button variant="outline-light" onClick={() => setRefreshTick((t) => t + 1)}>
                  <FiRefreshCw className="me-1" /> Refresh
                </Button>
              </div>
            </Col>
            <Col lg={4} md={12}>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="kpi">
                    <div className="small text-muted">Annual tCO₂ (est)</div>
                    <div className="h4 fw-bold">{totalAnnualCO2.toFixed(1)}</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="kpi">
                    <div className="small text-muted">Issued Credits</div>
                    <div className="h4 fw-bold">{0}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="kpi">
                    <div className="small text-muted">Projects</div>
                    <div className="h5 fw-bold">{totalProjects}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="kpi">
                    <div className="small text-muted">Pending</div>
                    <div className="h5 fw-bold">{pending}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="kpi">
                    <div className="small text-muted">Verified</div>
                    <div className="h5 fw-bold">{verified}</div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Controls */}
        <div className="d-flex align-items-center justify-content-between mt-4">
          <div className="d-flex align-items-center gap-2">
            <h3 className="fw-bold mb-0">Projects</h3>
            <Badge bg="info" text="dark">
              {filtered.length}
            </Badge>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="primary" as={Link} to="/register" className="glow">
              <FiPlusCircle className="me-1" /> Register Project
            </Button>
            <InputGroup>
              <InputGroup.Text>
                <FiSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search name / place / country"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: 260 }}
              />
            </InputGroup>
            <Form.Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ minWidth: 140 }}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="local">Local</option>
              <option value="org">Organization</option>
            </Form.Select>
            <Form.Select
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value)}
              style={{ minWidth: 160 }}
              aria-label="Filter by ecosystem"
            >
              <option value="any">Any Ecosystem</option>
              <option value="mangrove">Mangrove</option>
              <option value="seagrass">Seagrass</option>
              <option value="saltMarsh">Salt marsh</option>
              <option value="mudflat">Coastal mudflat</option>
              <option value="sediment">Coastal sediment</option>
              <option value="other">Other</option>
            </Form.Select>
            <InputGroup style={{ minWidth: 260 }}>
              <InputGroup.Text>
                <FiFilter />
              </InputGroup.Text>
              <Form.Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="area">Sort by Area</option>
              </Form.Select>
              <Button
                variant="outline-secondary"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={`Toggle ${sortDir.toUpperCase()}`}
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </Button>
            </InputGroup>
          </div>
        </div>

        {/* Empty state */}
        {!loading && !filtered.length && (
          <Card className="p-4 mt-3 card-neo">
            <div className="d-flex align-items-center gap-2">
              <FiAlertTriangle />
              <strong>No projects.</strong>
            </div>
            <div className="text-muted mt-1">
              Click “Register Project” to add your first project. Analytics start when your first project is created.
            </div>
          </Card>
        )}

        {/* Horizontal categories */}
        {!!localProjects.length && (
          <>
            <div className="d-flex align-items-center gap-2 mt-4">
              <FiGrid />
              <h5 className="mb-0">Local Projects</h5>
            </div>
            <div className="h-scroll mt-2">
              {localProjects.map((p) => (
                <Card key={p.id} className="p-3 card-neo" style={{ minWidth: 320 }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="project-title">{p.title || "Untitled"}</div>
                      <div className="text-muted small">
                        #{projectCode(p.id)} • {p.placeName || "—"}, {p.country || "—"}
                      </div>
                      <div className="mt-1">
                        <Badge bg="secondary">Local</Badge>
                        {statusBadge(p.status)}
                      </div>
                    </div>
                    <div className="text-end small text-muted">{createdLabel(p.createdAt)}</div>
                  </div>
                  <div className="small mt-2">
                    Area: <strong>{p.areaHa ?? "—"}</strong> ha
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => navigate(`/project/${p.id}?type=${p.type}`)}
                    >
                      <FiExternalLink className="me-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${encodeURIComponent(
                            `${p.lat || ""},${p.lng || ""}`
                          )}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <FiMap className="me-1" /> Open Map
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p)}>
                      <FiTrash2 className="me-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {!!orgProjects.length && (
          <>
            <div className="d-flex align-items-center gap-2 mt-4">
              <FiLayers />
              <h5 className="mb-0">Organization Projects</h5>
            </div>
            <div className="h-scroll mt-2">
              {orgProjects.map((p) => (
                <Card key={p.id} className="p-3 card-neo" style={{ minWidth: 340 }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="project-title">{p.title || "Untitled"}</div>
                      <div className="text-muted small">
                        #{projectCode(p.id)} • {p.placeName || "—"}, {p.country || "—"}
                      </div>
                      <div className="mt-1">
                        <Badge bg="primary">Organization</Badge>
                        {statusBadge(p.status)}
                      </div>
                    </div>
                    <div className="text-end small text-muted">{createdLabel(p.createdAt)}</div>
                  </div>
                  <div className="small mt-2">
                    Area: <strong>{p.areaHa ?? "—"}</strong> ha
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => navigate(`/project/${p.id}?type=${p.type}`)}
                    >
                      <FiExternalLink className="me-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${encodeURIComponent(
                            `${p.lat || ""},${p.lng || ""}`
                          )}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <FiMap className="me-1" /> Open Map
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p)}>
                      <FiTrash2 className="me-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Map + Charts */}
        <Row className="mt-4 g-3">
          <Col xl={6} lg={12}>
            <Card className="p-3 card-neo fadein">
              <div className="d-flex justify-content-between align-items-center">
                <strong>Project Locations</strong>
                <div className="text-muted small">
                  Click markers to see titles. Verified projects will be anchored later.
                </div>
              </div>
              <div ref={mapRef} className="map-box mt-2" />
            </Card>
          </Col>

          <Col xl={6} lg={12}>
            <Card className="p-3 card-neo fadein">
              <strong>Projects Over Time</strong>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="projects" stroke="#0ea5e9" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {!timelineData.length && (
                <div className="text-muted small">No projects yet — timeline will start after your first project.</div>
              )}
            </Card>
          </Col>

          <Col xl={6} lg={12}>
            <Card className="p-3 card-neo fadein">
              <strong>Estimated Annual Blue Carbon (tCO₂)</strong>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      {
                        label: "Annual (current portfolio)",
                        tCO2: Number(totalAnnualCO2.toFixed(2)),
                      },
                    ]}
                  >
                    <defs>
                      <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <RTooltip />
                    <Area type="monotone" dataKey="tCO2" stroke="#0ea5e9" fill="url(#colorT)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="small text-muted">
                Derived from area and selected ecosystems for each project using literature-based factors.
              </div>
            </Card>
          </Col>

          <Col xl={6} lg={12}>
            <Card className="p-3 card-neo fadein">
              <strong>Plants by Type</strong>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plantsByType}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {plantsByType.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <RTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="small text-muted">
                Organization species counts are summed from species rows; Local uses provided per-type counts or approx.
              </div>
            </Card>
          </Col>
        </Row>

        {/* Footer banner */}
        <Card className="p-4 mt-4 card-neo fadein">
          <Row className="align-items-center">
            <Col md={9}>
              <div className="h5 fw-bold">“Blue carbon is climate’s quiet ally.”</div>
              <div className="text-muted">
                Track your restoration impact. After verification, project hashes can be anchored to blockchain.
              </div>
            </Col>
            <Col md={3} className="text-md-end mt-3 mt-md-0">
              <Button as={Link} to="/about" variant="outline-primary" className="glow">
                Learn about BlueCarbon
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-5 py-4">
          <div className="text-muted">
            © 2025 BlueCarbon. All rights reserved.{" "}
            <Link to="/terms">Terms</Link> • <Link to="/privacy">Privacy</Link> •{" "}
            <Link to="/contact">Contact</Link>
          </div>
        </footer>
      </Container>

      {/* Draggable chatbot */}
      <ChatBotWidget theme={theme} />
    </div>
  );
}

export default HomePage;
