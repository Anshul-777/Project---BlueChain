// src/RegisterForm.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Modal,
  Alert,
  Badge,
  InputGroup,
} from "react-bootstrap";

// IMPORTANT: In src/index.jsx (or src/index.js) add:
// import 'bootstrap/dist/css/bootstrap.min.css';

const COUNTRIES = [
  "India",
  "Bangladesh",
  "Sri Lanka",
  "Indonesia",
  "Philippines",
  "Kenya",
  "Tanzania",
  "Nigeria",
  "Vietnam",
  "Malaysia",
  "Mexico",
  "Brazil",
  "USA",
  "UK",
  "Australia",
  "Other",
];

const ORGANIZATION_TYPES = [
  "NGO",
  "Government",
  "Company",
  "Community Cooperative",
  "Academic/Research Institution",
  "Other",
];

const ECOSYSTEM_OPTIONS = [
  "Mangrove",
  "Seagrass",
  "Salt marsh",
  "Coastal mudflat",
  "Coastal sediment",
  "Other",
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE10_REGEX = /^\d{10}$/; // strict 10 digits only
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MAX_LOCAL_PHOTO_MB = 10;
const MAX_ORG_PHOTO_MB = 15;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;
const MIN_IMAGE_KB = 10; // changed to 10 KB (accepts any value in-between up to max)

// Debounced effect helper
const useDebouncedEffect = (effect, deps, delay = 600) => {
  const cleanupRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (cleanupRef.current) cleanupRef.current();
      const maybeCleanup = effect();
      if (typeof maybeCleanup === "function") cleanupRef.current = maybeCleanup;
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

// Hold-to-show tooltip
const HoldTip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="hold-tip-wrapper">
      <span
        className="hold-tip-trigger"
        onMouseDown={() => setShow(true)}
        onMouseUp={() => setShow(false)}
        onMouseLeave={() => setShow(false)}
        role="button"
        aria-label="Hold for help"
      >
        (?)
      </span>
      {show && <span className="hold-tip-bubble">{text}</span>}
    </span>
  );
};

// Simple Signature Pad (canvas)
const SignaturePad = ({ onSave, initialDataUrl }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [saved, setSaved] = useState(initialDataUrl || "");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // crisp lines
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    // HDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }, []);

  const startDraw = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const endDraw = () => {
    drawing.current = false;
  };
  const draw = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const getXY = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY =
      e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setSaved("");
    onSave("");
  };
  const handleSave = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL("image/png");
    setSaved(data);
    onSave(data);
  };

  return (
    <div>
      <div
        className="signature-box"
        onMouseDown={startDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onMouseMove={draw}
        onTouchStart={startDraw}
        onTouchEnd={endDraw}
        onTouchMove={draw}
      >
        <canvas ref={canvasRef} className="signature-canvas" />
        <div className="signature-watermark">Sign here</div>
      </div>
      <div className="d-flex gap-2 mt-2">
        <Button size="sm" variant="outline-secondary" onClick={handleClear}>
          Clear
        </Button>
        <Button size="sm" variant="outline-primary" onClick={handleSave}>
          Use Signature
        </Button>
      </div>
      {saved && (
        <div className="mt-2">
          <img
            src={saved}
            alt="signature-preview"
            style={{ height: 60, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          />
        </div>
      )}
    </div>
  );
};

// Map picker via Leaflet CDN (no extra NPM)
const MapPickerModal = ({
  show,
  onHide,
  onApply,
  initialLat,
  initialLng,
  title = "Pick Location on Map",
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [tempLat, setTempLat] = useState(
    typeof initialLat === "number" ? initialLat : 20.5937
  );
  const [tempLng, setTempLng] = useState(
    typeof initialLng === "number" ? initialLng : 78.9629
  );

  const ensureLeafletLoaded = () =>
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

  useEffect(() => {
    if (!show) return;
    let mounted = true;
    ensureLeafletLoaded()
      .then(() => {
        if (!mounted) return;
        setLeafletLoaded(true);
        setTimeout(() => {
          if (!mapContainerRef.current || !window.L) return;
          mapRef.current = window.L.map(mapContainerRef.current, {
            center: [
              typeof initialLat === "number" ? initialLat : 20.5937,
              typeof initialLng === "number" ? initialLng : 78.9629,
            ],
            zoom: typeof initialLat === "number" ? 13 : 5,
          });
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          }).addTo(mapRef.current);

          if (typeof initialLat === "number" && typeof initialLng === "number") {
            markerRef.current = window.L.marker([initialLat, initialLng]).addTo(
              mapRef.current
            );
          }

          mapRef.current.on("click", (e) => {
            const { lat, lng } = e.latlng;
            setTempLat(lat);
            setTempLng(lng);
            if (!markerRef.current) {
              markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
            } else {
              markerRef.current.setLatLng([lat, lng]);
            }
          });
        }, 0);
      })
      .catch(() => setLeafletLoaded(false));

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const useDeviceGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setTempLat(lat);
        setTempLng(lng);
        if (mapRef.current && window.L) {
          mapRef.current.setView([lat, lng], 15);
          if (!markerRef.current) {
            markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current);
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-gradient-1 text-white">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!leafletLoaded && (
          <div className="text-center text-muted small mb-2">Loading map...</div>
        )}
        <div
          ref={mapContainerRef}
          style={{
            height: "420px",
            width: "100%",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          }}
          className="mb-3"
        />
        <Row className="gy-2">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>Lat</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.0001"
                min={-90}
                max={90}
                value={Number.isFinite(tempLat) ? tempLat : ""}
                onChange={(e) => setTempLat(Number(e.target.value))}
              />
            </InputGroup>
          </Col>
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>Lng</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.0001"
                min={-180}
                max={180}
                value={Number.isFinite(tempLng) ? tempLng : ""}
                onChange={(e) => setTempLng(Number(e.target.value))}
              />
            </InputGroup>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-primary" onClick={useDeviceGPS}>
          Use My GPS
        </Button>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!Number.isFinite(tempLat) || !Number.isFinite(tempLng)) return;
              onApply({ lat: Number(tempLat), lng: Number(tempLng) });
              onHide();
            }}
          >
            Apply Coordinates
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

const SectionTitle = ({ children }) => (
  <div className="d-flex align-items-center mb-2">
    <h5 className="mb-0 me-2">{children}</h5>
    <div className="flex-grow-1 hr-fade" />
  </div>
);

const FileHints = ({ text }) => (
  <div className="text-muted small fst-italic mt-1">{text}</div>
);

// utils
const sanitizePhone10 = (s) => (s || "").replace(/\D/g, "").slice(0, 10);
const dataURLToFile = async (dataUrl, fileName = "signature.png") => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: "image/png" });
};

// initializers for Clear button
const getInitialLocal = () => ({
  projectTitle: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  ecosystems: [],
  shortDescription: "",
  country: "",
  placeName: "",
  lat: "",
  lng: "",
  areaHa: "",
  approxPlants: "",
  startDate: "",
  photos: [],
  onsetImage: null,
  supportingDocs: [],
  hasPermit: false,
  permitDoc: null,
  gpsAccuracy: "",
  consent: false,
  intendsCarbonCredits: false,
  plantTypes: { mangroves: false, seagrasses: false, tidalMarshes: false },
  numMangroves: "",
  numSeagrasses: "",
  numTidalMarshes: "",
  signatureDataUrl: "",
  signatureFile: null,
});
const getInitialOrg = () => ({
  projectTitle: "",
  projectExternalId: "",
  organizationType: "",
  organizationName: "",
  orgRegistrationNumber: "",
  orgContactName: "",
  orgContactEmail: "",
  orgContactPhone: "",
  orgAddress: "",
  ownerWallet: "",
  startDate: "",
  baseDate: "",
  ongoing: true,
  endDate: "",
  placeName: "",
  state: "",
  district: "",
  country: "",
  lat: "",
  lng: "",
  areaHa: "",
  geoBoundaryFile: null,
  mapReference: "",
  ecosystems: [],
  habitatType: "",
  methodology: "",
  estimatedSequestrationTCO2: "",
  requestedCredits: "",
  speciesList: [
    {
      speciesName: "",
      countPlanted: "",
      plantingDensity: "",
      expectedSurvivalPercent: "",
      ageClass: "",
    },
  ],
  plantTypes: { mangroves: false, seagrasses: false, tidalMarshes: false },
  numMangroves: "",
  numSeagrasses: "",
  numTidalMarshes: "",
  plantingRegime: "",
  density: "",
  monitoringPlan: "",
  sampleProtocol: "",
  soilSamples: [],
  vegSamples: [],
  plantingEvents: [],
  photos: [],
  satelliteImages: [],
  labReports: [],
  researchDocs: [],
  permitDocs: [],
  fundingDocs: [],
  baselineCarbon: "",
  calculationParams: "",
  partners: "",
  rolesJson: "",
  verifierContact: "",
  fundingSource: "",
  benefitSharing: "",
  tags: "",
  isConfidential: false,
  consent: false,
  gpsAccuracy: "",
  regulatoryRequired: "",
  licenseNumber: "",
  licenseDoc: null,
  landOwnershipProof: null,
  communityConsentDoc: null,
  soilBulkDensity: "",
  soilOrganicCarbonPercent: "",
  waterSalinityPsu: "",
  waterPh: "",
  signatureDataUrl: "",
  signatureFile: null,
});

