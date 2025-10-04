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
  ProgressBar,
} from "react-bootstrap";

// IMPORTANT: In src/index.jsx add:
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

const ECOSYSTEM_KEYS = [
  { key: "mangrove", label: "Mangrove" },
  { key: "seagrass", label: "Seagrass" },
  { key: "saltMarsh", label: "Salt marsh" },
  { key: "mudflat", label: "Coastal mudflat" },
  { key: "sediment", label: "Coastal sediment" },
  { key: "other", label: "Other" },
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MIN_IMAGE_KB = 20;
const MAX_IMAGE_MB = 10;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;

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

const SectionTitle = ({ children, className = "" }) => (
  <div className={`d-flex align-items-center mb-2 ${className}`}>
    <h5 className="mb-0 me-2">{children}</h5>
    <div className="flex-grow-1 hr-fade" />
  </div>
);

const FileHints = ({ text }) => (
  <div className="text-muted small fst-italic mt-1">{text}</div>
);

const sanitizePhone10 = (raw) => {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 10);
  return digits;
};

const RegisterForm = () => {
  // UI state
  const [theme, setTheme] = useState("light"); // 'light' | 'dark'
  const [wizardMode, setWizardMode] = useState(true);
  const [projectType, setProjectType] = useState("Local");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null
  const [localStep, setLocalStep] = useState(0);
  const [orgStep, setOrgStep] = useState(0);

  // Local form
  const [localData, setLocalData] = useState({
    projectTitle: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    // Ecosystem multi-select
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
    // Local plant categories (multi-select like org)
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
    numMangroves: "",
    numSeagrasses: "",
    numTidalMarshes: "",
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
  });
  const [localErrors, setLocalErrors] = useState({});

  // Organization form
  const [orgData, setOrgData] = useState({
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
    // Ecosystem multi-select
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
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
    // Plant categories (multi-select)
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
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
  });
  const [orgErrors, setOrgErrors] = useState({});

  // Steps (wizard)
  const localSteps = [
    "Intro",
    "Project",
    "Owner",
    "Location",
    "AreaDates",
    "Plants",
    "Evidence",
    "Consent",
  ];
  const orgSteps = [
    "Intro",
    "Admin",
    "Time",
    "Location",
    "Tech",
    "PlantsSpecies",
    "Monitoring",
    "Evidence",
    "Permits",
    "Other",
    "Consent",
  ];

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
      const wiz = localStorage.getItem("registerForm.wizardMode");
      if (wiz) setWizardMode(wiz === "true");
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
      localStorage.setItem("registerForm.wizardMode", String(wizardMode));
      stamp();
    } catch {}
    return () => {};
  }, [theme, wizardMode]);

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
      } else if (name === "ownerPhone" || name === "orgContactPhone") {
        copy[name] = sanitizePhone10(value);
      } else {
        copy[name] = value;
      }
      return copy;
    });
  };

  // Toggle ecosystem checkbox
  const toggleEcosystem = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      ecosystems: { ...prev.ecosystems, [key]: !prev.ecosystems[key] },
    }));
  };

  // Toggle plant categories
  const togglePlantType = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  };

  const selectedPlantTypeCountLocal = useMemo(() => {
    const p = localData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [localData.plantTypes]);

  const selectedPlantTypeCountOrg = useMemo(() => {
    const p = orgData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [orgData.plantTypes]);

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

  // Validations
  const atLeastOneTrue = (obj) => Object.values(obj || {}).some(Boolean);

  const validateImages = (files, errsKey) => {
    if (!Array.isArray(files) || files.length < 1)
      return `${errsKey}: upload required.`;
    for (const f of files) {
      const kb = f.size / 1024;
      if (kb < MIN_IMAGE_KB) return "Image is too small (min 20KB).";
      if (f.size > MAX_IMAGE_MB * 1024 * 1024)
        return `Each image must be <= ${MAX_IMAGE_MB} MB.`;
      if (!["image/jpeg", "image/png"].includes(f.type))
        return "Images must be JPG or PNG.";
    }
    return null;
  };

  // Validation - Local
  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!d.ownerPhone || d.ownerPhone.length !== 10)
      errs.ownerPhone = `Enter exactly 10 digits (based on country selection).`;
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";
    if (!atLeastOneTrue(d.ecosystems))
      errs.ecosystems = "Select at least one ecosystem.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    // Photos: at least 2, 20KB–10MB
    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, 20KB–10MB each).";
    } else {
      const msg = validateImages(d.photos, "Photos");
      if (msg) errs.photos = msg;
    }

    // If more than two plant types selected, require per-type numbers
    if (selectedPlantTypeCountLocal > 2) {
      if (d.plantTypes.mangroves && !positive(d.numMangroves))
        errs.numMangroves = "Enter number of Mangrove plants (> 0).";
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses))
        errs.numSeagrasses = "Enter number of Seagrass plants (> 0).";
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes))
        errs.numTidalMarshes = "Enter number of Tidal Marsh plants (> 0).";
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
    if (d.orgContactPhone && d.orgContactPhone.length > 0 && d.orgContactPhone.length !== 10)
      errs.orgContactPhone = "Phone must be exactly 10 digits if provided.";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate) errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!atLeastOneTrue(d.ecosystems))
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

    // Plant categories
    const ptCount =
      (d.plantTypes?.mangroves ? 1 : 0) +
      (d.plantTypes?.seagrasses ? 1 : 0) +
      (d.plantTypes?.tidalMarshes ? 1 : 0);

    if (ptCount === 0) {
      errs.plantTypes =
        "Select at least one plant type (Mangroves/Seagrasses/Tidal Marshes).";
    }
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

    // Evidence rule: 5+ photos OR (>=1 satellite AND >=3 photos), 20KB–10MB
    const numPhotos = Array.isArray(d.photos) ? d.photos.length : 0;
    const numSat = Array.isArray(d.satelliteImages) ? d.satelliteImages.length : 0;
    const photosOk = numPhotos >= 5 || (numSat >= 1 && numPhotos >= 3);
    if (!photosOk) {
      errs.photos = "Minimum evidence: 5+ photos OR 1 satellite image + 3 photos.";
    } else {
      if (Array.isArray(d.photos) && d.photos.length) {
        const msg = validateImages(d.photos, "Photos");
        if (msg) errs.photos = msg;
      }
      if (Array.isArray(d.satelliteImages) && d.satelliteImages.length) {
        for (const f of d.satelliteImages) {
          const kb = f.size / 1024;
          if (kb < MIN_IMAGE_KB) {
            errs.satelliteImages = "Satellite image is too small (min 20KB).";
            break;
          }
          if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
            errs.satelliteImages = `Satellite image must be <= ${MAX_IMAGE_MB} MB.`;
            break;
          }
          const name = (f.name || "").toLowerCase();
          const typeOk = ["image/tiff", "image/tif", "image/jpeg", "image/jpg", "image/png"].includes(
            f.type
          );
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
      errs.soilOrganicCarbonPercent = "SOC% should be between 0 and 60.";
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
    } catch {}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorSummary("");
    setSubmitting(true);

    if (projectType === "Local") {
      const errs = validateLocal();
      setLocalErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    } else {
      const errs = validateOrg();
      setOrgErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    }

    // Success (no backend)
    setTimeout(() => {
      setShowSuccess(true);
      clearDraft();
      setTimeout(() => {
        setShowSuccess(false);
        window.location.href = "/";
      }, 1600);
    }, 350);
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

  const localProgress =
    ((localStep + 1) / localSteps.length) * 100;
  const orgProgress =
    ((orgStep + 1) / orgSteps.length) * 100;

  return (
    <div className={`container py-4 theme-${theme}`}>
      <style>{`
        :root {
          --bg: #f8fafc;
          --text: #0f172a;
          --card-bg: rgba(255,255,255,0.9);
          --muted: #64748b;
          --primary1: #4f46e5;
          --primary2: #0ea5e9;
          --accent: #22c55e;
          --danger: #ef4444;
        }
        .theme-dark {
          --bg: #0b1020;
          --text: #e5e7eb;
          --card-bg: rgba(17,24,39,0.9);
          --muted: #93a2b1;
          --primary1: #6d5ce7;
          --primary2: #22c1dc;
          --accent: #22d3ee;
          --danger: #f87171;
        }
        body, .theme-light, .theme-dark { background: var(--bg); color: var(--text); }
        .bg-gradient-1 {
          background: linear-gradient(135deg, var(--primary1), var(--primary2));
        }
        .card-neo {
          background: var(--card-bg);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.16);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,0.24); }
        .animate-in { animation: fadeUp .6s ease both; }
        .anim-fade { animation: fadeUp .6s ease both; }
        .anim-slide { animation: slideIn .6s ease both; }
        .anim-scale { animation: scaleIn .5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .section {
          padding: 16px; border-radius: 12px; border: 1px dashed rgba(99,102,241,0.35);
          background: linear-gradient(0deg, rgba(99,102,241,0.08), rgba(14,165,233,0.06));
          margin-bottom: 16px;
        }
        .theme-dark .section {
          border-color: rgba(255,255,255,0.18);
          background: linear-gradient(0deg, rgba(109,92,231,0.12), rgba(34,193,220,0.08));
        }
        .hr-fade { height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0.2), rgba(0,0,0,0)); }
        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .success-card {
          background: var(--card-bg); padding: 24px 28px; border-radius: 16px; text-align: center;
          animation: popIn .35s ease both; color: var(--text);
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .checkmark {
          width: 64px; height: 64px; border-radius: 50%; background: var(--accent);
          display: inline-flex; align-items: center; justify-content: center; color: white;
          font-size: 38px; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.4); animation: pulse 0.9s ease 1;
        }
        @keyframes pulse { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .hold-tip-wrapper { position: relative; display: inline-block; }
        .hold-tip-trigger { color: var(--primary2); margin-left: 6px; cursor: pointer; user-select: none; }
        .hold-tip-bubble {
          position: absolute; top: -8px; left: 20px; min-width: 220px; max-width: 320px;
          background: var(--primary2); color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35); animation: tipFade .2s ease both; z-index: 10;
        }
        @keyframes tipFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
        .red-note { color: var(--danger); font-size: 0.875rem; margin-top: 4px; }

        /* Animated upload */
        .upload-animated::file-selector-button {
          margin-right: 12px;
          border: none;
          background: linear-gradient(135deg, var(--primary2), var(--primary1));
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .25s ease;
          box-shadow: 0 6px 16px rgba(79,70,229,0.3);
        }
        .upload-animated::file-selector-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 10px 22px rgba(79,70,229,0.4);
        }
        .upload-animated::file-selector-button:active {
          transform: translateY(0) scale(0.99);
        }

        .toggle-row { gap: 10px; }
        .toggle-row .btn { transition: transform .15s ease; }
        .toggle-row .btn:hover { transform: translateY(-1px); }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <h4 className="mb-0">Register Project</h4>
              <Badge bg="light" text="dark">
                {projectType}
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Check
                type="switch"
                id="theme-toggle"
                label={theme === "light" ? "Light" : "Dark"}
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              />
              <Form.Check
                type="switch"
                id="wizard-toggle"
                label={wizardMode ? "Wizard" : "Single page"}
                checked={wizardMode}
                onChange={(e) => setWizardMode(e.target.checked)}
              />
              {nowSaved && (
                <span className="small">
                  Autosaved <Badge bg="light" text="dark">{nowSaved}</Badge>
                </span>
              )}
            </div>
          </div>

          {wizardMode && (
            <div className="mt-3">
              <ProgressBar
                now={projectType === "Local" ? localProgress : orgProgress}
                variant="success"
                animated
                style={{ height: 8, background: "rgba(255,255,255,0.35)" }}
              />
            </div>
          )}
        </Card.Header>

        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <div className="mb-3 toggle-row d-flex">
              <Form.Label className="me-2 mb-0">
                Project Type{" "}
                <HoldTip text="Local for individuals/small teams; Organization for full MRV + credits." />
              </Form.Label>
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{ maxWidth: 280 }}
              >
                <option value="Local">Local (short form)</option>
                <option value="Organization">Organization (full, production-grade)</option>
                <option value="Collaboration" disabled>Collaboration (coming soon)</option>
              </Form.Select>
              <Button
                type="button"
                variant="outline-light"
                className="ms-auto"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
            </div>

            {errorSummary && (
              <Alert variant="danger" className="animate-in">{errorSummary}</Alert>
            )}

            {/* LOCAL FORM */}
            {projectType === "Local" && (
              <>
                {/* Intro */}
                {(!wizardMode || localStep === 0) && (
                  <div className="section anim-fade">
                    <p className="mb-2">
                      <strong>Use this Local Project form</strong> when you are a small team,
                      individual, or community restoring a coastal area (mangrove, seagrass,
                      salt marsh). This creates a verifiable record with minimal friction.
                    </p>
                    <div className="text-muted small">
                      Provide accurate location and at least two photos. Drafts save
                      automatically. You can upgrade to an Organization Project later for
                      carbon credits.
                    </div>
                  </div>
                )}

                {/* Project */}
                {(!wizardMode || localStep === 1) && (
                  <div className="section anim-slide">
                    <SectionTitle>Project Details</SectionTitle>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Project Title *
                        <HoldTip text='Short descriptive name. Example: "Ramnagar Mangrove Restoration — 2025". 5–200 chars.' />
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

                    <div className="mb-2">
                      <div className="mb-1">
                        Ecosystem(s) *
                        <HoldTip text="Select all ecosystems present at the site." />
                      </div>
                      <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                        {ECOSYSTEM_KEYS.map((ek) => (
                          <Form.Check
                            key={ek.key}
                            type="checkbox"
                            label={ek.label}
                            checked={!!localData.ecosystems[ek.key]}
                            onChange={() => toggleEcosystem(ek.key, false)}
                          />
                        ))}
                      </div>
                      {localErrors.ecosystems && (
                        <div className="red-note">{localErrors.ecosystems}</div>
                      )}
                    </div>

                    <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Owner */}
                {(!wizardMode || localStep === 2) && (
                  <div className="section anim-scale">
                    <SectionTitle>Owner Details</SectionTitle>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Owner / Primary Contact Name *
                            <HoldTip text="Individual or group lead. 3–120 characters." />
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
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Contact Phone (10 digits) *
                            <HoldTip text="Exactly 10 digits based on country selection (e.g., India/USA local mobile)." />
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="ownerPhone"
                            inputMode="numeric"
                            pattern="\\d{10}"
                            value={localData.ownerPhone}
                            onChange={handleChange}
                            isInvalid={!!localErrors.ownerPhone}
                            data-err="ownerPhone"
                            placeholder="XXXXXXXXXX"
                          />
                          {localErrors.ownerPhone && (
                            <div className="red-note">{localErrors.ownerPhone}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Location */}
                {(!wizardMode || localStep === 3) && (
                  <div className="section anim-fade">
                    <SectionTitle>Location</SectionTitle>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Country *
                            <HoldTip text="Select the country where the project site is located." />
                          </Form.Label>
                          <Form.Select
                            name="country"
                            value={localData.country}
                            onChange={handleChange}
                            isInvalid={!!localErrors.country}
                            data-err="country"
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
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Place Name *
                            <HoldTip text="Village or coastal landmark near the site. 3–200 chars." />
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
                          <Button variant="outline-primary" onClick={useDeviceGPSLocal}>
                            Use GPS
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowMapFor("local")}
                          >
                            Pick on Map
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Latitude *
                            <HoldTip text="GPS latitude. Range -90 to 90." />
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
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Longitude *
                            <HoldTip text="GPS longitude. Range -180 to 180." />
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
                        <Form.Group className="mb-3">
                          <Form.Label>
                            GPS Accuracy (m) (optional)
                            <HoldTip text="If your device reports accuracy, include it." />
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
                  </div>
                )}

                {/* Area & Dates */}
                {(!wizardMode || localStep === 4) && (
                  <div className="section anim-slide">
                    <SectionTitle>Area & Dates</SectionTitle>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Area (hectares) *
                            <HoldTip text="Estimate of area. Decimal precision e.g., 2.50 ha." />
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Plants (multi) */}
                {(!wizardMode || localStep === 5) && (
                  <div className="section anim-scale">
                    <SectionTitle>Plant Types (if applicable)</SectionTitle>
                    <div className="mb-2">
                      <div className="mb-1">
                        Select Plant Types (multi-select)
                        <HoldTip text="Choose plant categories used in the project. If you select more than two, you must provide counts for each." />
                      </div>
                      <div className="d-flex flex-wrap gap-3" data-err="plantTypesLocal">
                        <Form.Check
                          type="checkbox"
                          label="Mangroves"
                          checked={localData.plantTypes.mangroves}
                          onChange={() => togglePlantType("mangroves", false)}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Seagrasses"
                          checked={localData.plantTypes.seagrasses}
                          onChange={() => togglePlantType("seagrasses", false)}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Tidal Marshes"
                          checked={localData.plantTypes.tidalMarshes}
                          onChange={() => togglePlantType("tidalMarshes", false)}
                        />
                      </div>
                    </div>

                    {selectedPlantTypeCountLocal > 2 && (
                      <Row className="mb-2">
                        {localData.plantTypes.mangroves && (
                          <Col md={4}>
                            <Form.Group className="mb-2">
                              <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                              <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                              <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                    )}
                  </div>
                )}

                {/* Evidence */}
                {(!wizardMode || localStep === 6) && (
                  <div className="section anim-fade">
                    <SectionTitle>Evidence</SectionTitle>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Photos (at least 2) *
                        <HoldTip text="Upload clear JPG/PNG images (20KB–10MB each). Include a wide shot and a close-up; GPS-tag helps." />
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="photos"
                        className="upload-animated"
                        multiple
                        accept="image/jpeg,image/png"
                        onChange={handleChange}
                        isInvalid={!!localErrors.photos}
                        data-err="photos"
                      />
                      {localErrors.photos && (
                        <div className="red-note">{localErrors.photos}</div>
                      )}
                      <FileHints text="Recommended: 3–10 photos." />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Onset Image (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            name="onsetImage"
                            className="upload-animated"
                            accept="image/*,application/pdf"
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Supporting Documents (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            name="supportingDocs"
                            className="upload-animated"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            multiple
                            onChange={handleChange}
                          />
                          <FileHints text="Max 20MB each." />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Consent */}
                {(!wizardMode || localStep === 7) && (
                  <div className="section anim-scale">
                    <SectionTitle>Permissions & Consent</SectionTitle>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
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
                                className="upload-animated"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleChange}
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
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

                    <Form.Group className="mb-3">
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
                  </div>
                )}

                {wizardMode && (
                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      disabled={localStep === 0}
                      onClick={() => setLocalStep((s) => Math.max(0, s - 1))}
                    >
                      Back
                    </Button>
                    <div className="d-flex gap-2">
                      <Button
                        type="button"
                        variant="outline-success"
                        onClick={() => {
                          try {
                            localStorage.setItem("registerForm.type", projectType);
                            localStorage.setItem(
                              "registerForm.local",
                              JSON.stringify(localData)
                            );
                            setAutosaveStamp(new Date().toISOString());
                          } catch {}
                        }}
                      >
                        Save Draft
                      </Button>
                      {localStep < localSteps.length - 1 ? (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() =>
                            setLocalStep((s) =>
                              Math.min(localSteps.length - 1, s + 1)
                            )
                          }
                        >
                          Next
                        </Button>
                      ) : (
                        <Button type="submit" variant="primary" disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit Project"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ORGANIZATION FORM */}
            {projectType === "Organization" && (
              <>
                {/* Intro */}
                {(!wizardMode || orgStep === 0) && (
                  <div className="section anim-fade">
                    <p className="mb-2">
                      <strong>Use Organization Project Registration</strong> for NGO, company,
                      government or community projects seeking formal verification and carbon
                      credit issuance.
                    </p>
                  </div>
                )}

                {/* Admin & Identification */}
                {(!wizardMode || orgStep === 1) && (
                  <div className="section anim-slide">
                    <SectionTitle>Administrative & Identification</SectionTitle>
                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>Project Title *</Form.Label>
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
                          <Form.Label>Organization Type *</Form.Label>
                          <Form.Select
                            name="organizationType"
                            value={orgData.organizationType}
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.organizationType}
                            data-err="organizationType"
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Phone (10 digits, optional)</Form.Label>
                          <Form.Control
                            type="tel"
                            name="orgContactPhone"
                            inputMode="numeric"
                            pattern="\\d{10}"
                            value={orgData.orgContactPhone}
                            onChange={(e) => {
                              e.target.value = sanitizePhone10(e.target.value);
                              handleChange(e, true);
                            }}
                            isInvalid={!!orgErrors.orgContactPhone}
                            data-err="orgContactPhone"
                            placeholder="XXXXXXXXXX"
                          />
                          {orgErrors.orgContactPhone && (
                            <div className="red-note">{orgErrors.orgContactPhone}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Time & Status */}
                {(!wizardMode || orgStep === 2) && (
                  <div className="section anim-scale">
                    <SectionTitle>Project Time & Status</SectionTitle>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Location */}
                {(!wizardMode || orgStep === 3) && (
                  <div className="section anim-fade">
                    <SectionTitle>Location & Spatial Data</SectionTitle>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country *</Form.Label>
                          <Form.Select
                            name="country"
                            value={orgData.country}
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.country}
                            data-err="country"
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                          <Button variant="outline-primary" onClick={useDeviceGPSOrg}>
                            Use GPS
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowMapFor("org")}
                          >
                            Pick on Map
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Boundary File (GeoJSON/KML/ZIP)
                            <HoldTip text="Upload GeoJSON, KML, or zipped shapefile (<=20MB). If not available provide centroid + area." />
                          </Form.Label>
                          <Form.Control
                            type="file"
                            name="geoBoundaryFile"
                            className="upload-animated"
                            accept=".geojson,.json,.kml,.zip"
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.geoBoundaryFile}
                            data-err="geoBoundaryFile"
                          />
                          {orgErrors.geoBoundaryFile && (
                            <div className="red-note">{orgErrors.geoBoundaryFile}</div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Technical & MRV */}
                {(!wizardMode || orgStep === 4) && (
                  <div className="section anim-scale">
                    <SectionTitle>Technical & MRV</SectionTitle>

                    <div className="mb-2">
                      <div className="mb-1">Ecosystem(s) *</div>
                      <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                        {ECOSYSTEM_KEYS.map((ek) => (
                          <Form.Check
                            key={ek.key}
                            type="checkbox"
                            label={ek.label}
                            checked={!!orgData.ecosystems[ek.key]}
                            onChange={() => toggleEcosystem(ek.key, true)}
                          />
                        ))}
                      </div>
                      {orgErrors.ecosystems && (
                        <div className="red-note">{orgErrors.ecosystems}</div>
                      )}
                    </div>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Habitat Sub-type (optional)</Form.Label>
                          <Form.Control
                            type="text"
                            name="habitatType"
                            value={orgData.habitatType}
                            onChange={(e) => handleChange(e, true)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Methodology / Standard *
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
                      </Col>
                    </Row>

                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Plants & Species */}
                {(!wizardMode || orgStep === 5) && (
                  <div className="section anim-fade">
                    <SectionTitle>Plant Types & Species</SectionTitle>
                    <div className="mb-2">
                      <div className="mb-1">
                        Plant Types (multi-select)
                        <HoldTip text="Choose plant categories used. If you select more than two, you must provide counts for each and upload a research report." />
                      </div>
                      <div className="d-flex flex-wrap gap-3" data-err="plantTypes">
                        <Form.Check
                          type="checkbox"
                          label="Mangroves"
                          checked={orgData.plantTypes.mangroves}
                          onChange={() => togglePlantType("mangroves", true)}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Seagrasses"
                          checked={orgData.plantTypes.seagrasses}
                          onChange={() => togglePlantType("seagrasses", true)}
                        />
                        <Form.Check
                          type="checkbox"
                          label="Tidal Marshes"
                          checked={orgData.plantTypes.tidalMarshes}
                          onChange={() => togglePlantType("tidalMarshes", true)}
                        />
                      </div>
                      {orgErrors.plantTypes && (
                        <div className="red-note">{orgErrors.plantTypes}</div>
                      )}
                    </div>

                    {selectedPlantTypeCountOrg > 2 && (
                      <Row className="mb-2">
                        {orgData.plantTypes.mangroves && (
                          <Col md={4}>
                            <Form.Group className="mb-2">
                              <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                              <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                              <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                    )}

                    <div className="mb-2">
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
                  </div>
                )}

                {/* Monitoring & MRV metrics */}
                {(!wizardMode || orgStep === 6) && (
                  <div className="section anim-slide">
                    <SectionTitle>Monitoring & MRV Metrics</SectionTitle>
                    <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
                          <Form.Label>Soil Bulk Density (g/cm³) (opt)</Form.Label>
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {/* Evidence */}
                {(!wizardMode || orgStep === 7) && (
                  <div className="section anim-fade">
                    <SectionTitle>Evidence Files</SectionTitle>
                    <Form.Group className="mb-3">
                      <Form.Label>High-resolution Photos *</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/jpeg,image/png"
                        name="photos"
                        className="upload-animated"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.photos}
                        data-err="photos"
                      />
                      {orgErrors.photos && <div className="red-note">{orgErrors.photos}</div>}
                      <FileHints text={`JPG/PNG, 20KB–${MAX_IMAGE_MB}MB each. Provide onset + monitoring images.`} />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Satellite Imagery (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            multiple
                            accept=".tif,.tiff,.jpg,.jpeg,.png"
                            name="satelliteImages"
                            className="upload-animated"
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.satelliteImages}
                            data-err="satelliteImages"
                          />
                          {orgErrors.satelliteImages && (
                            <div className="red-note">{orgErrors.satelliteImages}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Lab Reports (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            name="labReports"
                            className="upload-animated"
                            onChange={(e) => handleChange(e, true)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Research Documents {selectedPlantTypeCountOrg > 2 ? "(required)" : "(optional)"}
                          </Form.Label>
                          <Form.Control
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            name="researchDocs"
                            className="upload-animated"
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.researchDocs}
                            data-err="researchDocs"
                          />
                          {orgErrors.researchDocs && (
                            <div className="red-note">{orgErrors.researchDocs}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Funding / Agreements (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            name="fundingDocs"
                            className="upload-animated"
                            onChange={(e) => handleChange(e, true)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Permits */}
                {(!wizardMode || orgStep === 8) && (
                  <div className="section anim-scale">
                    <SectionTitle>Permits & Legal Docs</SectionTitle>
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
                            className="upload-animated"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.licenseDoc}
                            data-err="licenseDoc"
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
                            className="upload-animated"
                            onChange={(e) => handleChange(e, true)}
                            isInvalid={!!orgErrors.permitDocs}
                            data-err="permitDocs"
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
                            className="upload-animated"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleChange(e, true)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Community Consent Doc (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            name="communityConsentDoc"
                            className="upload-animated"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleChange(e, true)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Other & Consent */}
                {(!wizardMode || orgStep === 9) && (
                  <div className="section anim-fade">
                    <SectionTitle>Additional</SectionTitle>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                        <Form.Group className="mb-3">
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
                  </div>
                )}

                {(!wizardMode || orgStep === 10) && (
                  <div className="section anim-scale">
                    <SectionTitle>Declarations & Consent</SectionTitle>
                    <Form.Group className="mb-3">
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
                  </div>
                )}

                {wizardMode && (
                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      disabled={orgStep === 0}
                      onClick={() => setOrgStep((s) => Math.max(0, s - 1))}
                    >
                      Back
                    </Button>
                    <div className="d-flex gap-2">
                      <Button
                        type="button"
                        variant="outline-success"
                        onClick={() => {
                          try {
                            localStorage.setItem("registerForm.type", projectType);
                            localStorage.setItem(
                              "registerForm.org",
                              JSON.stringify(orgData)
                            );
                            setAutosaveStamp(new Date().toISOString());
                          } catch {}
                        }}
                      >
                        Save Draft
                      </Button>
                      {orgStep < orgSteps.length - 1 ? (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() =>
                            setOrgStep((s) => Math.min(orgSteps.length - 1, s + 1))
                          }
                        >
                          Next
                        </Button>
                      ) : (
                        <Button type="submit" variant="primary" disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit Project"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {!wizardMode && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => (window.location.href = "/")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline-success"
                  onClick={() => {
                    try {
                      localStorage.setItem("registerForm.type", projectType);
                      localStorage.setItem(
                        "registerForm.local",
                        JSON.stringify(localData)
                      );
                      localStorage.setItem("registerForm.org", JSON.stringify(orgData));
                      setAutosaveStamp(new Date().toISOString());
                    } catch {}
                  }}
                >
                  Save Draft
                </Button>
                <Button type="button" variant="outline-danger" onClick={clearDraft}>
                  Clear Draft
                </Button>
              </div>
            )}
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
Install
npm install react-bootstrap bootstrap
In src/index.jsx: import 'bootstrap/dist/css/bootstrap.min.css'
PostgreSQL schema (save to database)
-- Organizations
CREATE TABLE IF NOT EXISTS projects_org (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  ongoing BOOLEAN NOT NULL DEFAULT TRUE,
  end_date DATE,
  place_name TEXT NOT NULL,
  state TEXT,
  district TEXT,
  country TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  area_ha NUMERIC(12,2) NOT NULL,
  ecosystems JSONB NOT NULL,       -- {mangrove:true,...}
  habitat_type TEXT,
  methodology TEXT NOT NULL,
  estimated_sequestration_tco2 NUMERIC,
  requested_credits NUMERIC,
  plant_types JSONB NOT NULL,      -- {mangroves:true,...}
  num_mangroves INTEGER,
  num_seagrasses INTEGER,
  num_tidal_marshes INTEGER,
  planting_regime TEXT,
  density TEXT,
  monitoring_plan TEXT NOT NULL,
  sample_protocol TEXT,
  baseline_carbon NUMERIC,
  calculation_params JSONB,
  partners TEXT,
  roles_json JSONB,
  verifier_contact TEXT,
  funding_source TEXT,
  benefit_sharing TEXT,
  tags TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  regulatory_required TEXT,        -- yes/no/unsure
  license_number TEXT,
  soil_bulk_density NUMERIC,
  soil_organic_carbon_percent NUMERIC,
  water_salinity_psu NUMERIC,
  water_ph NUMERIC,
  consent BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Species rows per org project
CREATE TABLE IF NOT EXISTS org_species (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects_org(id) ON DELETE CASCADE,
  species_name TEXT NOT NULL,
  count_planted INTEGER,
  planting_density TEXT,
  expected_survival_percent NUMERIC,
  age_class TEXT
);

-- Evidence/file references (store files in object storage; keep names/URLs here)
CREATE TABLE IF NOT EXISTS org_files (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects_org(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,  -- photo, satellite, lab, research, permit, funding, boundary
  file_name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Local projects
CREATE TABLE IF NOT EXISTS projects_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_title TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,  -- 10 digits
  owner_email TEXT NOT NULL,
  ecosystems JSONB NOT NULL,  -- multi-select
  plant_types JSONB NOT NULL, -- {mangroves:true,...}
  num_mangroves INTEGER,
  num_seagrasses INTEGER,
  num_tidal_marshes INTEGER,
  short_description TEXT,
  country TEXT NOT NULL,
  place_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  gps_accuracy NUMERIC,
  area_ha NUMERIC(12,2) NOT NULL,
  approx_plants INTEGER,
  start_date DATE,
  has_permit BOOLEAN DEFAULT FALSE,
  intends_carbon_credits BOOLEAN DEFAULT FALSE,
  consent BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS local_files (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects_local(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,  -- photo, onset, supporting, permit
  file_name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
Minimal Node/pg insertion example (for later backend)
// server.js (example; not used by CRA directly)
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@host:5432/db
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
});

app.post('/api/projects/local', async (req, res) => {
  const c = await pool.connect();
  try {
    const {
      projectTitle, ownerName, ownerPhone, ownerEmail,
      ecosystems, plantTypes, numMangroves, numSeagrasses, numTidalMarshes,
      shortDescription, country, placeName, lat, lng, gpsAccuracy,
      areaHa, approxPlants, startDate, hasPermit, intendsCarbonCredits, consent,
      photos = [], supportingDocs = [], permitDocName
    } = req.body;

    const { rows } = await c.query(
      `INSERT INTO projects_local
       (project_title, owner_name, owner_phone, owner_email, ecosystems, plant_types,
        num_mangroves, num_seagrasses, num_tidal_marshes, short_description, country,
        place_name, lat, lng, gps_accuracy, area_ha, approx_plants, start_date,
        has_permit, intends_carbon_credits, consent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING id`,
      [
        projectTitle, ownerName, ownerPhone, ownerEmail,
        JSON.stringify(ecosystems), JSON.stringify(plantTypes),
        numMangroves || null, numSeagrasses || null, numTidalMarshes || null,
        shortDescription || null, country, placeName, lat, lng, gpsAccuracy || null,
        areaHa, approxPlants || null, startDate || null, !!hasPermit, !!intendsCarbonCredits, !!consent
      ]
    );
    const projectId = rows[0].id;

    const insertFile = async (fileType, name) => {
      if (!name) return;
      await c.query(
        `INSERT INTO local_files (project_id, file_type, file_name) VALUES ($1,$2,$3)`,
        [projectId, fileType, name]
      );
    };
    for (const p of photos) await insertFile('photo', p);
    for (const s of supportingDocs) await insertFile('supporting', s);
    if (permitDocName) await insertFile('permit', permitDocName);

    res.json({ success: true, id: projectId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'insert_failed' });
  } finally {
    c.release();
  }
});

app.listen(8080, () => console.log('API on http://localhost:8080'));
Summary:

Added wizard mode with progress, per-section animations (fade, slide, scale), light/dark theme, animated upload buttons, multi-ecosystem selection for both Local and Organization, strict 10-digit numeric phones, conditional per-plant counts when >2 types, universal image limits (20KB–10MB), and kept autosave and map/GPS.
Included PostgreSQL schemas and a minimal Node/pg example for future persistence.
The form remains linked back to HomePage.js via the Back to Home button and submit redirect to /.
Forget it, make it like before, in single form.
Forget that next next next...
Make it like before everything.

Just improve the design and structure with separate and that contract, and multiple ecosystem.
And also add a option to draw digital signature or send capture signature images with live capture.

Just give like like before.
Give me that earlier one, just i want it Better in design and with no error. And rewrite entire. 
Nothing else should change.
Thought for 62s
Status: Rewrote a single-page Local + Organization form (no steps), improved design and animations, multi-ecosystem selection, plant-type logic, strict 10-digit phones, autosave, GPS+map picker, hold-to-show tooltips, animated upload buttons, and added digital signature (draw on canvas or upload/capture). No backend calls.

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

// IMPORTANT: In src/index.jsx add:
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

const ECOSYSTEM_KEYS = [
  { key: "mangrove", label: "Mangrove" },
  { key: "seagrass", label: "Seagrass" },
  { key: "saltMarsh", label: "Salt marsh" },
  { key: "mudflat", label: "Coastal mudflat" },
  { key: "sediment", label: "Coastal sediment" },
  { key: "other", label: "Other" },
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MIN_IMAGE_KB = 20;
const MAX_IMAGE_MB = 10;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;

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

// Signature Pad
const SignaturePad = ({ onSave, initialDataUrl }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Initialize canvas with white background
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // If provided initial signature, render it
    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  const startDraw = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };
  const endDraw = () => setIsDrawing(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (onSave) onSave("");
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    if (onSave) onSave(dataUrl);
  };

  return (
    <div>
      <div className="signature-box">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="d-flex gap-2 mt-2">
        <Button variant="outline-danger" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button variant="success" size="sm" onClick={handleSave}>
          Save Signature
        </Button>
      </div>
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

const SectionTitle = ({ children, className = "" }) => (
  <div className={`d-flex align-items-center mb-2 ${className}`}>
    <h5 className="mb-0 me-2">{children}</h5>
    <div className="flex-grow-1 hr-fade" />
  </div>
);

const FileHints = ({ text }) => (
  <div className="text-muted small fst-italic mt-1">{text}</div>
);

const sanitizePhone10 = (raw) => {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 10);
  return digits;
};

const RegisterForm = () => {
  const [projectType, setProjectType] = useState("Local");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null

  // Local form
  const [localData, setLocalData] = useState({
    projectTitle: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    // Ecosystem multi-select
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
    // Plant categories multi-select
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
    numMangroves: "",
    numSeagrasses: "",
    numTidalMarshes: "",
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
    // Signature
    signatureDataUrl: "",
    signatureImage: null,
    consent: false,
    intendsCarbonCredits: false,
  });
  const [localErrors, setLocalErrors] = useState({});

  // Organization form
  const [orgData, setOrgData] = useState({
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
    // Ecosystem multi-select
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
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
    // Plant categories multi-select
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
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
    // Signature
    signatureDataUrl: "",
    signatureImage: null,
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
  });
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
      } else if (name === "ownerPhone" || name === "orgContactPhone") {
        copy[name] = sanitizePhone10(value);
      } else {
        copy[name] = value;
      }
      return copy;
    });
  };

  // Toggle ecosystems
  const toggleEcosystem = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      ecosystems: { ...prev.ecosystems, [key]: !prev.ecosystems[key] },
    }));
  };

  // Toggle plant categories
  const togglePlantType = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  };

  const selectedPlantTypeCountLocal = useMemo(() => {
    const p = localData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [localData.plantTypes]);

  const selectedPlantTypeCountOrg = useMemo(() => {
    const p = orgData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [orgData.plantTypes]);

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
  const atLeastOneTrue = (obj) => Object.values(obj || {}).some(Boolean);

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

  // Validations
  const validateImages = (files, errsKey) => {
    if (!Array.isArray(files) || files.length < 1)
      return `${errsKey}: upload required.`;
    for (const f of files) {
      const kb = f.size / 1024;
      if (kb < MIN_IMAGE_KB) return "Image is too small (min 20KB).";
      if (f.size > MAX_IMAGE_MB * 1024 * 1024)
        return `Each image must be <= ${MAX_IMAGE_MB} MB.`;
      if (!["image/jpeg", "image/png"].includes(f.type))
        return "Images must be JPG or PNG.";
    }
    return null;
  };

  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!d.ownerPhone || d.ownerPhone.length !== 10)
      errs.ownerPhone = `Enter exactly 10 digits (based on country).`;
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";
    if (!atLeastOneTrue(d.ecosystems))
      errs.ecosystems = "Select at least one ecosystem.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, 20KB–10MB each).";
    } else {
      const msg = validateImages(d.photos, "Photos");
      if (msg) errs.photos = msg;
    }

    if (selectedPlantTypeCountLocal > 2) {
      if (d.plantTypes.mangroves && !positive(d.numMangroves))
        errs.numMangroves = "Enter number of Mangrove plants (> 0).";
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses))
        errs.numSeagrasses = "Enter number of Seagrass plants (> 0).";
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes))
        errs.numTidalMarshes = "Enter number of Tidal Marsh plants (> 0).";
    }

    if (!d.consent) errs.consent = "You must confirm to submit this form.";
    return errs;
  };

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
    if (d.orgContactPhone && d.orgContactPhone.length > 0 && d.orgContactPhone.length !== 10)
      errs.orgContactPhone = "Phone must be exactly 10 digits if provided.";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate) errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!atLeastOneTrue(d.ecosystems))
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

    const ptCount =
      (d.plantTypes?.mangroves ? 1 : 0) +
      (d.plantTypes?.seagrasses ? 1 : 0) +
      (d.plantTypes?.tidalMarshes ? 1 : 0);

    if (ptCount === 0) {
      errs.plantTypes =
        "Select at least one plant type (Mangroves/Seagrasses/Tidal Marshes).";
    }
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

    // Evidence rule: 5+ photos OR (>=1 satellite AND >=3 photos), images 20KB–10MB
    const numPhotos = Array.isArray(d.photos) ? d.photos.length : 0;
    const numSat = Array.isArray(d.satelliteImages) ? d.satelliteImages.length : 0;
    const photosOk = numPhotos >= 5 || (numSat >= 1 && numPhotos >= 3);
    if (!photosOk) {
      errs.photos = "Minimum evidence: 5+ photos OR 1 satellite image + 3 photos.";
    } else {
      if (Array.isArray(d.photos) && d.photos.length) {
        const msg = validateImages(d.photos, "Photos");
        if (msg) errs.photos = msg;
      }
      if (Array.isArray(d.satelliteImages) && d.satelliteImages.length) {
        for (const f of d.satelliteImages) {
          const kb = f.size / 1024;
          if (kb < MIN_IMAGE_KB) {
            errs.satelliteImages = "Satellite image is too small (min 20KB).";
            break;
          }
          if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
            errs.satelliteImages = `Satellite image must be <= ${MAX_IMAGE_MB} MB.`;
            break;
          }
          const name = (f.name || "").toLowerCase();
          const typeOk = ["image/tiff", "image/tif", "image/jpeg", "image/jpg", "image/png"].includes(
            f.type
          );
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
      errs.soilOrganicCarbonPercent = "SOC% should be between 0 and 60.";
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
    } catch {}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorSummary("");
    setSubmitting(true);

    if (projectType === "Local") {
      const errs = validateLocal();
      setLocalErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    } else {
      const errs = validateOrg();
      setOrgErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    }

    // Success (no backend)
    setTimeout(() => {
      setShowSuccess(true);
      clearDraft();
      setTimeout(() => {
        setShowSuccess(false);
        window.location.href = "/";
      }, 1600);
    }, 350);
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

  return (
    <div className="container py-4">
      <style>{`
        .bg-gradient-1 { background: linear-gradient(135deg, #4f46e5, #0ea5e9); }
        .card-neo {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.16);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,0.24); }
        .animate-in { animation: fadeUp .6s ease both; }
        .anim-fade { animation: fadeUp .6s ease both; }
        .anim-slide { animation: slideIn .6s ease both; }
        .anim-scale { animation: scaleIn .5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .section {
          padding: 16px; border-radius: 12px; border: 1px dashed rgba(99,102,241,0.35);
          background: linear-gradient(0deg, rgba(99,102,241,0.08), rgba(14,165,233,0.06));
          margin-bottom: 16px;
        }
        .hr-fade { height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0.2), rgba(0,0,0,0)); }
        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .success-card {
          background: #ffffff; padding: 24px 28px; border-radius: 16px; text-align: center;
          animation: popIn .35s ease both; color: #0f172a;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .checkmark {
          width: 64px; height: 64px; border-radius: 50%; background: #22c55e;
          display: inline-flex; align-items: center; justify-content: center; color: white;
          font-size: 38px; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.4); animation: pulse 0.9s ease 1;
        }
        @keyframes pulse { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .hold-tip-wrapper { position: relative; display: inline-block; }
        .hold-tip-trigger { color: #0ea5e9; margin-left: 6px; cursor: pointer; user-select: none; }
        .hold-tip-bubble {
          position: absolute; top: -8px; left: 20px; min-width: 220px; max-width: 320px;
          background: #0ea5e9; color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35); animation: tipFade .2s ease both; z-index: 10;
        }
        @keyframes tipFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
        .red-note { color: #ef4444; font-size: 0.875rem; margin-top: 4px; }
        .upload-animated::file-selector-button {
          margin-right: 12px;
          border: none;
          background: linear-gradient(135deg, #0ea5e9, #4f46e5);
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .25s ease;
          box-shadow: 0 6px 16px rgba(79,70,229,0.3);
        }
        .upload-animated::file-selector-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 10px 22px rgba(79,70,229,0.4);
        }
        .upload-animated::file-selector-button:active {
          transform: translateY(0) scale(0.99);
        }
        .signature-box {
          background: #fff;
          border: 1px dashed #94a3b8;
          border-radius: 12px;
          padding: 8px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .signature-box canvas {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
        }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <h4 className="mb-0">Register Project</h4>
              <Badge bg="light" text="dark">
                {projectType}
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{ maxWidth: 320 }}
                aria-label="Project Type"
              >
                <option value="Local">Local (short form)</option>
                <option value="Organization">Organization (full, production-grade)</option>
                <option value="Collaboration" disabled>Collaboration (coming soon)</option>
              </Form.Select>
              <Button
                type="button"
                variant="outline-light"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
              {nowSaved && (
                <span className="small">
                  Autosaved <Badge bg="light" text="dark">{nowSaved}</Badge>
                </span>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            {errorSummary && (
              <Alert variant="danger" className="anim-fade">{errorSummary}</Alert>
            )}

            {/* LOCAL FORM */}
            {projectType === "Local" && (
              <>
                <div className="section anim-fade">
                  <p className="mb-2">
                    <strong>Use this Local Project form</strong> for small teams or individuals
                    restoring coastal ecosystems. Provide accurate location and at least two photos.
                    Drafts save automatically.
                  </p>
                  <div className="text-muted small">
                    Creates a verifiable record; not for immediate carbon credit minting.
                  </div>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Project Details</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Project Title *
                      <HoldTip text='Short descriptive name. Example: "Ramnagar Mangrove Restoration — 2025". 5–200 chars.' />
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

                  <div className="mb-2">
                    <div className="mb-1">
                      Ecosystem(s) *
                      <HoldTip text="Select all ecosystems present at the site." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                      {ECOSYSTEM_KEYS.map((ek) => (
                        <Form.Check
                          key={ek.key}
                          type="checkbox"
                          label={ek.label}
                          checked={!!localData.ecosystems[ek.key]}
                          onChange={() => toggleEcosystem(ek.key, false)}
                        />
                      ))}
                    </div>
                    {localErrors.ecosystems && (
                      <div className="red-note">{localErrors.ecosystems}</div>
                    )}
                  </div>

                  <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Owner Details</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Owner / Primary Contact Name *
                          <HoldTip text="Individual or group lead. 3–120 characters." />
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Contact Phone (10 digits) *
                          <HoldTip text="Exactly 10 digits (based on selected country)." />
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="ownerPhone"
                          inputMode="numeric"
                          pattern="\\d{10}"
                          value={localData.ownerPhone}
                          onChange={handleChange}
                          isInvalid={!!localErrors.ownerPhone}
                          data-err="ownerPhone"
                          placeholder="XXXXXXXXXX"
                        />
                        {localErrors.ownerPhone && (
                          <div className="red-note">{localErrors.ownerPhone}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Location</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Place Name *
                          <HoldTip text="Village or coastal landmark near the site. 3–200 chars." />
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
                        <Button variant="outline-primary" onClick={useDeviceGPSLocal}>
                          Use GPS
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setShowMapFor("local")}>
                          Pick on Map
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Latitude *
                          <HoldTip text="GPS latitude. Range -90 to 90." />
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Longitude *
                          <HoldTip text="GPS longitude. Range -180 to 180." />
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          GPS Accuracy (m) (optional)
                          <HoldTip text="If your device reports accuracy, include it." />
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
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Area & Dates</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Area (hectares) *
                          <HoldTip text="Estimate of area. Decimal precision e.g., 2.50 ha." />
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Plant Types (if applicable)</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">
                      Select Plant Types (multi-select)
                      <HoldTip text="Choose plant categories. If you select more than two, you must provide counts for each." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="plantTypesLocal">
                      <Form.Check
                        type="checkbox"
                        label="Mangroves"
                        checked={localData.plantTypes.mangroves}
                        onChange={() => togglePlantType("mangroves", false)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Seagrasses"
                        checked={localData.plantTypes.seagrasses}
                        onChange={() => togglePlantType("seagrasses", false)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Tidal Marshes"
                        checked={localData.plantTypes.tidalMarshes}
                        onChange={() => togglePlantType("tidalMarshes", false)}
                      />
                    </div>
                  </div>

                  {selectedPlantTypeCountLocal > 2 && (
                    <Row className="mb-2">
                      {localData.plantTypes.mangroves && (
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                            <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                            <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                  )}
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Evidence</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Photos (at least 2) *
                      <HoldTip text="Upload JPG/PNG (20KB–10MB each). Include a wide shot and a close-up; GPS-tag helps." />
                    </Form.Label>
                    <Form.Control
                      type="file"
                      name="photos"
                      className="upload-animated"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleChange}
                      isInvalid={!!localErrors.photos}
                      data-err="photos"
                    />
                    {localErrors.photos && (
                      <div className="red-note">{localErrors.photos}</div>
                    )}
                    <FileHints text="Recommended: 3–10 photos." />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Onset Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="onsetImage"
                          className="upload-animated"
                          accept="image/*,application/pdf"
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Supporting Documents (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="supportingDocs"
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          onChange={handleChange}
                        />
                        <FileHints text="Max 20MB each." />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Signature</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <div className="mb-2 text-muted small">
                        Draw your digital signature or upload a signature image (camera capture supported).
                      </div>
                      <SignaturePad
                        initialDataUrl={localData.signatureDataUrl}
                        onSave={(dataUrl) => setLocalField("signatureDataUrl", dataUrl)}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Signature Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="signatureImage"
                          className="upload-animated"
                          accept="image/*"
                          capture="environment"
                          onChange={handleChange}
                        />
                        <FileHints text="JPG/PNG, keep under 10MB." />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Permissions & Consent</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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
                              className="upload-animated"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={handleChange}
                            />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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

                  <Form.Group className="mb-3">
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
                </div>
              </>
            )}

            {/* ORGANIZATION FORM */}
            {projectType === "Organization" && (
              <>
                <div className="section anim-fade">
                  <p className="mb-2">
                    <strong>Use Organization Project Registration</strong> for NGO, company,
                    government or community projects seeking verification and carbon credit issuance.
                  </p>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Administrative & Identification</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Project Title *</Form.Label>
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Organization Type *</Form.Label>
                        <Form.Select
                          name="organizationType"
                          value={orgData.organizationType}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.organizationType}
                          data-err="organizationType"
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Phone (10 digits, optional)</Form.Label>
                        <Form.Control
                          type="tel"
                          name="orgContactPhone"
                          inputMode="numeric"
                          pattern="\\d{10}"
                          value={orgData.orgContactPhone}
                          onChange={(e) => {
                            e.target.value = sanitizePhone10(e.target.value);
                            handleChange(e, true);
                          }}
                          isInvalid={!!orgErrors.orgContactPhone}
                          data-err="orgContactPhone"
                          placeholder="XXXXXXXXXX"
                        />
                        {orgErrors.orgContactPhone && (
                          <div className="red-note">{orgErrors.orgContactPhone}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Project Time & Status</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Location & Spatial Data</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country *</Form.Label>
                        <Form.Select
                          name="country"
                          value={orgData.country}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.country}
                          data-err="country"
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                        <Button variant="outline-primary" onClick={useDeviceGPSOrg}>
                          Use GPS
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setShowMapFor("org")}>
                          Pick on Map
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Boundary File (GeoJSON/KML/ZIP)
                          <HoldTip text="Upload GeoJSON, KML, or zipped shapefile (<=20MB). If not available provide centroid + area." />
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="geoBoundaryFile"
                          className="upload-animated"
                          accept=".geojson,.json,.kml,.zip"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.geoBoundaryFile}
                          data-err="geoBoundaryFile"
                        />
                        {orgErrors.geoBoundaryFile && (
                          <div className="red-note">{orgErrors.geoBoundaryFile}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Technical & MRV</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">Ecosystem(s) *</div>
                    <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                      {ECOSYSTEM_KEYS.map((ek) => (
                        <Form.Check
                          key={ek.key}
                          type="checkbox"
                          label={ek.label}
                          checked={!!orgData.ecosystems[ek.key]}
                          onChange={() => toggleEcosystem(ek.key, true)}
                        />
                      ))}
                    </div>
                    {orgErrors.ecosystems && (
                      <div className="red-note">{orgErrors.ecosystems}</div>
                    )}
                  </div>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Habitat Sub-type (optional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="habitatType"
                          value={orgData.habitatType}
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Methodology / Standard *</Form.Label>
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
                    </Col>
                  </Row>

                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Plant Types & Species</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">
                      Plant Types (multi-select)
                      <HoldTip text="Choose plant categories. If you select more than two, you must provide counts for each and upload a research report." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="plantTypes">
                      <Form.Check
                        type="checkbox"
                        label="Mangroves"
                        checked={orgData.plantTypes.mangroves}
                        onChange={() => togglePlantType("mangroves", true)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Seagrasses"
                        checked={orgData.plantTypes.seagrasses}
                        onChange={() => togglePlantType("seagrasses", true)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Tidal Marshes"
                        checked={orgData.plantTypes.tidalMarshes}
                        onChange={() => togglePlantType("tidalMarshes", true)}
                      />
                    </div>
                    {orgErrors.plantTypes && (
                      <div className="red-note">{orgErrors.plantTypes}</div>
                    )}
                  </div>

                  {selectedPlantTypeCountOrg > 2 && (
                    <Row className="mb-2">
                      {orgData.plantTypes.mangroves && (
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                            <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                            <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                  )}

                  <div className="mb-2">
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Monitoring & MRV Metrics</SectionTitle>
                  <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Soil Bulk Density (g/cm³) (opt)</Form.Label>
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Evidence Files</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>High-resolution Photos *</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/jpeg,image/png"
                      name="photos"
                      className="upload-animated"
                      onChange={(e) => handleChange(e, true)}
                      isInvalid={!!orgErrors.photos}
                      data-err="photos"
                    />
                    {orgErrors.photos && <div className="red-note">{orgErrors.photos}</div>}
                    <FileHints text={`JPG/PNG, 20KB–${MAX_IMAGE_MB}MB each. Provide onset + monitoring images.`} />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Satellite Imagery (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".tif,.tiff,.jpg,.jpeg,.png"
                          name="satelliteImages"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.satelliteImages}
                          data-err="satelliteImages"
                        />
                        {orgErrors.satelliteImages && (
                          <div className="red-note">{orgErrors.satelliteImages}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lab Reports (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="labReports"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Research Documents {selectedPlantTypeCountOrg > 2 ? "(required)" : "(optional)"}
                        </Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="researchDocs"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.researchDocs}
                          data-err="researchDocs"
                        />
                        {orgErrors.researchDocs && (
                          <div className="red-note">{orgErrors.researchDocs}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Funding / Agreements (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="fundingDocs"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Permits & Legal Docs</SectionTitle>
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
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseDoc}
                          data-err="licenseDoc"
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
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.permitDocs}
                          data-err="permitDocs"
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
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Community Consent Doc (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="communityConsentDoc"
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Signature</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <div className="mb-2 text-muted small">
                        Draw an authorized digital signature or upload a signature image (camera capture supported).
                      </div>
                      <SignaturePad
                        initialDataUrl={orgData.signatureDataUrl}
                        onSave={(dataUrl) => setOrgField("signatureDataUrl", dataUrl)}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Signature Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="signatureImage"
                          className="upload-animated"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleChange(e, true)}
                        />
                        <FileHints text="JPG/PNG, keep under 10MB." />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Additional & Consent</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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

                  <Form.Group className="mb-3">
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
                </div>
              </>
            )}

            <div className="d-flex flex-wrap gap-2 mt-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Project"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => (window.location.href = "/")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline-success"
                onClick={() => {
                  try {
                    localStorage.setItem("registerForm.type", projectType);
                    localStorage.setItem("registerForm.local", JSON.stringify(localData));
                    localStorage.setItem("registerForm.org", JSON.stringify(orgData));
                    setAutosaveStamp(new Date().toISOString());
                  } catch {}
                }}
              >
                Save Draft
              </Button>
              <Button type="button" variant="outline-danger" onClick={clearDraft}>
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
        initialLng(
          ){
          return null
        }
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
Install

npm install react-bootstrap bootstrap
In src/index.jsx: import 'bootstrap/dist/css/bootstrap.min.css'
Summary:

Single-page Local + Organization form with improved design, animations, multi-ecosystem, strict 10-digit phones, GPS/map picker, hold-to-show tooltips, autosave, animated uploads, digital signature (draw or upload), conditional plant counts and org evidence rules.
Any error in above code ?
Will this work with postgersql?
Answer
Thought for 52s
Yes, there’s a blocking error: the Local map modal JSX is malformed and missing onApply. Replace that entire block with this:
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
Will it work with PostgreSQL? Not by itself. This is frontend-only and does not call any API. You’ll need a backend (e.g., Node + pg) that exposes endpoints to insert into Postgres (using the schemas provided earlier), then POST the form data to those endpoints. Without that backend, nothing is saved to the database.
Make a final code for this registation form with absolutely no error.

And connect it with database of PostgreSQL and also back-end logic too 
We already have server.js files, and has some code. So give that code in same or different file but it shouldn't alter the Remaining code. And we also have db file if you need.

Give both database schema and backend logic, with improved registation form which is linked to "HomePage.js".

In next response, I will give you the homepage code and tell you to make some modifications in that too, like taking this registration form which is submitted and displaying it all properly in our home page dashboard, in card structure. And when read more. It should fetch the same as well.


And also use sha256 algorithm in registration form, so it can be used to save hash of this data and save in Blockchain. Make that system. But make it comments all, so it shouldn't work. It will be used for later. But this registration form should be secure. And our plan is for Blockchain based blue carbon registry and MRV system. So registration is this form which is supposed to be saved in Blockchain only after admin verification. 

So till then, it is saved in PostgreSQL.
So you understand the working concept. So make it all according to that.
And btw, this all should run now, as frontend.
And save in database.

While the non-working code should be comment. Which will be used later when we make back-end.
So yeah...
All data should be fetchable.

Comment all code explaining the working for understanding.
And give the final registration, schema and backend connections. Now.
We will discuss the homepage in next response.
Thought for 80s
Status: I’m delivering a single-page registration form (no steps) with improved design/animations, multi-ecosystem selection, strict 10-digit phones, GPS/map picker, hold-to-show tooltips, autosave, animated uploads, digital signature (draw or upload), conditional plant counts, and working submit to a PostgreSQL backend. I’ve included database schema (SQL) and minimal backend routes that won’t break your existing server (just add one router use). SHA-256 code is included but commented out for later blockchain anchoring.

1) Frontend: src/RegisterForm.js
Single file, no errors
Posts multipart form-data to /api/projects
Digital signature as canvas (saved as file) or uploaded image
SHA-256 prep commented out for later
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

// IMPORTANT: In src/index.jsx add:
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

const ECOSYSTEM_KEYS = [
  { key: "mangrove", label: "Mangrove" },
  { key: "seagrass", label: "Seagrass" },
  { key: "saltMarsh", label: "Salt marsh" },
  { key: "mudflat", label: "Coastal mudflat" },
  { key: "sediment", label: "Coastal sediment" },
  { key: "other", label: "Other" },
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MIN_IMAGE_KB = 20;
const MAX_IMAGE_MB = 10;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;

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

// SignaturePad: draw-to-canvas signature
const SignaturePad = ({ onSave, initialDataUrl }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  const startDraw = (e) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };
  const endDraw = () => setIsDrawing(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSave && onSave("");
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave && onSave(dataUrl);
  };

  return (
    <div>
      <div className="signature-box">
        <canvas
          ref={canvasRef}
          width={700}
          height={220}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="d-flex gap-2 mt-2">
        <Button variant="outline-danger" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button variant="success" size="sm" onClick={handleSave}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};

// Leaflet map modal (CDN)
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

const SectionTitle = ({ children, className = "" }) => (
  <div className={`d-flex align-items-center mb-2 ${className}`}>
    <h5 className="mb-0 me-2">{children}</h5>
    <div className="flex-grow-1 hr-fade" />
  </div>
);

const FileHints = ({ text }) => (
  <div className="text-muted small fst-italic mt-1">{text}</div>
);

const sanitizePhone10 = (raw) => (raw || "").replace(/\D/g, "").slice(0, 10);

const RegisterForm = () => {
  const [projectType, setProjectType] = useState("Local");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null

  const [localData, setLocalData] = useState({
    projectTitle: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
    numMangroves: "",
    numSeagrasses: "",
    numTidalMarshes: "",
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
    signatureDataUrl: "",
    signatureImage: null,
    consent: false,
    intendsCarbonCredits: false,
  });
  const [localErrors, setLocalErrors] = useState({});

  const [orgData, setOrgData] = useState({
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
    ecosystems: {
      mangrove: true,
      seagrass: false,
      saltMarsh: false,
      mudflat: false,
      sediment: false,
      other: false,
    },
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
    plantTypes: { mangroves: true, seagrasses: false, tidalMarshes: false },
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
    signatureDataUrl: "",
    signatureImage: null,
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
  });
  const [orgErrors, setOrgErrors] = useState({});

  useEffect(() => {
    try {
      const t = localStorage.getItem("registerForm.type");
      if (t) setProjectType(t);
      const l = localStorage.getItem("registerForm.local");
      if (l) setLocalData(JSON.parse(l));
      const o = localStorage.getItem("registerForm.org");
      if (o) setOrgData(JSON.parse(o));
    } catch {}
  }, []);

  const stamp = () => setAutosaveStamp(new Date().toISOString());

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

  const handleChange = (e, isOrg = false) => {
    const { name, type, checked, value, files, multiple } = e.target;
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => {
      const copy = { ...prev };
      if (type === "checkbox") {
        copy[name] = checked;
      } else if (type === "file") {
        copy[name] = multiple ? (files ? Array.from(files) : []) : files?.[0] || null;
      } else if (name === "ownerPhone" || name === "orgContactPhone") {
        copy[name] = sanitizePhone10(value);
      } else {
        copy[name] = value;
      }
      return copy;
    });
  };

  const toggleEcosystem = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      ecosystems: { ...prev.ecosystems, [key]: !prev.ecosystems[key] },
    }));
  };

  const togglePlantType = (key, isOrg = false) => {
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  };

  const selectedPlantTypeCountLocal = useMemo(() => {
    const p = localData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [localData.plantTypes]);

  const selectedPlantTypeCountOrg = useMemo(() => {
    const p = orgData.plantTypes || {};
    return (p.mangroves ? 1 : 0) + (p.seagrasses ? 1 : 0) + (p.tidalMarshes ? 1 : 0);
  }, [orgData.plantTypes]);

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
  const atLeastOneTrue = (obj) => Object.values(obj || {}).some(Boolean);

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

  const validateImages = (files, errsKey) => {
    if (!Array.isArray(files) || files.length < 1)
      return `${errsKey}: upload required.`;
    for (const f of files) {
      const kb = f.size / 1024;
      if (kb < MIN_IMAGE_KB) return "Image is too small (min 20KB).";
      if (f.size > MAX_IMAGE_MB * 1024 * 1024)
        return `Each image must be <= ${MAX_IMAGE_MB} MB.`;
      if (!["image/jpeg", "image/png"].includes(f.type))
        return "Images must be JPG or PNG.";
    }
    return null;
  };

  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!d.ownerPhone || d.ownerPhone.length !== 10)
      errs.ownerPhone = `Enter exactly 10 digits (based on country).`;
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";
    if (!atLeastOneTrue(d.ecosystems))
      errs.ecosystems = "Select at least one ecosystem.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, 20KB–10MB each).";
    } else {
      const msg = validateImages(d.photos, "Photos");
      if (msg) errs.photos = msg;
    }

    if (selectedPlantTypeCountLocal > 2) {
      if (d.plantTypes.mangroves && !positive(d.numMangroves))
        errs.numMangroves = "Enter number of Mangrove plants (> 0).";
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses))
        errs.numSeagrasses = "Enter number of Seagrass plants (> 0).";
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes))
        errs.numTidalMarshes = "Enter number of Tidal Marsh plants (> 0).";
    }

    if (!d.consent) errs.consent = "You must confirm to submit this form.";
    return errs;
  };

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
    if (d.orgContactPhone && d.orgContactPhone.length > 0 && d.orgContactPhone.length !== 10)
      errs.orgContactPhone = "Phone must be exactly 10 digits if provided.";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate) errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!atLeastOneTrue(d.ecosystems))
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

    const ptCount =
      (d.plantTypes?.mangroves ? 1 : 0) +
      (d.plantTypes?.seagrasses ? 1 : 0) +
      (d.plantTypes?.tidalMarshes ? 1 : 0);

    if (ptCount === 0) {
      errs.plantTypes =
        "Select at least one plant type (Mangroves/Seagrasses/Tidal Marshes).";
    }
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

    const numPhotos = Array.isArray(d.photos) ? d.photos.length : 0;
    const numSat = Array.isArray(d.satelliteImages) ? d.satelliteImages.length : 0;
    const photosOk = numPhotos >= 5 || (numSat >= 1 && numPhotos >= 3);
    if (!photosOk) {
      errs.photos = "Minimum evidence: 5+ photos OR 1 satellite image + 3 photos.";
    } else {
      if (Array.isArray(d.photos) && d.photos.length) {
        const msg = validateImages(d.photos, "Photos");
        if (msg) errs.photos = msg;
      }
      if (Array.isArray(d.satelliteImages) && d.satelliteImages.length) {
        for (const f of d.satelliteImages) {
          const kb = f.size / 1024;
          if (kb < MIN_IMAGE_KB) {
            errs.satelliteImages = "Satellite image is too small (min 20KB).";
            break;
          }
          if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
            errs.satelliteImages = `Satellite image must be <= ${MAX_IMAGE_MB} MB.`;
            break;
          }
          const name = (f.name || "").toLowerCase();
          const typeOk = ["image/tiff", "image/tif", "image/jpeg", "image/jpg", "image/png"].includes(
            f.type
          );
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
      errs.soilOrganicCarbonPercent = "SOC% should be between 0 and 60.";
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
    } catch {}
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

  const dataUrlToFile = async (dataUrl, filename = "signature.png") => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: "image/png" });
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

        // Optional: pre-hash JSON core for future blockchain anchoring (commented out)
        /*
        const core = {
          type: "local",
          projectTitle: d.projectTitle,
          ownerName: d.ownerName,
          ownerPhone: d.ownerPhone,
          ownerEmail: d.ownerEmail,
          ecosystems: d.ecosystems,
          plantTypes: d.plantTypes,
          placeName: d.placeName,
          country: d.country,
          lat: Number(d.lat),
          lng: Number(d.lng),
          areaHa: Number(d.areaHa),
          approxPlants: d.approxPlants ? Number(d.approxPlants) : null,
          startDate: d.startDate || null
        };
        // const encoder = new TextEncoder();
        // const bytes = encoder.encode(JSON.stringify(core));
        // const hashBuf = await window.crypto.subtle.digest("SHA-256", bytes);
        // const hashArr = Array.from(new Uint8Array(hashBuf));
        // const clientSha256 = hashArr.map(b => b.toString(16).padStart(2,"0")).join("");
        // payload.append("clientSha256", clientSha256);
        */

        // Append primitives
        payload.append("type", "local");
        payload.append("projectTitle", d.projectTitle);
        payload.append("ownerName", d.ownerName);
        payload.append("ownerPhone", d.ownerPhone);
        payload.append("ownerEmail", d.ownerEmail);
        payload.append("country", d.country);
        payload.append("placeName", d.placeName);
        payload.append("lat", String(d.lat));
        payload.append("lng", String(d.lng));
        if (d.gpsAccuracy) payload.append("gpsAccuracy", String(d.gpsAccuracy));
        payload.append("areaHa", String(d.areaHa));
        if (d.approxPlants) payload.append("approxPlants", String(d.approxPlants));
        if (d.startDate) payload.append("startDate", d.startDate);
        if (d.shortDescription) payload.append("shortDescription", d.shortDescription);
        payload.append("ecosystems", JSON.stringify(d.ecosystems));
        payload.append("plantTypes", JSON.stringify(d.plantTypes));
        payload.append("hasPermit", String(!!d.hasPermit));
        payload.append("consent", String(!!d.consent));
        payload.append("intendsCarbonCredits", String(!!d.intendsCarbonCredits));

        // Files (arrays)
        if (Array.isArray(d.photos)) d.photos.forEach((f) => payload.append("photos", f));
        if (Array.isArray(d.supportingDocs))
          d.supportingDocs.forEach((f) => payload.append("supportingDocs", f));

        // Files (single)
        if (d.onsetImage) payload.append("onsetImage", d.onsetImage);
        if (d.permitDoc) payload.append("permitDoc", d.permitDoc);
        if (d.signatureImage) payload.append("signatureImage", d.signatureImage);
        if (d.signatureDataUrl) {
          const file = await dataUrlToFile(d.signatureDataUrl, "signature_drawn.png");
          payload.append("signatureDrawn", file);
        }
      } else {
        const d = orgData;

        // Optional: pre-hash JSON core (commented out)
        /*
        const core = {
          type: "org",
          projectTitle: d.projectTitle,
          organizationName: d.organizationName,
          orgContactName: d.orgContactName,
          orgContactEmail: d.orgContactEmail,
          startDate: d.startDate,
          placeName: d.placeName,
          country: d.country,
          lat: Number(d.lat),
          lng: Number(d.lng),
          areaHa: Number(d.areaHa),
          ecosystems: d.ecosystems,
          methodology: d.methodology,
          monitoringPlan: d.monitoringPlan
        };
        // const encoder = new TextEncoder();
        // const bytes = encoder.encode(JSON.stringify(core));
        // const hashBuf = await window.crypto.subtle.digest("SHA-256", bytes);
        // const hashArr = Array.from(new Uint8Array(hashBuf));
        // const clientSha256 = hashArr.map(b => b.toString(16).padStart(2,"0")).join("");
        // payload.append("clientSha256", clientSha256);
        */

        payload.append("type", "org");
        payload.append("projectTitle", d.projectTitle);
        if (d.projectExternalId) payload.append("projectExternalId", d.projectExternalId);
        payload.append("organizationType", d.organizationType);
        payload.append("organizationName", d.organizationName);
        if (d.orgRegistrationNumber)
          payload.append("orgRegistrationNumber", d.orgRegistrationNumber);
        payload.append("orgContactName", d.orgContactName);
        payload.append("orgContactEmail", d.orgContactEmail);
        if (d.orgContactPhone) payload.append("orgContactPhone", d.orgContactPhone);
        if (d.orgAddress) payload.append("orgAddress", d.orgAddress);
        if (d.ownerWallet) payload.append("ownerWallet", d.ownerWallet);
        payload.append("startDate", d.startDate);
        if (d.baseDate) payload.append("baseDate", d.baseDate);
        payload.append("ongoing", String(!!d.ongoing));
        if (!d.ongoing && d.endDate) payload.append("endDate", d.endDate);
        payload.append("placeName", d.placeName);
        if (d.state) payload.append("state", d.state);
        if (d.district) payload.append("district", d.district);
        payload.append("country", d.country);
        payload.append("lat", String(d.lat));
        payload.append("lng", String(d.lng));
        payload.append("areaHa", String(d.areaHa));
        payload.append("ecosystems", JSON.stringify(d.ecosystems));
        if (d.mapReference) payload.append("mapReference", d.mapReference);
        if (d.habitatType) payload.append("habitatType", d.habitatType);
        payload.append("methodology", d.methodology);
        if (d.estimatedSequestrationTCO2)
          payload.append("estimatedSequestrationTCO2", String(d.estimatedSequestrationTCO2));
        if (d.requestedCredits)
          payload.append("requestedCredits", String(d.requestedCredits));
        payload.append("speciesList", JSON.stringify(d.speciesList));
        payload.append("plantTypes", JSON.stringify(d.plantTypes));
        if (d.numMangroves) payload.append("numMangroves", String(d.numMangroves));
        if (d.numSeagrasses) payload.append("numSeagrasses", String(d.numSeagrasses));
        if (d.numTidalMarshes)
          payload.append("numTidalMarshes", String(d.numTidalMarshes));
        if (d.plantingRegime) payload.append("plantingRegime", d.plantingRegime);
        if (d.density) payload.append("density", d.density);
        payload.append("monitoringPlan", d.monitoringPlan);
        if (d.sampleProtocol) payload.append("sampleProtocol", d.sampleProtocol);
        if (d.baselineCarbon) payload.append("baselineCarbon", String(d.baselineCarbon));
        if (d.calculationParams)
          payload.append("calculationParams", d.calculationParams);
        if (d.partners) payload.append("partners", d.partners);
        if (d.rolesJson) payload.append("rolesJson", d.rolesJson);
        if (d.verifierContact) payload.append("verifierContact", d.verifierContact);
        if (d.fundingSource) payload.append("fundingSource", d.fundingSource);
        if (d.benefitSharing) payload.append("benefitSharing", d.benefitSharing);
        if (d.tags) payload.append("tags", d.tags);
        payload.append("isConfidential", String(!!d.isConfidential));
        if (d.gpsAccuracy) payload.append("gpsAccuracy", String(d.gpsAccuracy));
        if (d.regulatoryRequired)
          payload.append("regulatoryRequired", d.regulatoryRequired);
        if (d.licenseNumber) payload.append("licenseNumber", d.licenseNumber);
        if (d.soilBulkDensity) payload.append("soilBulkDensity", String(d.soilBulkDensity));
        if (d.soilOrganicCarbonPercent)
          payload.append("soilOrganicCarbonPercent", String(d.soilOrganicCarbonPercent));
        if (d.waterSalinityPsu)
          payload.append("waterSalinityPsu", String(d.waterSalinityPsu));
        if (d.waterPh) payload.append("waterPh", String(d.waterPh));
        payload.append("consent", String(!!d.consent));

        // Files
        if (d.geoBoundaryFile) payload.append("geoBoundaryFile", d.geoBoundaryFile);
        if (Array.isArray(d.photos)) d.photos.forEach((f) => payload.append("photos", f));
        if (Array.isArray(d.satelliteImages))
          d.satelliteImages.forEach((f) => payload.append("satelliteImages", f));
        if (Array.isArray(d.labReports))
          d.labReports.forEach((f) => payload.append("labReports", f));
        if (Array.isArray(d.researchDocs))
          d.researchDocs.forEach((f) => payload.append("researchDocs", f));
        if (Array.isArray(d.permitDocs))
          d.permitDocs.forEach((f) => payload.append("permitDocs", f));
        if (Array.isArray(d.fundingDocs))
          d.fundingDocs.forEach((f) => payload.append("fundingDocs", f));
        if (d.licenseDoc) payload.append("licenseDoc", d.licenseDoc);
        if (d.landOwnershipProof) payload.append("landOwnershipProof", d.landOwnershipProof);
        if (d.communityConsentDoc)
          payload.append("communityConsentDoc", d.communityConsentDoc);
        if (d.signatureImage) payload.append("signatureImage", d.signatureImage);
        if (d.signatureDataUrl) {
          const file = await dataUrlToFile(d.signatureDataUrl, "signature_drawn.png");
          payload.append("signatureDrawn", file);
        }
      }

      const res = await fetch("/api/projects", { method: "POST", body: payload });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error("Insert failed");

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        window.location.href = "/";
      }, 1600);
    } catch (err) {
      console.error("Submit error:", err);
      setErrorSummary("Error submitting project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="container py-4">
      <style>{`
        .bg-gradient-1 { background: linear-gradient(135deg, #4f46e5, #0ea5e9); }
        .card-neo {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.16);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,0.24); }
        .animate-in { animation: fadeUp .6s ease both; }
        .anim-fade { animation: fadeUp .6s ease both; }
        .anim-slide { animation: slideIn .6s ease both; }
        .anim-scale { animation: scaleIn .5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .section {
          padding: 16px; border-radius: 12px; border: 1px dashed rgba(99,102,241,0.35);
          background: linear-gradient(0deg, rgba(99,102,241,0.08), rgba(14,165,233,0.06));
          margin-bottom: 16px;
        }
        .hr-fade { height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0.2), rgba(0,0,0,0)); }
        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .success-card {
          background: #ffffff; padding: 24px 28px; border-radius: 16px; text-align: center;
          animation: popIn .35s ease both; color: #0f172a;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1); } }
        .checkmark {
          width: 64px; height: 64px; border-radius: 50%; background: #22c55e;
          display: inline-flex; align-items: center; justify-content: center; color: white;
          font-size: 38px; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.4); animation: pulse 0.9s ease 1;
        }
        @keyframes pulse { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .hold-tip-wrapper { position: relative; display: inline-block; }
        .hold-tip-trigger { color: #0ea5e9; margin-left: 6px; cursor: pointer; user-select: none; }
        .hold-tip-bubble {
          position: absolute; top: -8px; left: 20px; min-width: 220px; max-width: 320px;
          background: #0ea5e9; color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35); animation: tipFade .2s ease both; z-index: 10;
        }
        @keyframes tipFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
        .red-note { color: #ef4444; font-size: 0.875rem; margin-top: 4px; }
        .upload-animated::file-selector-button {
          margin-right: 12px;
          border: none;
          background: linear-gradient(135deg, #0ea5e9, #4f46e5);
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .25s ease;
          box-shadow: 0 6px 16px rgba(79,70,229,0.3);
        }
        .upload-animated::file-selector-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 10px 22px rgba(79,70,229,0.4);
        }
        .upload-animated::file-selector-button:active {
          transform: translateY(0) scale(0.99);
        }
        .signature-box {
          background: #fff;
          border: 1px dashed #94a3b8;
          border-radius: 12px;
          padding: 8px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .signature-box canvas {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
        }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <h4 className="mb-0">Register Project</h4>
              <Badge bg="light" text="dark">
                {projectType}
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{ maxWidth: 320 }}
                aria-label="Project Type"
              >
                <option value="Local">Local (short form)</option>
                <option value="Organization">Organization (full, production-grade)</option>
                <option value="Collaboration" disabled>Collaboration (coming soon)</option>
              </Form.Select>
              <Button
                type="button"
                variant="outline-light"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
              {nowSaved && (
                <span className="small">
                  Autosaved <Badge bg="light" text="dark">{nowSaved}</Badge>
                </span>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            {errorSummary && (
              <Alert variant="danger" className="anim-fade">{errorSummary}</Alert>
            )}

            {/* LOCAL */}
            {projectType === "Local" && (
              <>
                <div className="section anim-fade">
                  <p className="mb-2">
                    <strong>Use this Local Project form</strong> for small teams or individuals.
                    Provide accurate location and at least two photos. Drafts save automatically.
                  </p>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Project Details</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Project Title *
                      <HoldTip text='Short descriptive name. Example: "Ramnagar Mangrove Restoration — 2025". 5–200 chars.' />
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

                  <div className="mb-2">
                    <div className="mb-1">
                      Ecosystem(s) *
                      <HoldTip text="Select all ecosystems present at the site." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                      {ECOSYSTEM_KEYS.map((ek) => (
                        <Form.Check
                          key={ek.key}
                          type="checkbox"
                          label={ek.label}
                          checked={!!localData.ecosystems[ek.key]}
                          onChange={() => toggleEcosystem(ek.key, false)}
                        />
                      ))}
                    </div>
                    {localErrors.ecosystems && (
                      <div className="red-note">{localErrors.ecosystems}</div>
                    )}
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Short Description
                      <HoldTip text="One-paragraph summary. Max 500 chars." />
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Owner Details</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Owner / Primary Contact Name *</Form.Label>
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
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Phone (10 digits) *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="ownerPhone"
                          inputMode="numeric"
                          pattern="\\d{10}"
                          value={localData.ownerPhone}
                          onChange={handleChange}
                          isInvalid={!!localErrors.ownerPhone}
                          data-err="ownerPhone"
                          placeholder="XXXXXXXXXX"
                        />
                        {localErrors.ownerPhone && (
                          <div className="red-note">{localErrors.ownerPhone}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Email *</Form.Label>
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Location</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country *</Form.Label>
                        <Form.Select
                          name="country"
                          value={localData.country}
                          onChange={handleChange}
                          isInvalid={!!localErrors.country}
                          data-err="country"
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
                      <Form.Group className="mb-3">
                        <Form.Label>Place Name *</Form.Label>
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
                        <Button variant="outline-primary" onClick={useDeviceGPSLocal}>
                          Use GPS
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setShowMapFor("local")}>
                          Pick on Map
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Latitude *</Form.Label>
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
                      <Form.Group className="mb-3">
                        <Form.Label>Longitude *</Form.Label>
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
                      <Form.Group className="mb-3">
                        <Form.Label>GPS Accuracy (m) (optional)</Form.Label>
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
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Area & Dates</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Area (hectares) *</Form.Label>
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
                      <Form.Group className="mb-3">
                        <Form.Label>Approx. number of plants (optional)</Form.Label>
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
                      <Form.Group className="mb-3">
                        <Form.Label>Start Date (optional)</Form.Label>
                        <Form.Control
                          type="date"
                          name="startDate"
                          value={localData.startDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Plant Types (if applicable)</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">
                      Select Plant Types (multi-select)
                      <HoldTip text="If you select more than two, provide counts for each type." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="plantTypesLocal">
                      <Form.Check
                        type="checkbox"
                        label="Mangroves"
                        checked={localData.plantTypes.mangroves}
                        onChange={() => togglePlantType("mangroves", false)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Seagrasses"
                        checked={localData.plantTypes.seagrasses}
                        onChange={() => togglePlantType("seagrasses", false)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Tidal Marshes"
                        checked={localData.plantTypes.tidalMarshes}
                        onChange={() => togglePlantType("tidalMarshes", false)}
                      />
                    </div>
                  </div>

                  {selectedPlantTypeCountLocal > 2 && (
                    <Row className="mb-2">
                      {localData.plantTypes.mangroves && (
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                            <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                            <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                  )}
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Evidence</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>Photos (at least 2) *</Form.Label>
                    <Form.Control
                      type="file"
                      name="photos"
                      className="upload-animated"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleChange}
                      isInvalid={!!localErrors.photos}
                      data-err="photos"
                    />
                    {localErrors.photos && (
                      <div className="red-note">{localErrors.photos}</div>
                    )}
                    <FileHints text="JPG/PNG, 20KB–10MB each." />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Onset Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="onsetImage"
                          className="upload-animated"
                          accept="image/*,application/pdf"
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Supporting Documents (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="supportingDocs"
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Signature</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <div className="mb-2 text-muted small">
                        Draw your digital signature or upload a signature image.
                      </div>
                      <SignaturePad
                        initialDataUrl={localData.signatureDataUrl}
                        onSave={(dataUrl) => setLocalField("signatureDataUrl", dataUrl)}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Signature Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="signatureImage"
                          className="upload-animated"
                          accept="image/*"
                          capture="environment"
                          onChange={handleChange}
                        />
                        <FileHints text="JPG/PNG, <=10MB." />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Permissions & Consent</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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
                              className="upload-animated"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={handleChange}
                            />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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

                  <Form.Group className="mb-3">
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
                </div>
              </>
            )}

            {/* ORGANIZATION */}
            {projectType === "Organization" && (
              <>
                <div className="section anim-fade">
                  <p className="mb-2">
                    <strong>Use Organization Project Registration</strong> for NGO, company,
                    government or community projects seeking verification and carbon credits.
                  </p>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Administrative & Identification</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Project Title *</Form.Label>
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Organization Type *</Form.Label>
                        <Form.Select
                          name="organizationType"
                          value={orgData.organizationType}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.organizationType}
                          data-err="organizationType"
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Phone (10 digits, optional)</Form.Label>
                        <Form.Control
                          type="tel"
                          name="orgContactPhone"
                          inputMode="numeric"
                          pattern="\\d{10}"
                          value={orgData.orgContactPhone}
                          onChange={(e) => {
                            e.target.value = sanitizePhone10(e.target.value);
                            handleChange(e, true);
                          }}
                          isInvalid={!!orgErrors.orgContactPhone}
                          data-err="orgContactPhone"
                          placeholder="XXXXXXXXXX"
                        />
                        {orgErrors.orgContactPhone && (
                          <div className="red-note">{orgErrors.orgContactPhone}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Project Time & Status</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Location & Spatial Data</SectionTitle>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country *</Form.Label>
                        <Form.Select
                          name="country"
                          value={orgData.country}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.country}
                          data-err="country"
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                        <Button variant="outline-primary" onClick={useDeviceGPSOrg}>
                          Use GPS
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setShowMapFor("org")}>
                          Pick on Map
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Boundary File (GeoJSON/KML/ZIP)
                          <HoldTip text="Upload GeoJSON, KML, or zipped shapefile (<=20MB)." />
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="geoBoundaryFile"
                          className="upload-animated"
                          accept=".geojson,.json,.kml,.zip"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.geoBoundaryFile}
                          data-err="geoBoundaryFile"
                        />
                        {orgErrors.geoBoundaryFile && (
                          <div className="red-note">{orgErrors.geoBoundaryFile}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Technical & MRV</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">Ecosystem(s) *</div>
                    <div className="d-flex flex-wrap gap-3" data-err="ecosystems">
                      {ECOSYSTEM_KEYS.map((ek) => (
                        <Form.Check
                          key={ek.key}
                          type="checkbox"
                          label={ek.label}
                          checked={!!orgData.ecosystems[ek.key]}
                          onChange={() => toggleEcosystem(ek.key, true)}
                        />
                      ))}
                    </div>
                    {orgErrors.ecosystems && (
                      <div className="red-note">{orgErrors.ecosystems}</div>
                    )}
                  </div>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Habitat Sub-type (optional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="habitatType"
                          value={orgData.habitatType}
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Methodology / Standard *</Form.Label>
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
                    </Col>
                  </Row>

                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Plant Types & Species</SectionTitle>
                  <div className="mb-2">
                    <div className="mb-1">
                      Plant Types (multi-select)
                      <HoldTip text="If you select more than two, provide counts for each type and upload a research report." />
                    </div>
                    <div className="d-flex flex-wrap gap-3" data-err="plantTypes">
                      <Form.Check
                        type="checkbox"
                        label="Mangroves"
                        checked={orgData.plantTypes.mangroves}
                        onChange={() => togglePlantType("mangroves", true)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Seagrasses"
                        checked={orgData.plantTypes.seagrasses}
                        onChange={() => togglePlantType("seagrasses", true)}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Tidal Marshes"
                        checked={orgData.plantTypes.tidalMarshes}
                        onChange={() => togglePlantType("tidalMarshes", true)}
                      />
                    </div>
                    {orgErrors.plantTypes && (
                      <div className="red-note">{orgErrors.plantTypes}</div>
                    )}
                  </div>

                  {selectedPlantTypeCountOrg > 2 && (
                    <Row className="mb-2">
                      {orgData.plantTypes.mangroves && (
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>Number of plants (Mangroves) *</Form.Label>
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
                            <Form.Label>Number of plants (Seagrasses) *</Form.Label>
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
                            <Form.Label>Number of plants (Tidal Marshes) *</Form.Label>
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
                  )}

                  <div className="mb-2">
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
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Monitoring & MRV Metrics</SectionTitle>
                  <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
                        <Form.Label>Soil Bulk Density (g/cm³) (opt)</Form.Label>
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                </div>

                <div className="section anim-slide">
                  <SectionTitle>Evidence Files</SectionTitle>
                  <Form.Group className="mb-3">
                    <Form.Label>High-resolution Photos *</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/jpeg,image/png"
                      name="photos"
                      className="upload-animated"
                      onChange={(e) => handleChange(e, true)}
                      isInvalid={!!orgErrors.photos}
                      data-err="photos"
                    />
                    {orgErrors.photos && <div className="red-note">{orgErrors.photos}</div>}
                    <FileHints text={`JPG/PNG, 20KB–${MAX_IMAGE_MB}MB each.`} />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Satellite Imagery (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".tif,.tiff,.jpg,.jpeg,.png"
                          name="satelliteImages"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.satelliteImages}
                          data-err="satelliteImages"
                        />
                        {orgErrors.satelliteImages && (
                          <div className="red-note">{orgErrors.satelliteImages}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lab Reports (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="labReports"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Research Documents {selectedPlantTypeCountOrg > 2 ? "(required)" : "(optional)"}
                        </Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="researchDocs"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.researchDocs}
                          data-err="researchDocs"
                        />
                        {orgErrors.researchDocs && (
                          <div className="red-note">{orgErrors.researchDocs}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Funding / Agreements (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          name="fundingDocs"
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Permits & Legal Docs</SectionTitle>
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
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseDoc}
                          data-err="licenseDoc"
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
                          className="upload-animated"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.permitDocs}
                          data-err="permitDocs"
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
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Community Consent Doc (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="communityConsentDoc"
                          className="upload-animated"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-fade">
                  <SectionTitle>Signature</SectionTitle>
                  <Row>
                    <Col md={8}>
                      <div className="mb-2 text-muted small">
                        Draw an authorized signature or upload a signature image.
                      </div>
                      <SignaturePad
                        initialDataUrl={orgData.signatureDataUrl}
                        onSave={(dataUrl) => setOrgField("signatureDataUrl", dataUrl)}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Signature Image (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="signatureImage"
                          className="upload-animated"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleChange(e, true)}
                        />
                        <FileHints text="JPG/PNG, <=10MB." />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="section anim-scale">
                  <SectionTitle>Additional & Consent</SectionTitle>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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
                      <Form.Group className="mb-3">
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

                  <Form.Group className="mb-3">
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
                </div>
              </>
            )}

            <div className="d-flex flex-wrap gap-2 mt-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Project"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => (window.location.href = "/")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline-success"
                onClick={() => {
                  try {
                    localStorage.setItem("registerForm.type", projectType);
                    localStorage.setItem("registerForm.local", JSON.stringify(localData));
                    localStorage.setItem("registerForm.org", JSON.stringify(orgData));
                    setAutosaveStamp(new Date().toISOString());
                  } catch {}
                }}
              >
                Save Draft
              </Button>
              <Button type="button" variant="outline-danger" onClick={clearDraft}>
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
              