const RegisterForm = () => {
  const [projectType, setProjectType] = useState("Local");
  const [theme, setTheme] = useState("light"); // light | dark
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null

  // Local form
  const [localData, setLocalData] = useState(getInitialLocal());
  const [localErrors, setLocalErrors] = useState({});

  // Organization form
  const [orgData, setOrgData] = useState(getInitialOrg());
  const [orgErrors, setOrgErrors] = useState({});

  // Load drafts
  useEffect(() => {
    try {
      const t = localStorage.getItem("registerForm.type");
      if (t) setProjectType(t);
      const l = localStorage.getItem("registerForm.local");
      if (l) setLocalData(JSON.parse(l));
      const o = localStorage.getItem("registerForm.org");
      if (o) setOrgData(JSON.parse(o));
      const th = localStorage.getItem("registerForm.theme");
      if (th) setTheme(th);
    } catch {}
  }, []);

  const stamp = () => setAutosaveStamp(new Date().toISOString());

  // Autosave
  useDebouncedEffect(() => {
    try {
      localStorage.setItem("registerForm.type", projectType);
      stamp();
    } catch {}
    return () => {};
  }, [projectType]);

  useDebouncedEffect(() => {
    try {
      localStorage.setItem("registerForm.local", JSON.stringify(localData));
      stamp();
    } catch {}
    return () => {};
  }, [localData]);

  useDebouncedEffect(() => {
    try {
      localStorage.setItem("registerForm.org", JSON.stringify(orgData));
      stamp();
    } catch {}
    return () => {};
  }, [orgData]);

  useDebouncedEffect(() => {
    try {
      localStorage.setItem("registerForm.theme", theme);
    } catch {}
    return () => {};
  }, [theme]);

  // Generic change handler
  const handleChange = (e, isOrg = false) => {
    const { name, type, checked, value, files, multiple } = e.target;
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => {
      const copy = { ...prev };
      if (type === "checkbox") {
        copy[name] = checked;
      } else if (type === "file") {
        copy[name] = multiple ? (files ? Array.from(files) : []) : files?.[0] || null;
      } else {
        copy[name] = value;
      }
      return copy;
    });
  };

  const handlePhoneChange = (e, isOrg = false) => {
    const { name, value } = e.target;
    const digits = sanitizePhone10(value);
    (isOrg ? setOrgData : setLocalData)((prev) => ({ ...prev, [name]: digits }));
  };

  // Ecosystem toggles
  const toggleEcoLocal = (eco) =>
    setLocalData((p) => {
      const set = new Set(p.ecosystems || []);
      if (set.has(eco)) set.delete(eco);
      else set.add(eco);
      return { ...p, ecosystems: Array.from(set) };
    });
  const toggleEcoOrg = (eco) =>
    setOrgData((p) => {
      const set = new Set(p.ecosystems || []);
      if (set.has(eco)) set.delete(eco);
      else set.add(eco);
      return { ...p, ecosystems: Array.from(set) };
    });

  // Plant types
  const togglePlantTypeLocal = (key) =>
    setLocalData((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  const togglePlantTypeOrg = (key) =>
    setOrgData((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));

  const selectedPlantTypeCountLocal = useMemo(() => {
    const p = localData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [localData.plantTypes]);

  const selectedPlantTypeCountOrg = useMemo(() => {
    const p = orgData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [orgData.plantTypes]);

  // GPS helpers
  const setLocalField = (name, value) =>
    setLocalData((prev) => ({ ...prev, [name]: value }));
  const setOrgField = (name, value) =>
    setOrgData((prev) => ({ ...prev, [name]: value }));

  const useDeviceGPSLocal = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalField("lat", Number(pos.coords.latitude).toFixed(6));
        setLocalField("lng", Number(pos.coords.longitude).toFixed(6));
        setLocalField("gpsAccuracy", Number(pos.coords.accuracy).toFixed(1));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const useDeviceGPSOrg = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrgField("lat", Number(pos.coords.latitude).toFixed(6));
        setOrgField("lng", Number(pos.coords.longitude).toFixed(6));
        setOrgField("gpsAccuracy", Number(pos.coords.accuracy).toFixed(1));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Helpers
  const isValidLat = (v) => {
    if (v === "" || v === null || v === undefined) return false;
    const n = Number(v);
    return !isNaN(n) && n >= -90 && n <= 90;
  };
  const isValidLng = (v) => {
    if (v === "" || v === null || v === undefined) return false;
    const n = Number(v);
    return !isNaN(n) && n >= -180 && n <= 180;
  };
  const within = (val, min, max) => {
    const n = Number(val);
    return !isNaN(n) && n >= min && n <= max;
  };
  const positive = (val) => {
    const n = Number(val);
    return !isNaN(n) && n > 0;
  };

  // Validation - Local
  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!PHONE10_REGEX.test(d.ownerPhone))
      errs.ownerPhone = "Enter exactly 10 digits (no country code).";
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";

    if (!Array.isArray(d.ecosystems) || d.ecosystems.length === 0)
      errs.ecosystems = "Select at least one ecosystem.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    // photos (accept 10KB up to 10MB, including any value in between)
    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, 10 KB to 10 MB each).";
    } else {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (f.size > MAX_LOCAL_PHOTO_MB * 1024 * 1024 || f.size < MIN_IMAGE_KB * 1024) {
          errs.photos = `Each photo must be between ${MIN_IMAGE_KB} KB and ${MAX_LOCAL_PHOTO_MB} MB.`;
          break;
        }
      }
    }

    // plant type counts are only required when more than one selected (business rule kept)
    if (selectedPlantTypeCountLocal > 1) {
      if (d.plantTypes.mangroves && !positive(d.numMangroves))
        errs.numMangroves = "Enter plants count (> 0).";
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses))
        errs.numSeagrasses = "Enter plants count (> 0).";
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes))
        errs.numTidalMarshes = "Enter plants count (> 0).";
    }

    if (!d.consent) errs.consent = "You must confirm to submit this form.";
    return errs;
  };

  // Validation - Organization
  const validateOrg = () => {
    const errs = {};
    const d = orgData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–250 characters required.";
    if (!d.organizationType) errs.organizationType = "Select organization type.";
    if (!d.organizationName) errs.organizationName = "Organization Name is required.";
    if (!d.orgContactName) errs.orgContactName = "Contact Person is required.";
    if (!d.orgContactEmail || !EMAIL_REGEX.test(d.orgContactEmail))
      errs.orgContactEmail = "Valid email is required.";
    if (d.orgContactPhone && !PHONE10_REGEX.test(d.orgContactPhone))
      errs.orgContactPhone = "Enter exactly 10 digits (no country code).";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate) errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!Array.isArray(d.ecosystems) || d.ecosystems.length === 0)
      errs.ecosystems = "Select at least one ecosystem.";

    if (!d.methodology || d.methodology.trim() === "")
      errs.methodology = "Methodology/Standard is required.";
    if (!d.monitoringPlan || d.monitoringPlan.trim() === "")
      errs.monitoringPlan = "Monitoring Plan is required.";

    if (
      !Array.isArray(d.speciesList) ||
      d.speciesList.length === 0 ||
      !d.speciesList[0].speciesName
    ) {
      errs.speciesList = "Add at least one species with a name.";
    } else {
      d.speciesList.forEach((row, idx) => {
        if (row.countPlanted && !positive(row.countPlanted)) {
          errs[`speciesList_${idx}_countPlanted`] = "Count must be positive.";
        }
        if (
          row.expectedSurvivalPercent &&
          !within(row.expectedSurvivalPercent, 0, 100)
        ) {
          errs[`speciesList_${idx}_expectedSurvivalPercent`] = "Survival % must be 0–100.";
        }
      });
    }

    const ptCount = selectedPlantTypeCountOrg;
    if (ptCount === 0) {
      errs.plantTypes =
        "Select at least one plant type (Mangroves/Seagrasses/Tidal Marshes).";
    }
    // counts required only if > 2 selected (business rule kept)
    if (ptCount > 2) {
      if (d.plantTypes.mangroves && !positive(d.numMangroves))
        errs.numMangroves = "Enter number of Mangrove plants (> 0).";
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses))
        errs.numSeagrasses = "Enter number of Seagrass plants (> 0).";
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes))
        errs.numTidalMarshes = "Enter number of Tidal Marsh plants (> 0).";
      if (!Array.isArray(d.researchDocs) || d.researchDocs.length === 0) {
        errs.researchDocs =
          "Upload at least one Research Report when selecting more than two plant types.";
      }
    }

    // evidence rules (10KB min to 15MB max for photos)
    const numPhotos = Array.isArray(d.photos) ? d.photos.length : 0;
    const numSat = Array.isArray(d.satelliteImages) ? d.satelliteImages.length : 0;
    const photosOk = numPhotos >= 5 || (numSat >= 1 && numPhotos >= 3);
    if (!photosOk) {
      errs.photos = "Minimum evidence: 5+ photos OR 1 satellite image + 3 photos.";
    }

    if (Array.isArray(d.photos)) {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (
          f.size > MAX_ORG_PHOTO_MB * 1024 * 1024 ||
          f.size < MIN_IMAGE_KB * 1024
        ) {
          errs.photos = `Each photo must be between ${MIN_IMAGE_KB} KB and ${MAX_ORG_PHOTO_MB} MB.`;
          break;
        }
      }
    }
    if (Array.isArray(d.satelliteImages)) {
      for (const f of d.satelliteImages) {
        const name = (f.name || "").toLowerCase();
        const typeOk = ["image/tiff", "image/tif", "image/jpeg", "image/jpg", "image/png"].includes(f.type);
        const extOk =
          name.endsWith(".tif") ||
          name.endsWith(".tiff") ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg") ||
          name.endsWith(".png");
        if (!typeOk && !extOk) {
          errs.satelliteImages = "Satellite images must be .tif/.tiff/.jpg/.jpeg/.png";
          break;
        }
        if (f.size > MAX_DOC_MB * 1024 * 1024) {
          errs.satelliteImages = `Each satellite file must be <= ${MAX_DOC_MB} MB.`;
          break;
        }
      }
    }

    if (d.geoBoundaryFile) {
      const f = d.geoBoundaryFile;
      const name = (f.name || "").toLowerCase();
      if (
        !(
          name.endsWith(".geojson") ||
          name.endsWith(".json") ||
          name.endsWith(".kml") ||
          name.endsWith(".zip")
        )
      ) {
        errs.geoBoundaryFile = "Allowed: .geojson, .json, .kml, .zip (shapefile).";
      } else if (f.size > MAX_BOUNDARY_MB * 1024 * 1024) {
        errs.geoBoundaryFile = `Boundary file <= ${MAX_BOUNDARY_MB} MB.`;
      }
    }

    if (!d.regulatoryRequired)
      errs.regulatoryRequired = "Select if permits are required in your jurisdiction.";
    if (d.regulatoryRequired === "yes") {
      if (!Array.isArray(d.permitDocs) || d.permitDocs.length === 0)
        errs.permitDocs = "Upload permit/legal documents if required by law.";
      if (!d.licenseNumber || d.licenseNumber.trim().length < 3)
        errs.licenseNumber = "License number is required.";
      if (!d.licenseDoc) errs.licenseDoc = "Upload license document.";
    }

    if (d.soilBulkDensity && !within(d.soilBulkDensity, 0.2, 2.0))
      errs.soilBulkDensity = "Soil bulk density should be 0.2–2.0 g/cm³.";
    if (d.soilOrganicCarbonPercent && !within(d.soilOrganicCarbonPercent, 0, 60))
      errs.soilOrganicCarbonPercent = "SOC% should be 0–60.";
    if (d.waterSalinityPsu && !within(d.waterSalinityPsu, 0, 40))
      errs.waterSalinityPsu = "Salinity should be 0–40 PSU.";
    if (d.waterPh && !within(d.waterPh, 5, 9)) errs.waterPh = "Water pH should be 5–9.";

    if (!d.consent) errs.consent = "You must confirm to submit this form.";
    return errs;
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem("registerForm.local");
      localStorage.removeItem("registerForm.org");
      localStorage.removeItem("registerForm.type");
      localStorage.removeItem("registerForm.theme");
    } catch {}
  };

  const hardResetForm = () => {
    if (projectType === "Local") {
      setLocalData(getInitialLocal());
      setLocalErrors({});
    } else {
      setOrgData(getInitialOrg());
      setOrgErrors({});
    }
  };

  const scrollToFirstError = (errs) => {
    const keys = Object.keys(errs || {});
    if (!keys.length) return;
    const id = keys[0];
    const el =
      document.querySelector(`[data-err="${id}"]`) ||
      document.querySelector(`[name="${id}"]`);
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSummary("");
    setSubmitting(true);

    if (projectType === "Local") {
      const errs = validateLocal();
      setLocalErrors(errs);
      if (Object.keys(errs).length) {
        setSubmitting(false);
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    } else {
      const errs = validateOrg();
      setOrgErrors(errs);
      if (Object.keys(errs).length) {
        setSubmitting(false);
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    }

    try {
      const payload = new FormData();

      if (projectType === "Local") {
        const d = localData;
        payload.append("type", "local");
        payload.append("projectTitle", d.projectTitle);
        payload.append("ownerName", d.ownerName);
        payload.append("ownerPhone", d.ownerPhone);
        payload.append("ownerEmail", d.ownerEmail);
        payload.append("country", d.country || "");
        payload.append("placeName", d.placeName || "");
        payload.append("lat", d.lat || "");
        payload.append("lng", d.lng || "");
        payload.append("gpsAccuracy", d.gpsAccuracy || "");
        payload.append("areaHa", d.areaHa || "");
        payload.append("approxPlants", d.approxPlants || "");
        payload.append("startDate", d.startDate || "");
        payload.append("shortDescription", d.shortDescription || "");
        payload.append("intendsCarbonCredits", String(!!d.intendsCarbonCredits));
        payload.append("hasPermit", String(!!d.hasPermit));
        payload.append("consent", String(!!d.consent));
        payload.append("ecosystems", JSON.stringify(d.ecosystems || []));
        payload.append("plantTypes", JSON.stringify(d.plantTypes || {}));
        payload.append("numMangroves", d.numMangroves || "");
        payload.append("numSeagrasses", d.numSeagrasses || "");
        payload.append("numTidalMarshes", d.numTidalMarshes || "");

        // files
        (d.photos || []).forEach((f) => payload.append("photos", f));
        (d.supportingDocs || []).forEach((f) => payload.append("supportingDocs", f));
        if (d.permitDoc) payload.append("permitDoc", d.permitDoc);

        // signature
        if (d.signatureDataUrl) {
          const sigFile = await dataURLToFile(d.signatureDataUrl, "local_signature.png");
          payload.append("signature", sigFile);
        } else if (d.signatureFile) {
          payload.append("signature", d.signatureFile);
        }

        // Optional client hashing (for future blockchain anchoring)
        /*
        const core = {
          type: "local",
          projectTitle: d.projectTitle,
          ownerName: d.ownerName,
          ownerPhone: d.ownerPhone,
          ownerEmail: d.ownerEmail,
          country: d.country,
          placeName: d.placeName,
          lat: d.lat,
          lng: d.lng,
          areaHa: d.areaHa,
          ecosystems: d.ecosystems,
          plantTypes: d.plantTypes,
          approxPlants: d.approxPlants,
          startDate: d.startDate,
        };
        // const bytes = new TextEncoder().encode(JSON.stringify(core));
        // const hashBuf = await window.crypto.subtle.digest("SHA-256", bytes);
        // const clientSha256 = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
        // payload.append("clientSha256", clientSha256);
        */
      } else {
        const d = orgData;
        payload.append("type", "org");
        payload.append("projectTitle", d.projectTitle);
        payload.append("projectExternalId", d.projectExternalId || "");
        payload.append("organizationType", d.organizationType || "");
        payload.append("organizationName", d.organizationName || "");
        payload.append("orgRegistrationNumber", d.orgRegistrationNumber || "");
        payload.append("orgContactName", d.orgContactName || "");
        payload.append("orgContactEmail", d.orgContactEmail || "");
        payload.append("orgContactPhone", d.orgContactPhone || "");
        payload.append("orgAddress", d.orgAddress || "");
        payload.append("ownerWallet", d.ownerWallet || "");
        payload.append("startDate", d.startDate || "");
        payload.append("baseDate", d.baseDate || "");
        payload.append("ongoing", String(!!d.ongoing));
        payload.append("endDate", d.endDate || "");
        payload.append("placeName", d.placeName || "");
        payload.append("state", d.state || "");
        payload.append("district", d.district || "");
        payload.append("country", d.country || "");
        payload.append("lat", d.lat || "");
        payload.append("lng", d.lng || "");
        payload.append("gpsAccuracy", d.gpsAccuracy || "");
        payload.append("areaHa", d.areaHa || "");
        payload.append("mapReference", d.mapReference || "");
        payload.append("ecosystems", JSON.stringify(d.ecosystems || []));
        payload.append("habitatType", d.habitatType || "");
        payload.append("methodology", d.methodology || "");
        payload.append("estimatedSequestrationTCO2", d.estimatedSequestrationTCO2 || "");
        payload.append("requestedCredits", d.requestedCredits || "");
        payload.append("speciesList", JSON.stringify(d.speciesList || []));
        payload.append("plantTypes", JSON.stringify(d.plantTypes || {}));
        payload.append("numMangroves", d.numMangroves || "");
        payload.append("numSeagrasses", d.numSeagrasses || "");
        payload.append("numTidalMarshes", d.numTidalMarshes || "");
        payload.append("plantingRegime", d.plantingRegime || "");
        payload.append("density", d.density || "");
        payload.append("monitoringPlan", d.monitoringPlan || "");
        payload.append("sampleProtocol", d.sampleProtocol || "");
        payload.append("baselineCarbon", d.baselineCarbon || "");
        payload.append("calculationParams", d.calculationParams || "");
        payload.append("partners", d.partners || "");
        payload.append("rolesJson", d.rolesJson || "");
        payload.append("verifierContact", d.verifierContact || "");
        payload.append("fundingSource", d.fundingSource || "");
        payload.append("benefitSharing", d.benefitSharing || "");
        payload.append("tags", d.tags || "");
        payload.append("isConfidential", String(!!d.isConfidential));
        payload.append("regulatoryRequired", d.regulatoryRequired || "");
        payload.append("licenseNumber", d.licenseNumber || "");
        payload.append("soilBulkDensity", d.soilBulkDensity || "");
        payload.append("soilOrganicCarbonPercent", d.soilOrganicCarbonPercent || "");
        payload.append("waterSalinityPsu", d.waterSalinityPsu || "");
        payload.append("waterPh", d.waterPh || "");
        payload.append("consent", String(!!d.consent));

        // files
        if (d.geoBoundaryFile) payload.append("geoBoundaryFile", d.geoBoundaryFile);
        (d.photos || []).forEach((f) => payload.append("photos", f));
        (d.satelliteImages || []).forEach((f) => payload.append("satelliteImages", f));
        (d.labReports || []).forEach((f) => payload.append("labReports", f));
        (d.researchDocs || []).forEach((f) => payload.append("researchDocs", f));
        (d.permitDocs || []).forEach((f) => payload.append("permitDocs", f));
        (d.fundingDocs || []).forEach((f) => payload.append("fundingDocs", f));
        if (d.licenseDoc) payload.append("licenseDoc", d.licenseDoc);
        if (d.landOwnershipProof) payload.append("landOwnershipProof", d.landOwnershipProof);
        if (d.communityConsentDoc) payload.append("communityConsentDoc", d.communityConsentDoc);

        // signature
        if (d.signatureDataUrl) {
          const sigFile = await dataURLToFile(d.signatureDataUrl, "org_signature.png");
          payload.append("signature", sigFile);
        } else if (d.signatureFile) {
          payload.append("signature", d.signatureFile);
        }

        // Optional client hashing (for future blockchain anchoring)
        /*
        const core = {
          type: "org",
          projectTitle: d.projectTitle,
          organizationName: d.organizationName,
          orgContactName: d.orgContactName,
          orgContactEmail: d.orgContactEmail,
          startDate: d.startDate,
          placeName: d.placeName,
          lat: d.lat,
          lng: d.lng,
          areaHa: d.areaHa,
          ecosystems: d.ecosystems,
          speciesList: d.speciesList,
          methodology: d.methodology,
          monitoringPlan: d.monitoringPlan,
        };
        // const bytes = new TextEncoder().encode(JSON.stringify(core));
        // const hashBuf = await window.crypto.subtle.digest("SHA-256", bytes);
        // const hashArr = Array.from(new Uint8Array(hashBuf));
        // const clientSha256 = hashArr.map(b => b.toString(16).padStart(2,"0")).join("");
        // payload.append("clientSha256", clientSha256);
        */
      }

      // POST to backend (admin and user dashboards will read from DB/APIs)
      const res = await fetch("/api/projects", { method: "POST", body: payload });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server error");
      }

      // success
      setShowSuccess(true);
      clearDraft();
      setTimeout(() => {
        setShowSuccess(false);
        window.location.href = "/home"; // return to HomePage.js
      }, 1600);
    } catch (err) {
      console.error("Submit error:", err);
      setErrorSummary("Submit failed. Please try again or check server.");
    } finally {
      setSubmitting(false);
    }
  };

  // Species handlers
  const addSpeciesRow = () => {
    setOrgData((prev) => ({
      ...prev,
      speciesList: [
        ...prev.speciesList,
        {
          speciesName: "",
          countPlanted: "",
          plantingDensity: "",
          expectedSurvivalPercent: "",
          ageClass: "",
        },
      ],
    }));
  };
  const removeSpeciesRow = (i) => {
    setOrgData((prev) => {
      const s = [...prev.speciesList];
      s.splice(i, 1);
      return { ...prev, speciesList: s };
    });
  };
  const handleSpeciesChange = (index, e) => {
    const { name, value } = e.target;
    setOrgData((prev) => {
      const s = [...prev.speciesList];
      s[index][name] = value;
      return { ...prev, speciesList: s };
    });
  };

  const nowSaved = autosaveStamp
    ? new Date(autosaveStamp).toLocaleTimeString()
    : null;

  // CLEAR + SAVE DRAFT helpers
  const handleClearClick = () => {
    clearDraft();          // remove draft from storage
    hardResetForm();       // reset in-memory form
  };
  const handleSaveDraftClick = () => {
    try {
      localStorage.setItem("registerForm.type", projectType);
      if (projectType === "Local") {
        localStorage.setItem("registerForm.local", JSON.stringify(localData));
      } else {
        localStorage.setItem("registerForm.org", JSON.stringify(orgData));
      }
      setAutosaveStamp(new Date().toISOString());
    } catch {}
  };

  return (
    <div className={`container py-4 register-form-root ${theme === "dark" ? "theme-dark" : "theme-light"}`} data-theme={theme}>
      <style>{`
        :root {
          --primary-500: #0ea5e9;
          --indigo-500: #6366f1;
          --emerald-500: #10b981;
          --rose-500: #f43f5e;
          --slate-900: #0f172a;
          --slate-800: #1e293b;
          --slate-700: #334155;
          --slate-100: #f1f5f9;
          --card-bg: rgba(255,255,255,0.92);
          --text-color: #0b1220;
          --muted: #6b7280;
          --border: rgba(0,0,0,0.06);
        }
        [data-theme='dark'] {
          --card-bg: rgba(15,23,42,0.92);
          --text-color: #e5e7eb;
          --muted: #93a3b8;
          --border: rgba(255,255,255,0.08);
        }

        .bg-gradient-1 { background: linear-gradient(135deg, #4f46e5, #0ea5e9); }
        .card-neo {
          background: var(--card-bg);
          color: var(--text-color);
          backdrop-filter: blur(6px);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.12);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,0.18); }

        .animate-in { animation: fadeUp .6s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-slide-l { animation: slideL .6s ease both; }
        @keyframes slideL { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        .anim-slide-r { animation: slideR .6s ease both; }
        @keyframes slideR { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        .anim-zoom { animation: zoomIn .4s ease both; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

        .section {
          padding: 16px; border-radius: 12px; border: 1px dashed rgba(99,102,241,0.35);
          background: linear-gradient(0deg, rgba(99,102,241,0.08), rgba(14,165,233,0.07));
          margin-bottom: 16px;
        }
        [data-theme='dark'] .section {
          background: linear-gradient(0deg, rgba(99,102,241,0.18), rgba(14,165,233,0.12));
        }

        .hr-fade { height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0)); }
        [data-theme='dark'] .hr-fade { background: linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0)); }

        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .success-card {
          background: #fff; padding: 24px 28px; border-radius: 16px; text-align: center;
          animation: popIn .35s ease both;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .checkmark {
          width: 64px; height: 64px; border-radius: 50%; background: var(--emerald-500);
          display: inline-flex; align-items: center; justify-content: center; color: white;
          font-size: 38px; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.4); animation: pulse 0.9s ease 1;
        }
        @keyframes pulse { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }

        .hold-tip-wrapper { position: relative; display: inline-block; }
        .hold-tip-trigger { color: var(--primary-500); margin-left: 6px; cursor: pointer; user-select: none; }
        .hold-tip-bubble {
          position: absolute; top: -8px; left: 20px; min-width: 220px; max-width: 320px;
          background: var(--primary-500); color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35); animation: tipFade .2s ease both; z-index: 10;
        }
        @keyframes tipFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }

        .red-note { color: #dc2626; font-size: 0.875rem; margin-top: 4px; }
        [data-theme='dark'] .red-note { color: #fca5a5; }

        .upload-animated {
          border: 2px dashed rgba(14,165,233,0.55); padding: 10px; border-radius: 10px; transition: border-color .25s, box-shadow .25s, background-color .25s;
          background: rgba(14,165,233,0.06);
        }
        .upload-animated:hover {
          border-color: var(--indigo-500);
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 6px rgba(99,102,241,0.12);
        }

        .themed-btn {
          transition: transform .15s ease, box-shadow .2s ease;
        }
        .themed-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(14,165,233,0.25); }

        .theme-toggle {
          background: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.35);
          color: #fff;
        }
        .theme-toggle:hover { background: rgba(255,255,255,0.35); }

        .signature-box {
          position: relative;
          border: 2px dashed rgba(99,102,241,0.45);
          border-radius: 10px; height: 160px; background: rgba(99,102,241,0.05);
          overflow: hidden;
        }
        .signature-canvas { width: 100%; height: 100%; display: block; }
        .signature-watermark {
          position: absolute; top: 8px; right: 12px; font-size: 12px; color: var(--muted);
        }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <h4 className="mb-0">Register Project</h4>
              <Button
                size="sm"
                className="theme-toggle"
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                title="Toggle Light/Dark"
              >
                {theme === "light" ? "🌙 Dark" : "🌞 Light"}
              </Button>
            </div>
            <div className="d-flex align-items-center gap-3">
              {nowSaved && (
                <span className="small">
                  Autosaved at <Badge bg="light" text="dark">{nowSaved}</Badge>
                </span>
              )}
              <Button
                size="sm"
                variant="light"
                onClick={() => (window.location.href = "/home")}
                title="Close"
                style={{ lineHeight: 1, padding: "2px 8px" }}
              >
                ×
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <div className="mb-3 anim-zoom">
              <Form.Label>
                Project Type{" "}
                <HoldTip text="Choose Local for individuals/small teams. Choose Organization for full verification and carbon credit workflow." />
              </Form.Label>
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="themed-btn"
              >
                <option value="Local">Local (short form)</option>
                <option value="Organization">Organization (full, production-grade)</option>
                <option value="Collaboration" disabled>Collaboration (coming soon)</option>
              </Form.Select>
            </div>

            {errorSummary && (
              <Alert variant="danger" className="animate-in">{errorSummary}</Alert>
            )}

            {projectType === "Local" && (
              <>
                <div className="section anim-slide-l">
                  <p className="mb-2">
                    <strong>Use this Local Project form</strong> when you are a small team,
                    individual, or community restoring a coastal area (mangrove, seagrass,
                    salt marsh). This creates a verifiable project record. Drafts save automatically.
                  </p>
                  <div className="text-muted small">
                    Lightweight record: identity, location/size, ecosystems, minimal photos, description.
                    Not for immediate credit minting (can upgrade later).
                  </div>
                </div>

                <SectionTitle>Project Details</SectionTitle>
                <Form.Group className="mb-3 anim-slide-r">
                  <Form.Label>
                    Project Title *
                    <HoldTip text='Short descriptive name. Example: "Ramnagar Mangrove Restoration — 2025". 5–200 characters.' />
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="projectTitle"
                    value={localData.projectTitle}
                    onChange={handleChange}
                    maxLength={200}
                    isInvalid={!!localErrors.projectTitle}
                    data-err="projectTitle"
                  />
                  {localErrors.projectTitle && (
                    <div className="red-note">{localErrors.projectTitle}</div>
                  )}
                </Form.Group>

                <SectionTitle>Owner Details</SectionTitle>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Owner / Primary Contact Name *
                        <HoldTip text="Individual or group lead who submits this project. 3–120 characters." />
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="ownerName"
                        value={localData.ownerName}
                        onChange={handleChange}
                        minLength={3}
                        maxLength={120}
                        isInvalid={!!localErrors.ownerName}
                        data-err="ownerName"
                      />
                      {localErrors.ownerName && (
                        <div className="red-note">{localErrors.ownerName}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Contact Phone *
                        <HoldTip text="Enter 10 digits for the selected country (no country code)." />
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="ownerPhone"
                        value={localData.ownerPhone}
                        onChange={(e) => handlePhoneChange(e, false)}
                        isInvalid={!!localErrors.ownerPhone}
                        data-err="ownerPhone"
                        placeholder="10-digit number"
                      />
                      {localErrors.ownerPhone && (
                        <div className="red-note">{localErrors.ownerPhone}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Contact Email *
                        <HoldTip text="We will send project updates here." />
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="ownerEmail"
                        value={localData.ownerEmail}
                        onChange={handleChange}
                        isInvalid={!!localErrors.ownerEmail}
                        data-err="ownerEmail"
                      />
                      {localErrors.ownerEmail && (
                        <div className="red-note">{localErrors.ownerEmail}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Ecosystems & Description</SectionTitle>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Ecosystems (choose all that apply) *
                        <HoldTip text="Select all ecosystems present at the site." />
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-3">
                        {ECOSYSTEM_OPTIONS.map((eco) => (
                          <Form.Check
                            key={eco}
                            type="checkbox"
                            label={eco}
                            checked={(localData.ecosystems || []).includes(eco)}
                            onChange={() => toggleEcoLocal(eco)}
                          />
                        ))}
                      </div>
                      {localErrors.ecosystems && (
                        <div className="red-note" data-err="ecosystems">
                          {localErrors.ecosystems}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Short Description
                        <HoldTip text="One-paragraph summary (what you planted/restored and why). Max 500 chars." />
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="shortDescription"
                        maxLength={500}
                        value={localData.shortDescription}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Location</SectionTitle>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>
                        Country *
                        <HoldTip text="Select the country of the project site." />
                      </Form.Label>
                      <Form.Select
                        name="country"
                        value={localData.country}
                        onChange={handleChange}
                        isInvalid={!!localErrors.country}
                        data-err="country"
                        className="themed-btn"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Form.Select>
                      {localErrors.country && (
                        <div className="red-note">{localErrors.country}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>
                        Place Name *
                        <HoldTip text="Village or coastal landmark near the site. 3–200 characters." />
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="placeName"
                        value={localData.placeName}
                        onChange={handleChange}
                        minLength={3}
                        maxLength={200}
                        isInvalid={!!localErrors.placeName}
                        data-err="placeName"
                      />
                      {localErrors.placeName && (
                        <div className="red-note">{localErrors.placeName}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <div className="d-flex gap-2 mb-3">
                      <Button variant="outline-primary" className="themed-btn" onClick={useDeviceGPSLocal}>
                        Use GPS
                      </Button>
                      <Button variant="outline-secondary" className="themed-btn" onClick={() => setShowMapFor("local")}>
                        Pick on Map
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Latitude *
                        <HoldTip text="GPS latitude for verification. Range -90 to 90." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="lat"
                        value={localData.lat}
                        onChange={handleChange}
                        step="0.0001"
                        min={-90}
                        max={90}
                        isInvalid={!!localErrors.lat}
                        data-err="lat"
                      />
                      {localErrors.lat && <div className="red-note">{localErrors.lat}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Longitude *
                        <HoldTip text="GPS longitude for verification. Range -180 to 180." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="lng"
                        value={localData.lng}
                        onChange={handleChange}
                        step="0.0001"
                        min={-180}
                        max={180}
                        isInvalid={!!localErrors.lng}
                        data-err="lng"
                      />
                      {localErrors.lng && <div className="red-note">{localErrors.lng}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        GPS Accuracy (m) (optional)
                        <HoldTip text="If your device reports accuracy (in meters), include it to help verifiers." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="gpsAccuracy"
                        value={localData.gpsAccuracy}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Area (hectares) *
                        <HoldTip text="Estimate of restored/planting area. Decimal precision e.g., 2.50 ha." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="areaHa"
                        value={localData.areaHa}
                        onChange={handleChange}
                        step="0.01"
                        min={0.01}
                        isInvalid={!!localErrors.areaHa}
                        data-err="areaHa"
                      />
                      {localErrors.areaHa && (
                        <div className="red-note">{localErrors.areaHa}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Approx. number of plants (optional)
                        <HoldTip text="If known, approximate total planted." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="approxPlants"
                        value={localData.approxPlants}
                        onChange={handleChange}
                        min={1}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Start Date (optional)
                        <HoldTip text="Date planting/restoration started." />
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={localData.startDate}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Plant Types (optional)</SectionTitle>
                <div className="mb-2 anim-zoom">
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Mangroves"
                      checked={localData.plantTypes.mangroves}
                      onChange={() => togglePlantTypeLocal("mangroves")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Seagrasses"
                      checked={localData.plantTypes.seagrasses}
                      onChange={() => togglePlantTypeLocal("seagrasses")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Tidal Marshes"
                      checked={localData.plantTypes.tidalMarshes}
                      onChange={() => togglePlantTypeLocal("tidalMarshes")}
                    />
                  </div>
                </div>

                {/* SHOW NUMBER INPUTS WHENEVER THAT TYPE IS SELECTED */}
                <Row className="mb-2 anim-slide-l">
                  {localData.plantTypes.mangroves && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Mangroves)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numMangroves"
                          value={localData.numMangroves}
                          onChange={handleChange}
                          min={1}
                          isInvalid={!!localErrors.numMangroves}
                          data-err="numMangroves"
                        />
                        {localErrors.numMangroves && (
                          <div className="red-note">{localErrors.numMangroves}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                  {localData.plantTypes.seagrasses && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Seagrasses)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numSeagrasses"
                          value={localData.numSeagrasses}
                          onChange={handleChange}
                          min={1}
                          isInvalid={!!localErrors.numSeagrasses}
                          data-err="numSeagrasses"
                        />
                        {localErrors.numSeagrasses && (
                          <div className="red-note">{localErrors.numSeagrasses}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                  {localData.plantTypes.tidalMarshes && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Tidal Marshes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numTidalMarshes"
                          value={localData.numTidalMarshes}
                          onChange={handleChange}
                          min={1}
                          isInvalid={!!localErrors.numTidalMarshes}
                          data-err="numTidalMarshes"
                        />
                        {localErrors.numTidalMarshes && (
                          <div className="red-note">{localErrors.numTidalMarshes}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <SectionTitle>Evidence</SectionTitle>
                <Form.Group className="mb-3 anim-slide-r">
                  <Form.Label>
                    Photos (at least 2) *
                    <HoldTip text={`Upload clear JPG/PNG images (${MIN_IMAGE_KB}KB–${MAX_LOCAL_PHOTO_MB}MB each). Include a wide shot and a close-up; GPS-tag helps.`} />
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="photos"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={handleChange}
                    isInvalid={!!localErrors.photos}
                    data-err="photos"
                    className="upload-animated"
                  />
                  {localErrors.photos && (
                    <div className="red-note">{localErrors.photos}</div>
                  )}
                  <FileHints text="Recommended: 3–10 photos." />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Onset Image (optional)
                        <HoldTip text="Planting day image or PDF note (optional)." />
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="onsetImage"
                        accept="image/*,application/pdf"
                        onChange={handleChange}
                        className="upload-animated"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Supporting Documents (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        name="supportingDocs"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleChange}
                        className="upload-animated"
                      />
                      <FileHints text={`Max ${MAX_DOC_MB}MB each.`} />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Signature</SectionTitle>
                <Row className="anim-zoom">
                  <Col md={7}>
                    <div className="mb-2">
                      <SignaturePad
                        onSave={(dataUrl) => setLocalField("signatureDataUrl", dataUrl)}
                        initialDataUrl={localData.signatureDataUrl}
                      />
                    </div>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Or upload signature image (camera supported)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="signatureFile"
                        accept="image/*"
                        capture="user"
                        onChange={(e) =>
                          setLocalField("signatureFile", e.target.files?.[0] || null)
                        }
                        className="upload-animated"
                      />
                      <FileHints text="PNG/JPG; live camera capture supported on mobile." />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Permissions & Consent</SectionTitle>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Check
                        type="checkbox"
                        label="Local Permissions / Permit available"
                        name="hasPermit"
                        checked={localData.hasPermit}
                        onChange={handleChange}
                      />
                      {localData.hasPermit && (
                        <div className="mt-2">
                          <Form.Label>Upload Permit Document</Form.Label>
                          <Form.Control
                            type="file"
                            name="permitDoc"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleChange}
                            className="upload-animated"
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Check
                        type="checkbox"
                        name="intendsCarbonCredits"
                        checked={localData.intendsCarbonCredits}
                        onChange={handleChange}
                        label="This project intends to pursue carbon credits later"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3 anim-slide-l">
                  <Form.Check
                    type="checkbox"
                    name="consent"
                    checked={localData.consent}
                    onChange={handleChange}
                    isInvalid={!!localErrors.consent}
                    data-err="consent"
                    label="I confirm the information is true and I have the right to upload these files. *"
                  />
                  {localErrors.consent && (
                    <div className="red-note">{localErrors.consent}</div>
                  )}
                </Form.Group>
              </>
            )}

            {projectType === "Organization" && (
              <>
                <div className="section anim-slide-r">
                  <p className="mb-2">
                    <strong>Use Organization Project Registration</strong> for NGO, company,
                    government or community projects seeking verification and carbon credits.
                    Provide thorough evidence, GPS boundaries, monitoring plans, and lab reports.
                  </p>
                </div>

                <SectionTitle>A. Administrative & Identification</SectionTitle>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>
                        Project Title *
                        <HoldTip text="Unique human-readable name. 5–250 chars." />
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="projectTitle"
                        value={orgData.projectTitle}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.projectTitle}
                        data-err="projectTitle"
                      />
                      {orgErrors.projectTitle && (
                        <div className="red-note">{orgErrors.projectTitle}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Project External ID (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="projectExternalId"
                        value={orgData.projectExternalId}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>
                        Organization Type *
                        <HoldTip text="Select the best fitting category for your organization." />
                      </Form.Label>
                      <Form.Select
                        name="organizationType"
                        value={orgData.organizationType}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.organizationType}
                        data-err="organizationType"
                        className="themed-btn"
                      >
                        <option value="">Select type</option>
                        {ORGANIZATION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Form.Select>
                      {orgErrors.organizationType && (
                        <div className="red-note">{orgErrors.organizationType}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>Organization Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="organizationName"
                        value={orgData.organizationName}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.organizationName}
                        data-err="organizationName"
                      />
                      {orgErrors.organizationName && (
                        <div className="red-note">{orgErrors.organizationName}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Registration Number (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgRegistrationNumber"
                        value={orgData.orgRegistrationNumber}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Contact Person *</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgContactName"
                        value={orgData.orgContactName}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.orgContactName}
                        data-err="orgContactName"
                      />
                      {orgErrors.orgContactName && (
                        <div className="red-note">{orgErrors.orgContactName}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Contact Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="orgContactEmail"
                        value={orgData.orgContactEmail}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.orgContactEmail}
                        data-err="orgContactEmail"
                      />
                      {orgErrors.orgContactEmail && (
                        <div className="red-note">{orgErrors.orgContactEmail}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Contact Phone (10 digits, optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgContactPhone"
                        value={orgData.orgContactPhone}
                        onChange={(e) => handlePhoneChange(e, true)}
                        isInvalid={!!orgErrors.orgContactPhone}
                        data-err="orgContactPhone"
                        placeholder="10-digit number"
                      />
                      {orgErrors.orgContactPhone && (
                        <div className="red-note">{orgErrors.orgContactPhone}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Organization Address (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgAddress"
                        value={orgData.orgAddress}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>Project Lead Wallet (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="ownerWallet"
                        placeholder="0x..."
                        value={orgData.ownerWallet}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.ownerWallet}
                        data-err="ownerWallet"
                      />
                      {orgErrors.ownerWallet && (
                        <div className="red-note">{orgErrors.ownerWallet}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>B. Project Time & Status</SectionTitle>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={orgData.startDate}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.startDate}
                        data-err="startDate"
                      />
                      {orgErrors.startDate && (
                        <div className="red-note">{orgErrors.startDate}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Base/Baseline Date (optional)</Form.Label>
                      <Form.Control
                        type="date"
                        name="baseDate"
                        value={orgData.baseDate}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Check
                        type="checkbox"
                        name="ongoing"
                        checked={orgData.ongoing}
                        onChange={(e) => handleChange(e, true)}
                        label="Ongoing project"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                {!orgData.ongoing && (
                  <Form.Group className="mb-3 anim-slide-r">
                    <Form.Label>End Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={orgData.endDate}
                      onChange={(e) => handleChange(e, true)}
                      isInvalid={!!orgErrors.endDate}
                      data-err="endDate"
                    />
                    {orgErrors.endDate && (
                      <div className="red-note">{orgErrors.endDate}</div>
                    )}
                  </Form.Group>
                )}

                <SectionTitle>C. Location & Spatial Data</SectionTitle>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>Country *</Form.Label>
                      <Form.Select
                        name="country"
                        value={orgData.country}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.country}
                        data-err="country"
                        className="themed-btn"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Form.Select>
                      {orgErrors.country && (
                        <div className="red-note">{orgErrors.country}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>Place Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="placeName"
                        value={orgData.placeName}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.placeName}
                        data-err="placeName"
                      />
                      {orgErrors.placeName && (
                        <div className="red-note">{orgErrors.placeName}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Latitude *</Form.Label>
                      <Form.Control
                        type="number"
                        name="lat"
                        value={orgData.lat}
                        onChange={(e) => handleChange(e, true)}
                        step="0.0001"
                        min={-90}
                        max={90}
                        isInvalid={!!orgErrors.lat}
                        data-err="lat"
                      />
                      {orgErrors.lat && <div className="red-note">{orgErrors.lat}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Longitude *</Form.Label>
                      <Form.Control
                        type="number"
                        name="lng"
                        value={orgData.lng}
                        onChange={(e) => handleChange(e, true)}
                        step="0.0001"
                        min={-180}
                        max={180}
                        isInvalid={!!orgErrors.lng}
                        data-err="lng"
                      />
                      {orgErrors.lng && <div className="red-note">{orgErrors.lng}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>GPS Accuracy (m) (optional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="gpsAccuracy"
                        value={orgData.gpsAccuracy}
                        onChange={(e) => handleChange(e, true)}
                        step="0.1"
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <div className="d-flex gap-2 mb-3">
                      <Button variant="outline-primary" className="themed-btn" onClick={useDeviceGPSOrg}>
                        Use GPS
                      </Button>
                      <Button variant="outline-secondary" className="themed-btn" onClick={() => setShowMapFor("org")}>
                        Pick on Map
                      </Button>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Area (ha) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="areaHa"
                        value={orgData.areaHa}
                        onChange={(e) => handleChange(e, true)}
                        step="0.01"
                        min={0.01}
                        isInvalid={!!orgErrors.areaHa}
                        data-err="areaHa"
                      />
                      {orgErrors.areaHa && (
                        <div className="red-note">{orgErrors.areaHa}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Boundary File (GeoJSON/KML/ZIP)
                        <HoldTip text="Upload GeoJSON, KML, or zipped shapefile (<=20MB). If not available provide centroid + area." />
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="geoBoundaryFile"
                        accept=".geojson,.json,.kml,.zip"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.geoBoundaryFile}
                        data-err="geoBoundaryFile"
                        className="upload-animated"
                      />
                      {orgErrors.geoBoundaryFile && (
                        <div className="red-note">{orgErrors.geoBoundaryFile}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>D. Technical & MRV</SectionTitle>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>
                        Ecosystems (choose all that apply) *
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-3">
                        {ECOSYSTEM_OPTIONS.map((eco) => (
                          <Form.Check
                            key={eco}
                            type="checkbox"
                            label={eco}
                            checked={(orgData.ecosystems || []).includes(eco)}
                            onChange={() => toggleEcoOrg(eco)}
                          />
                        ))}
                      </div>
                      {orgErrors.ecosystems && (
                        <div className="red-note" data-err="ecosystems">
                          {orgErrors.ecosystems}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3 anim-zoom">
                  <Form.Label>
                    Methodology / Standard *
                    <HoldTip text="E.g., IPCC Tier 1/2, Verra VM0033 variant, or custom. Describe references and approach briefly." />
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="methodology"
                    value={orgData.methodology}
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.methodology}
                    data-err="methodology"
                  />
                  {orgErrors.methodology && (
                    <div className="red-note">{orgErrors.methodology}</div>
                  )}
                </Form.Group>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Estimated Sequestration (tCO₂) (opt)</Form.Label>
                      <Form.Control
                        type="number"
                        name="estimatedSequestrationTCO2"
                        value={orgData.estimatedSequestrationTCO2}
                        onChange={(e) => handleChange(e, true)}
                        min={0}
                        step="0.01"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Requested Credits (opt)</Form.Label>
                      <Form.Control
                        type="number"
                        name="requestedCredits"
                        value={orgData.requestedCredits}
                        onChange={(e) => handleChange(e, true)}
                        min={0}
                        step="1"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>E. Planting & Biological Data</SectionTitle>
                <div className="mb-2 anim-zoom">
                  <div className="mb-1">
                    Select Plant Types (checkbox, multi-select){" "}
                    <HoldTip text="Choose plant categories. If you select more than two, you must provide counts for each and upload a research report." />
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Mangroves"
                      checked={orgData.plantTypes.mangroves}
                      onChange={() => togglePlantTypeOrg("mangroves")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Seagrasses"
                      checked={orgData.plantTypes.seagrasses}
                      onChange={() => togglePlantTypeOrg("seagrasses")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Tidal Marshes"
                      checked={orgData.plantTypes.tidalMarshes}
                      onChange={() => togglePlantTypeOrg("tidalMarshes")}
                    />
                  </div>
                  {orgErrors.plantTypes && (
                    <div className="red-note" data-err="plantTypes">
                      {orgErrors.plantTypes}
                    </div>
                  )}
                </div>

                {/* SHOW NUMBER INPUTS WHENEVER THAT TYPE IS SELECTED */}
                <Row className="mb-2 anim-slide-r">
                  {orgData.plantTypes.mangroves && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Mangroves)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numMangroves"
                          value={orgData.numMangroves}
                          onChange={(e) => handleChange(e, true)}
                          min={1}
                          isInvalid={!!orgErrors.numMangroves}
                          data-err="numMangroves"
                        />
                        {orgErrors.numMangroves && (
                          <div className="red-note">{orgErrors.numMangroves}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                  {orgData.plantTypes.seagrasses && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Seagrasses)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numSeagrasses"
                          value={orgData.numSeagrasses}
                          onChange={(e) => handleChange(e, true)}
                          min={1}
                          isInvalid={!!orgErrors.numSeagrasses}
                          data-err="numSeagrasses"
                        />
                        {orgErrors.numSeagrasses && (
                          <div className="red-note">{orgErrors.numSeagrasses}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                  {orgData.plantTypes.tidalMarshes && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Number of plants (Tidal Marshes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="numTidalMarshes"
                          value={orgData.numTidalMarshes}
                          onChange={(e) => handleChange(e, true)}
                          min={1}
                          isInvalid={!!orgErrors.numTidalMarshes}
                          data-err="numTidalMarshes"
                        />
                        {orgErrors.numTidalMarshes && (
                          <div className="red-note">{orgErrors.numTidalMarshes}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="mb-2 anim-zoom">
                  <div className="mb-1">Species List (at least one row)</div>
                  {orgData.speciesList.map((s, idx) => (
                    <Row key={idx} className="mb-2 align-items-end">
                      <Col md={3}>
                        <Form.Control
                          placeholder="Species name"
                          name="speciesName"
                          value={s.speciesName}
                          onChange={(e) => handleSpeciesChange(idx, e)}
                          isInvalid={!!orgErrors.speciesList && idx === 0 && !s.speciesName}
                          data-err="speciesList"
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Count planted"
                          type="number"
                          name="countPlanted"
                          value={s.countPlanted}
                          onChange={(e) => handleSpeciesChange(idx, e)}
                          min={0}
                          isInvalid={!!orgErrors[`speciesList_${idx}_countPlanted`]}
                          data-err={`speciesList_${idx}_countPlanted`}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Density (per ha)"
                          name="plantingDensity"
                          value={s.plantingDensity}
                          onChange={(e) => handleSpeciesChange(idx, e)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Survival %"
                          name="expectedSurvivalPercent"
                          type="number"
                          value={s.expectedSurvivalPercent}
                          onChange={(e) => handleSpeciesChange(idx, e)}
                          min={0}
                          max={100}
                          isInvalid={
                            !!orgErrors[`speciesList_${idx}_expectedSurvivalPercent`]
                          }
                          data-err={`speciesList_${idx}_expectedSurvivalPercent`}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          placeholder="Age class"
                          name="ageClass"
                          value={s.ageClass}
                          onChange={(e) => handleSpeciesChange(idx, e)}
                        />
                      </Col>
                      <Col md={1} className="text-end">
                        {idx === 0 ? (
                          <Button variant="success" size="sm" onClick={addSpeciesRow}>
                            +
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeSpeciesRow(idx)}
                          >
                            -
                          </Button>
                        )}
                      </Col>
                    </Row>
                  ))}
                  {orgErrors.speciesList && (
                    <div className="red-note">{orgErrors.speciesList}</div>
                  )}
                </div>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Planting Regime (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="plantingRegime"
                        value={orgData.plantingRegime}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Initial Densities (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="density"
                        value={orgData.density}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>F. Monitoring & Sampling</SectionTitle>
                <Form.Group className="mb-3 anim-zoom">
                  <Form.Label>Monitoring Plan *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="monitoringPlan"
                    value={orgData.monitoringPlan}
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.monitoringPlan}
                    data-err="monitoringPlan"
                  />
                  {orgErrors.monitoringPlan && (
                    <div className="red-note">{orgErrors.monitoringPlan}</div>
                  )}
                </Form.Group>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Soil Bulk Density (g/cm³) (opt)
                        <HoldTip text="Typical range 0.2–2.0 g/cm³." />
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="soilBulkDensity"
                        value={orgData.soilBulkDensity}
                        onChange={(e) => handleChange(e, true)}
                        step="0.01"
                        min="0"
                        isInvalid={!!orgErrors.soilBulkDensity}
                        data-err="soilBulkDensity"
                      />
                      {orgErrors.soilBulkDensity && (
                        <div className="red-note">{orgErrors.soilBulkDensity}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Soil Organic Carbon (%) (opt)</Form.Label>
                      <Form.Control
                        type="number"
                        name="soilOrganicCarbonPercent"
                        value={orgData.soilOrganicCarbonPercent}
                        onChange={(e) => handleChange(e, true)}
                        step="0.1"
                        min="0"
                        isInvalid={!!orgErrors.soilOrganicCarbonPercent}
                        data-err="soilOrganicCarbonPercent"
                      />
                      {orgErrors.soilOrganicCarbonPercent && (
                        <div className="red-note">
                          {orgErrors.soilOrganicCarbonPercent}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Water Salinity (PSU) (opt)</Form.Label>
                      <Form.Control
                        type="number"
                        name="waterSalinityPsu"
                        value={orgData.waterSalinityPsu}
                        onChange={(e) => handleChange(e, true)}
                        step="0.1"
                        min="0"
                        isInvalid={!!orgErrors.waterSalinityPsu}
                        data-err="waterSalinityPsu"
                      />
                      {orgErrors.waterSalinityPsu && (
                        <div className="red-note">{orgErrors.waterSalinityPsu}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Water pH (opt)</Form.Label>
                      <Form.Control
                        type="number"
                        name="waterPh"
                        value={orgData.waterPh}
                        onChange={(e) => handleChange(e, true)}
                        step="0.1"
                        min="0"
                        isInvalid={!!orgErrors.waterPh}
                        data-err="waterPh"
                      />
                      {orgErrors.waterPh && (
                        <div className="red-note">{orgErrors.waterPh}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>Signature</SectionTitle>
                <Row className="anim-zoom">
                  <Col md={7}>
                    <div className="mb-2">
                      <SignaturePad
                        onSave={(dataUrl) => setOrgField("signatureDataUrl", dataUrl)}
                        initialDataUrl={orgData.signatureDataUrl}
                      />
                    </div>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-2">
                      <Form.Label>Or upload signature image (camera supported)</Form.Label>
                      <Form.Control
                        type="file"
                        name="signatureFile"
                        accept="image/*"
                        capture="user"
                        onChange={(e) =>
                          setOrgField("signatureFile", e.target.files?.[0] || null)
                        }
                        className="upload-animated"
                      />
                      <FileHints text="PNG/JPG; live camera capture supported on mobile." />
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>G. Evidence Files</SectionTitle>
                <Form.Group className="mb-3 anim-slide-l">
                  <Form.Label>High-resolution Photos *</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    name="photos"
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.photos}
                    data-err="photos"
                    className="upload-animated"
                  />
                  {orgErrors.photos && <div className="red-note">{orgErrors.photos}</div>}
                  <FileHints text={`JPG/PNG, ${MIN_IMAGE_KB}KB–${MAX_ORG_PHOTO_MB}MB each. Provide onset + monitoring images.`} />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Satellite Imagery (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".tif,.tiff,.jpg,.jpeg,.png"
                        name="satelliteImages"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.satelliteImages}
                        data-err="satelliteImages"
                        className="upload-animated"
                      />
                      {orgErrors.satelliteImages && (
                        <div className="red-note">{orgErrors.satelliteImages}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Lab Reports (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        name="labReports"
                        onChange={(e) => handleChange(e, true)}
                        className="upload-animated"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>
                        Research Documents {selectedPlantTypeCountOrg > 2 ? "(required)" : "(optional)"}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        name="researchDocs"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.researchDocs}
                        data-err="researchDocs"
                        className="upload-animated"
                      />
                      {orgErrors.researchDocs && (
                        <div className="red-note">{orgErrors.researchDocs}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Funding / Agreements (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        name="fundingDocs"
                        onChange={(e) => handleChange(e, true)}
                        className="upload-animated"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3 anim-zoom">
                  <Form.Label>Permits & Legal Docs</Form.Label>
                  <div className="mb-2">
                    <Form.Check
                      inline
                      type="radio"
                      id="reg-yes"
                      name="regulatoryRequired"
                      label="Permits required"
                      checked={orgData.regulatoryRequired === "yes"}
                      onChange={() => setOrgField("regulatoryRequired", "yes")}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="reg-no"
                      name="regulatoryRequired"
                      label="Not required"
                      checked={orgData.regulatoryRequired === "no"}
                      onChange={() => setOrgField("regulatoryRequired", "no")}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="reg-unsure"
                      name="regulatoryRequired"
                      label="Unsure"
                      checked={orgData.regulatoryRequired === "unsure"}
                      onChange={() => setOrgField("regulatoryRequired", "unsure")}
                    />
                  </div>
                  {orgErrors.regulatoryRequired && (
                    <div className="red-note" data-err="regulatoryRequired">
                      {orgErrors.regulatoryRequired}
                    </div>
                  )}

                  <Row className="mt-2">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          License Number {orgData.regulatoryRequired === "yes" ? "*" : "(optional)"}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="licenseNumber"
                          value={orgData.licenseNumber}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseNumber}
                          data-err="licenseNumber"
                        />
                        {orgErrors.licenseNumber && (
                          <div className="red-note">{orgErrors.licenseNumber}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          License Document {orgData.regulatoryRequired === "yes" ? "*" : "(optional)"}
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="licenseDoc"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseDoc}
                          data-err="licenseDoc"
                          className="upload-animated"
                        />
                        {orgErrors.licenseDoc && (
                          <div className="red-note">{orgErrors.licenseDoc}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Permits / Legal Docs</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          name="permitDocs"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.permitDocs}
                          data-err="permitDocs"
                          className="upload-animated"
                        />
                        {orgErrors.permitDocs && (
                          <div className="red-note">{orgErrors.permitDocs}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Land Ownership Proof (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="landOwnershipProof"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          className="upload-animated"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Community Consent Doc (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="communityConsentDoc"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          className="upload-animated"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form.Group>

                <SectionTitle>H–L. Additional Fields</SectionTitle>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Partners (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="partners"
                        value={orgData.partners}
                        onChange={(e) => handleChange(e, true)}
                        placeholder="Comma-separated list"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-l">
                      <Form.Label>Verifier Contact (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="verifierContact"
                        value={orgData.verifierContact}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Funding Source (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="fundingSource"
                        value={orgData.fundingSource}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-slide-r">
                      <Form.Label>Benefit Sharing Plan (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="benefitSharing"
                        value={orgData.benefitSharing}
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Label>Tags / Keywords (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={orgData.tags}
                        onChange={(e) => handleChange(e, true)}
                        placeholder="Comma-separated"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-center">
                    <Form.Group className="mb-3 anim-zoom">
                      <Form.Check
                        type="checkbox"
                        name="isConfidential"
                        checked={orgData.isConfidential}
                        onChange={(e) => handleChange(e, true)}
                        label="Mark certain docs confidential"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3 anim-slide-r">
                  <Form.Check
                    type="checkbox"
                    name="consent"
                    checked={orgData.consent}
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.consent}
                    data-err="consent"
                    label="I confirm the information is true and I have the right to upload these files and, on approval, anchor the project hash on-chain. *"
                  />
                  {orgErrors.consent && (
                    <div className="red-note">{orgErrors.consent}</div>
                  )}
                </Form.Group>
              </>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button type="submit" variant="primary" disabled={submitting} className="themed-btn">
                {submitting ? "Submitting..." : "Submit Project"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => (window.location.href = "/home")}
                className="themed-btn"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline-success"
                className="themed-btn"
                onClick={handleSaveDraftClick}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                onClick={handleClearClick}
                className="themed-btn"
              >
                Clear Draft
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Map Modals */}
      <MapPickerModal
        show={showMapFor === "local"}
        onHide={() => setShowMapFor(null)}
        initialLat={
          localData.lat !== "" && !Number.isNaN(Number(localData.lat))
            ? Number(localData.lat)
            : undefined
        }
        initialLng={
          localData.lng !== "" && !Number.isNaN(Number(localData.lng))
            ? Number(localData.lng)
            : undefined
        }
        onApply={({ lat, lng }) => {
          setLocalField("lat", lat.toFixed(6));
          setLocalField("lng", lng.toFixed(6));
        }}
        title="Pick Local Project Location"
      />
      <MapPickerModal
        show={showMapFor === "org"}
        onHide={() => setShowMapFor(null)}
        initialLat={
          orgData.lat !== "" && !Number.isNaN(Number(orgData.lat))
            ? Number(orgData.lat)
            : undefined
        }
        initialLng={
          orgData.lng !== "" && !Number.isNaN(Number(orgData.lng))
            ? Number(orgData.lng)
            : undefined
        }
        onApply={({ lat, lng }) => {
          setOrgField("lat", lat.toFixed(6));
          setOrgField("lng", lng.toFixed(6));
        }}
        title="Pick Organization Project Location"
      />

      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="checkmark">✓</div>
            <h5 className="mb-1">Thank you!</h5>
            <div className="text-muted">Your project was submitted successfully.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
Backend server.js (Express mount + uploads + CORS)
// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// If you already export a pg pool from ./db, keep as is
const projectsRouter = require("./routes/projects");

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// serve uploaded files (for previews/download)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// projects API (Local + Org)
app.use("/api/projects", projectsRouter);

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
Backend routes (projects)
// routes/projects.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db"); // your pg Pool

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({ storage });

const multiFields = upload.fields([
  { name: "photos" },
  { name: "supportingDocs" },
  { name: "permitDocs" },
  { name: "fundingDocs" },
  { name: "satelliteImages" },
  { name: "labReports" },
  { name: "researchDocs" },
  { name: "geoBoundaryFile", maxCount: 1 },
  { name: "licenseDoc", maxCount: 1 },
  { name: "landOwnershipProof", maxCount: 1 },
  { name: "communityConsentDoc", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

async function insertFiles(client, table, projectId, kind, files) {
  if (!files || !files.length) return;
  const sql = `
    INSERT INTO ${table} (project_id, kind, file_name, url, size_bytes, mime_type)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  for (const f of files) {
    const url = `/uploads/${f.filename}`;
    await client.query(sql, [
      projectId,
      kind,
      f.originalname,
      url,
      f.size,
      f.mimetype,
    ]);
  }
}

router.post("/", multiFields, async (req, res) => {
  const type = req.body.type;
  if (!type || !["local", "org"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (type === "local") {
      const b = req.body;
      const ecosystems = JSON.parse(b.ecosystems || "[]");
      const plantTypes = JSON.parse(b.plantTypes || "{}");

      const insertLocal = `
        INSERT INTO projects_local
        (project_title, owner_name, owner_phone, owner_email,
         country, place_name, lat, lng, gps_accuracy, area_ha,
         approx_plants, start_date, short_description,
         ecosystems, plant_types, num_mangroves, num_seagrasses, num_tidal_marshes,
         intends_carbon_credits, has_permit, consent, client_sha256, status)
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16,$17,$18,$19,$20,$21,$22,'pending')
        RETURNING id
      `;
      const r = await client.query(insertLocal, [
        b.projectTitle || null,
        b.ownerName || null,
        b.ownerPhone || null,
        b.ownerEmail || null,
        b.country || null,
        b.placeName || null,
        b.lat ? Number(b.lat) : null,
        b.lng ? Number(b.lng) : null,
        b.gpsAccuracy ? Number(b.gpsAccuracy) : null,
        b.areaHa ? Number(b.areaHa) : null,
        b.approxPlants ? Number(b.approxPlants) : null,
        b.startDate || null,
        b.shortDescription || null,
        JSON.stringify(ecosystems),
        JSON.stringify(plantTypes),
        b.numMangroves ? Number(b.numMangroves) : null,
        b.numSeagrasses ? Number(b.numSeagrasses) : null,
        b.numTidalMarshes ? Number(b.numTidalMarshes) : null,
        b.intendsCarbonCredits === "true",
        b.hasPermit === "true",
        b.consent === "true",
        b.clientSha256 || null,
      ]);

      const projectId = r.rows[0].id;
      await insertFiles(client, "local_files", projectId, "photos", req.files["photos"]);
      await insertFiles(client, "local_files", projectId, "supportingDocs", req.files["supportingDocs"]);
      await insertFiles(client, "local_files", projectId, "permitDoc", req.files["permitDoc"]);
      await insertFiles(client, "local_files", projectId, "signature", req.files["signature"]);

      await client.query("COMMIT");
      return res.json({ success: true, id: projectId, type: "local" });
    }

    if (type === "org") {
      const b = req.body;
      const ecosystems = JSON.parse(b.ecosystems || "[]");
      const plantTypes = JSON.parse(b.plantTypes || "{}");
      const speciesList = JSON.parse(b.speciesList || "[]");

      const insertOrg = `
        INSERT INTO projects_org
        (project_title, project_external_id,
         organization_type, organization_name, org_registration_number,
         org_contact_name, org_contact_email, org_contact_phone,
         org_address, owner_wallet,
         start_date, base_date, ongoing, end_date,
         place_name, state, district, country,
         lat, lng, gps_accuracy, area_ha, map_reference,
         ecosystems, habitat_type, methodology,
         estimated_sequestration_tco2, requested_credits,
         species_list, planting_regime, density, monitoring_plan, sample_protocol,
         baseline_carbon, calculation_params, partners, roles_json, verifier_contact,
         funding_source, benefit_sharing, tags, is_confidential,
         regulatory_required, license_number,
         soil_bulk_density, soil_organic_carbon_percent, water_salinity_psu, water_ph,
         consent, client_sha256, status)
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
         $24::jsonb,$25,$26,$27,$28,
         $29::jsonb,$30,$31,$32,$33,
         $34,$35,$36,$37,$38,
         $39,$40,$41,$42,
         $43,$44,
         $45,$46,$47,$48,
         $49,$50,'pending')
        RETURNING id
      `;

      const r = await client.query(insertOrg, [
        b.projectTitle || null,
        b.projectExternalId || null,
        b.organizationType || null,
        b.organizationName || null,
        b.orgRegistrationNumber || null,
        b.orgContactName || null,
        b.orgContactEmail || null,
        b.orgContactPhone || null,
        b.orgAddress || null,
        b.ownerWallet || null,
        b.startDate || null,
        b.baseDate || null,
        b.ongoing === "true",
        b.endDate || null,
        b.placeName || null,
        b.state || null,
        b.district || null,
        b.country || null,
        b.lat ? Number(b.lat) : null,
        b.lng ? Number(b.lng) : null,
        b.gpsAccuracy ? Number(b.gpsAccuracy) : null,
        b.areaHa ? Number(b.areaHa) : null,
        b.mapReference || null,
        JSON.stringify(ecosystems),
        b.habitatType || null,
        b.methodology || null,
        b.estimatedSequestrationTCO2 ? Number(b.estimatedSequestrationTCO2) : null,
        b.requestedCredits ? Number(b.requestedCredits) : null,
        JSON.stringify(speciesList),
        b.plantingRegime || null,
        b.density || null,
        b.monitoringPlan || null,
        b.sampleProtocol || null,
        b.baselineCarbon || null,
        b.calculationParams || null,
        b.partners || null,
        b.rolesJson || null,
        b.verifierContact || null,
        b.fundingSource || null,
        b.benefitSharing || null,
        b.tags || null,
        b.isConfidential === "true",
        b.regulatoryRequired || null,
        b.licenseNumber || null,
        b.soilBulkDensity ? Number(b.soilBulkDensity) : null,
        b.soilOrganicCarbonPercent ? Number(b.soilOrganicCarbonPercent) : null,
        b.waterSalinityPsu ? Number(b.waterSalinityPsu) : null,
        b.waterPh ? Number(b.waterPh) : null,
        b.consent === "true",
        b.clientSha256 || null,
      ]);

      const projectId = r.rows[0].id;

      await insertFiles(client, "org_files", projectId, "photos", req.files["photos"]);
      await insertFiles(client, "org_files", projectId, "satelliteImages", req.files["satelliteImages"]);
      await insertFiles(client, "org_files", projectId, "labReports", req.files["labReports"]);
      await insertFiles(client, "org_files", projectId, "researchDocs", req.files["researchDocs"]);
      await insertFiles(client, "org_files", projectId, "permitDocs", req.files["permitDocs"]);
      await insertFiles(client, "org_files", projectId, "fundingDocs", req.files["fundingDocs"]);
      await insertFiles(client, "org_files", projectId, "geoBoundaryFile", req.files["geoBoundaryFile"]);
      await insertFiles(client, "org_files", projectId, "licenseDoc", req.files["licenseDoc"]);
      await insertFiles(client, "org_files", projectId, "landOwnershipProof", req.files["landOwnershipProof"]);
      await insertFiles(client, "org_files", projectId, "communityConsentDoc", req.files["communityConsentDoc"]);
      await insertFiles(client, "org_files", projectId, "signature", req.files["signature"]);

      await client.query("COMMIT");
      return res.json({ success: true, id: projectId, type: "org" });
    }
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    return res.status(500).json({ error: "Failed to save project" });
  } finally {
    client.release();
  }
});

router.get("/", async (_req, res) => {
  const q = `
    SELECT id, 'local' as type, project_title, place_name, country, created_at, area_ha, ecosystems, status
    FROM projects_local
    UNION ALL
    SELECT id, 'org' as type, project_title, place_name, country, created_at, area_ha, ecosystems, status
    FROM projects_org
    ORDER BY created_at DESC
    LIMIT 500
  `;
  const r = await pool.query(q);
  res.json(r.rows || []);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const local = await pool.query("SELECT * FROM projects_local WHERE id = $1", [id]);
  if (local.rows.length) {
    const files = await pool.query("SELECT * FROM local_files WHERE project_id = $1", [id]);
    return res.json({ ...local.rows[0], files: files.rows });
  }
  const org = await pool.query("SELECT * FROM projects_org WHERE id = $1", [id]);
  if (org.rows.length) {
    const files = await pool.query("SELECT * FROM org_files WHERE project_id = $1", [id]);
    return res.json({ ...org.rows[0], files: files.rows });
  }
  return res.status(404).json({ error: "Not found" });
});

module.exports = router;
PostgreSQL schema (with timestamps)
-- db/schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Local projects
CREATE TABLE IF NOT EXISTS projects_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  client_sha256 TEXT,

  project_title TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT NOT NULL,

  country TEXT NOT NULL,
  place_name TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  gps_accuracy NUMERIC,

  area_ha NUMERIC NOT NULL,
  approx_plants NUMERIC,
  start_date DATE,
  short_description TEXT,

  ecosystems JSONB NOT NULL DEFAULT '[]'::jsonb,
  plant_types JSONB NOT NULL DEFAULT '{}'::jsonb,
  num_mangroves NUMERIC,
  num_seagrasses NUMERIC,
  num_tidal_marshes NUMERIC,

  intends_carbon_credits BOOLEAN NOT NULL DEFAULT false,
  has_permit BOOLEAN NOT NULL DEFAULT false,
  consent BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS local_files (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects_local(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kind TEXT NOT NULL, -- photos/supportingDocs/permitDoc/signature
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT
);

-- Organization projects
CREATE TABLE IF NOT EXISTS projects_org (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  client_sha256 TEXT,

  project_title TEXT NOT NULL,
  project_external_id TEXT,

  organization_type TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  org_registration_number TEXT,
  org_contact_name TEXT NOT NULL,
  org_contact_email TEXT NOT NULL,
  org_contact_phone TEXT,
  org_address TEXT,
  owner_wallet TEXT,

  start_date DATE NOT NULL,
  base_date DATE,
  ongoing BOOLEAN NOT NULL DEFAULT true,
  end_date DATE,

  place_name TEXT NOT NULL,
  state TEXT,
  district TEXT,
  country TEXT NOT NULL,

  lat NUMERIC,
  lng NUMERIC,
  gps_accuracy NUMERIC,
  area_ha NUMERIC NOT NULL,
  map_reference TEXT,

  ecosystems JSONB NOT NULL DEFAULT '[]'::jsonb,
  habitat_type TEXT,
  methodology TEXT NOT NULL,
  estimated_sequestration_tco2 NUMERIC,
  requested_credits NUMERIC,

  species_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  planting_regime TEXT,
  density TEXT,
  monitoring_plan TEXT NOT NULL,
  sample_protocol TEXT,

  baseline_carbon TEXT,
  calculation_params TEXT,

  partners TEXT,
  roles_json TEXT,
  verifier_contact TEXT,

  funding_source TEXT,
  benefit_sharing TEXT,
  tags TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT false,

  regulatory_required TEXT,
  license_number TEXT,

  soil_bulk_density NUMERIC,
  soil_organic_carbon_percent NUMERIC,
  water_salinity_psu NUMERIC,
  water_ph NUMERIC,

  consent BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS org_files (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects_org(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kind TEXT NOT NULL, -- see router for values
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT
);
Example queries (admin dashboard, user dashboard)
-- Latest projects for dashboard
SELECT id, 'local' AS type, project_title, created_at, status
FROM projects_local
UNION ALL
SELECT id, 'org' AS type, project_title, created_at, status
FROM projects_org
ORDER BY created_at DESC
LIMIT 100;

-- Project detail (local)
SELECT p.*, f.kind, f.file_name, f.url, f.size_bytes, f.mime_type, f.created_at AS file_created_at
FROM projects_local p
LEFT JOIN local_files f ON f.project_id = p.id
WHERE p.id = $1;

-- Project detail (org)
SELECT p.*, f.kind, f.file_name, f.url, f.size_bytes, f.mime_type, f.created_at AS file_created_at
FROM projects_org p
LEFT JOIN org_files f ON f.project_id = p.id
WHERE p.id = $1;
