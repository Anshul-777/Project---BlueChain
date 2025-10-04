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

// IMPORTANT: ensure bootstrap CSS is imported in your index.jsx:
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

const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\-() ]{7,20}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MAX_LOCAL_PHOTO_MB = 10;
const MAX_ORG_PHOTO_MB = 15;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;

// Debounce helpers
const useDebouncedEffect = (effect, deps, delay = 600) => {
  const cleanupRef = useRef(null);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      cleanupRef.current = effect();
    }, delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

// Simple hold-to-show tooltip component
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

// Map Picker (Leaflet via CDN). If window.GOOGLE_MAPS_API_KEY is defined and you want Google, you can adapt loader.
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
  const [tempLat, setTempLat] = useState(initialLat || 20.5937);
  const [tempLng, setTempLng] = useState(initialLng || 78.9629);

  const ensureLeafletLoaded = () =>
    new Promise((resolve, reject) => {
      if (window.L && window.L.map) {
        resolve();
        return;
      }
      // Load CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href =
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      // Load JS
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src =
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
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
          if (!mapContainerRef.current) return;
          if (!window.L) return;

          // Initialize map once per open
          mapRef.current = window.L.map(mapContainerRef.current, {
            center: [
              initialLat != null ? Number(initialLat) : 20.5937,
              initialLng != null ? Number(initialLng) : 78.9629,
            ],
            zoom: initialLat != null ? 13 : 5,
          });
          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
              maxZoom: 19,
            }
          ).addTo(mapRef.current);

          // Existing marker if coords present
          if (initialLat != null && initialLng != null) {
            markerRef.current = window.L.marker([
              Number(initialLat),
              Number(initialLng),
            ]).addTo(mapRef.current);
          }

          mapRef.current.on("click", (e) => {
            const { lat, lng } = e.latlng;
            setTempLat(lat);
            setTempLng(lng);
            if (!markerRef.current) {
              markerRef.current = window.L.marker([lat, lng]).addTo(
                mapRef.current
              );
            } else {
              markerRef.current.setLatLng([lat, lng]);
            }
          });
        }, 0);
      })
      .catch(() => {
        setLeafletLoaded(false);
      });

    return () => {
      mounted = false;
      // Clean up map instance when modal hides
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
            markerRef.current = window.L.marker([lat, lng]).addTo(
              mapRef.current
            );
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
          <div className="text-center text-muted small mb-2">
            Loading map...
          </div>
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
                value={tempLat ?? ""}
                onChange={(e) => setTempLat(e.target.value)}
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
                value={tempLng ?? ""}
                onChange={(e) => setTempLng(e.target.value)}
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
              if (tempLat == null || tempLng == null) return;
              onApply({
                lat: Number(tempLat),
                lng: Number(tempLng),
              });
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

const humanMB = (bytes) =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const RegisterForm = () => {
  const [projectType, setProjectType] = useState("Local"); // Local | Organization | Collaboration (future)
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null

  // Local form state
  const [localData, setLocalData] = useState({
    projectTitle: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    projectTypeSelect: "Local",
    ecosystemType: "Mangrove",
    shortDescription: "",
    country: "",
    placeName: "",
    lat: "",
    lng: "",
    areaHa: "",
    approxPlants: "",
    startDate: "",
    photos: [], // File[]
    onsetImage: null,
    supportingDocs: [], // File[]
    hasPermit: false,
    permitDoc: null,
    gpsAccuracy: "",
    consent: false,
    intendsCarbonCredits: false,
  });
  const [localErrors, setLocalErrors] = useState({});

  // Organization form state
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
    ecosystemType: "Mangrove",
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
    // Plant types selection for conditional numbers + research required
    plantTypes: {
      mangroves: false,
      seagrasses: false,
      tidalMarshes: false,
    },
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
    photos: [], // File[]
    satelliteImages: [], // File[]
    labReports: [], // File[]
    researchDocs: [], // File[]
    permitDocs: [], // File[]
    fundingDocs: [], // File[]
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
    // Added compliance
    gpsAccuracy: "",
    regulatoryRequired: "", // "yes" | "no" | "unsure"
    licenseNumber: "",
    licenseDoc: null,
    landOwnershipProof: null,
    communityConsentDoc: null,
    // Key MRV metrics
    soilBulkDensity: "", // g/cm^3 typical 0.2–1.8
    soilOrganicCarbonPercent: "", // % 0–60
    waterSalinityPsu: "", // PSU 0–40
    waterPh: "", // 5–9 typical
  });
  const [orgErrors, setOrgErrors] = useState({});

  // Load draft from localStorage
  useEffect(() => {
    try {
      const savedType = localStorage.getItem("registerForm.type");
      if (savedType) setProjectType(savedType);
      const savedLocal = localStorage.getItem("registerForm.local");
      if (savedLocal) setLocalData(JSON.parse(savedLocal));
      const savedOrg = localStorage.getItem("registerForm.org");
      if (savedOrg) setOrgData(JSON.parse(savedOrg));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave projectType
  useDebouncedEffect(() => {
    try {
      localStorage.setItem("registerForm.type", projectType);
      setAutosaveStamp(new Date().toISOString());
    } catch {}
    return () => {};
  }, [projectType]);

  // Autosave Local
  useDebouncedEffect(() => {
    try {
      localStorage.setItem(
        "registerForm.local",
        JSON.stringify(localData)
      );
      setAutosaveStamp(new Date().toISOString());
    } catch {}
    return () => {};
  }, [localData]);

  // Autosave Org
  useDebouncedEffect(() => {
    try {
      localStorage.setItem(
        "registerForm.org",
        JSON.stringify(orgData)
      );
      setAutosaveStamp(new Date().toISOString());
    } catch {}
    return () => {};
  }, [orgData]);

  const setLocalField = (name, value) =>
    setLocalData((prev) => ({ ...prev, [name]: value }));
  const setOrgField = (name, value) =>
    setOrgData((prev) => ({ ...prev, [name]: value }));

  // Generic change handler
  const handleChange = (e, isOrg = false) => {
    const { name, type, checked, value, files, multiple } = e.target;
    const setter = isOrg ? setOrgData : setLocalData;

    setter((prev) => {
      const copy = { ...prev };
      if (type === "checkbox") {
        copy[name] = checked;
      } else if (type === "file") {
        if (multiple) {
          copy[name] = files ? Array.from(files) : [];
        } else {
          copy[name] = files && files.length === 1 ? files[0] : null;
        }
      } else {
        copy[name] = value;
      }
      return copy;
    });
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

  // Org plant types selection
  const togglePlantType = (key) => {
    setOrgData((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  };

  const selectedPlantTypeCount = useMemo(() => {
    const p = orgData.plantTypes || {};
    return ["mangroves", "seagrasses", "tidalMarshes"].reduce(
      (acc, k) => acc + (p[k] ? 1 : 0),
      0
    );
  }, [orgData.plantTypes]);

  // GPS
  const useDeviceGPSLocal = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalField("lat", Number(pos.coords.latitude).toFixed(6));
        setLocalField("lng", Number(pos.coords.longitude).toFixed(6));
        setLocalField(
          "gpsAccuracy",
          Number(pos.coords.accuracy).toFixed(1)
        );
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
        setOrgField(
          "gpsAccuracy",
          Number(pos.coords.accuracy).toFixed(1)
        );
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Validation - Local
  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!d.ownerPhone || !PHONE_REGEX.test(d.ownerPhone))
      errs.ownerPhone = "Enter valid phone (7–20 chars, country code allowed).";
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";
    if (!d.ecosystemType)
      errs.ecosystemType = "Please select an ecosystem type.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa))
      errs.areaHa = "Area (ha) must be greater than 0.";

    // Photos - at least 2, size and type
    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, <= 10 MB each).";
    } else {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (f.size > MAX_LOCAL_PHOTO_MB * 1024 * 1024) {
          errs.photos = `Each photo must be <= ${MAX_LOCAL_PHOTO_MB} MB.`;
          break;
        }
      }
    }

    if (!d.consent)
      errs.consent = "You must confirm to submit this form.";

    return errs;
  };

  // Validation - Organization
  const validateOrg = () => {
    const errs = {};
    const d = orgData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–250 characters required.";
    if (!d.organizationType)
      errs.organizationType = "Select organization type.";
    if (!d.organizationName)
      errs.organizationName = "Organization Name is required.";
    if (!d.orgContactName)
      errs.orgContactName = "Contact Person is required.";
    if (!d.orgContactEmail || !EMAIL_REGEX.test(d.orgContactEmail))
      errs.orgContactEmail = "Valid email is required.";
    if (d.orgContactPhone && !PHONE_REGEX.test(d.orgContactPhone))
      errs.orgContactPhone = "Enter a valid phone number.";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate)
      errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa))
      errs.areaHa = "Area (ha) must be greater than 0.";

    if (!d.ecosystemType)
      errs.ecosystemType = "Ecosystem Type is required.";

    if (!d.methodology || d.methodology.trim() === "")
      errs.methodology = "Methodology/Standard is required.";

    if (!d.monitoringPlan || d.monitoringPlan.trim() === "")
      errs.monitoringPlan = "Monitoring Plan is required.";

    // Species rows (at least one with name)
    if (
      !Array.isArray(d.speciesList) ||
      d.speciesList.length === 0 ||
      !d.speciesList[0].speciesName
    ) {
      errs.speciesList = "Add at least one species with a name.";
    } else {
      d.speciesList.forEach((row, idx) => {
        if (row.countPlanted && !positive(row.countPlanted)) {
          errs[`speciesList_${idx}_countPlanted`] =
            "Count must be positive if provided.";
        }
        if (
          row.expectedSurvivalPercent &&
          !within(row.expectedSurvivalPercent, 0, 100)
        ) {
          errs[`speciesList_${idx}_expectedSurvivalPercent`] =
            "Survival % must be 0–100.";
        }
      });
    }

    // Plant types selection logic + conditional counts + research required
    const ptCount = selectedPlantTypeCount;
    if (ptCount === 0) {
      errs.plantTypes =
        "Select at least one plant type (Mangroves/Seagrasses/Tidal Marshes).";
    }
    if (ptCount > 2) {
      // Require numbers for each selected
      if (d.plantTypes.mangroves && !positive(d.numMangroves)) {
        errs.numMangroves =
          "Enter number of Mangrove plants (must be > 0).";
      }
      if (d.plantTypes.seagrasses && !positive(d.numSeagrasses)) {
        errs.numSeagrasses =
          "Enter number of Seagrass plants (must be > 0).";
      }
      if (d.plantTypes.tidalMarshes && !positive(d.numTidalMarshes)) {
        errs.numTidalMarshes =
          "Enter number of Tidal Marsh plants (must be > 0).";
      }
      // Require research doc when >2 selected
      if (!Array.isArray(d.researchDocs) || d.researchDocs.length === 0) {
        errs.researchDocs =
          "Upload at least one Research Report when selecting more than two plant types.";
      }
    }

    // Evidence rule: 5+ photos OR (>=1 satellite AND >=3 photos)
    const numPhotos = Array.isArray(d.photos) ? d.photos.length : 0;
    const numSat = Array.isArray(d.satelliteImages)
      ? d.satelliteImages.length
      : 0;
    const photosOk = numPhotos >= 5 || (numSat >= 1 && numPhotos >= 3);
    if (!photosOk) {
      errs.photos =
        "Minimum evidence: 5+ photos OR 1 satellite image + 3 photos.";
    }

    // File checks for photos
    if (Array.isArray(d.photos)) {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (f.size > MAX_ORG_PHOTO_MB * 1024 * 1024) {
          errs.photos = `Each photo must be <= ${MAX_ORG_PHOTO_MB} MB.`;
          break;
        }
      }
    }
    // Satellite types
    if (Array.isArray(d.satelliteImages)) {
      for (const f of d.satelliteImages) {
        if (
          ![
            "image/tiff",
            "image/tif",
            "image/jpeg",
            "image/jpg",
            "image/png",
          ].includes(f.type)
        ) {
          // Many .tif share generic types; we allow by extension too
          const name = (f.name || "").toLowerCase();
          if (
            !(
              name.endsWith(".tif") ||
              name.endsWith(".tiff") ||
              name.endsWith(".jpg") ||
              name.endsWith(".jpeg") ||
              name.endsWith(".png")
            )
          ) {
            errs.satelliteImages =
              "Satellite images must be .tif/.tiff/.jpg/.jpeg/.png";
            break;
          }
        }
        if (f.size > MAX_DOC_MB * 1024 * 1024) {
          errs.satelliteImages = `Each satellite file must be <= ${MAX_DOC_MB} MB.`;
          break;
        }
      }
    }

    // Boundary file size/type (if provided)
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
        errs.geoBoundaryFile =
          "Allowed: .geojson, .json, .kml, .zip (shapefile).";
      } else if (f.size > MAX_BOUNDARY_MB * 1024 * 1024) {
        errs.geoBoundaryFile = `Boundary file <= ${MAX_BOUNDARY_MB} MB.`;
      }
    }

    // Regulatory & license docs
    if (!d.regulatoryRequired)
      errs.regulatoryRequired =
        "Select if permits are required in your jurisdiction.";
    if (d.regulatoryRequired === "yes") {
      if (!Array.isArray(d.permitDocs) || d.permitDocs.length === 0) {
        errs.permitDocs =
          "Upload permit/legal documents if required by law.";
      }
      if (!d.licenseNumber || d.licenseNumber.trim().length < 3) {
        errs.licenseNumber = "License number is required.";
      }
      if (!d.licenseDoc) {
        errs.licenseDoc = "Upload license document.";
      }
    }

    // Optional but realistic ranges for MRV metrics
    if (
      d.soilBulkDensity &&
      !within(d.soilBulkDensity, 0.2, 2.0)
    ) {
      errs.soilBulkDensity = "Soil bulk density should be 0.2–2.0 g/cm³.";
    }
    if (
      d.soilOrganicCarbonPercent &&
      !within(d.soilOrganicCarbonPercent, 0, 60)
    ) {
      errs.soilOrganicCarbonPercent =
        "SOC% should be between 0 and 60.";
    }
    if (d.waterSalinityPsu && !within(d.waterSalinityPsu, 0, 40)) {
      errs.waterSalinityPsu = "Salinity should be 0–40 PSU.";
    }
    if (d.waterPh && !within(d.waterPh, 5, 9)) {
      errs.waterPh = "Water pH should be between 5 and 9.";
    }

    if (!d.consent)
      errs.consent =
        "You must confirm to submit this form.";

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
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
    } else if (projectType === "Organization") {
      const errs = validateOrg();
      setOrgErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    }

    // Simulate successful submit (no backend per request)
    setTimeout(() => {
      setShowSuccess(true);
      clearDraft();
      setTimeout(() => {
        setShowSuccess(false);
        window.location.href = "/"; // Back to dashboard/home
      }, 1600);
    }, 350);
  };

  // Species row handlers
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
      {/* Inline CSS to keep single-file requirement */}
      <style>{`
        .bg-gradient-1 {
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
        }
        .card-neo {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.08);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .card-neo:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(2,6,23,0.12);
        }
        .animate-in {
          animation: fadeUp .5s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .section {
          padding: 16px;
          border-radius: 12px;
          border: 1px dashed rgba(99,102,241,0.3);
          background: linear-gradient(0deg, rgba(99,102,241,0.06), rgba(14,165,233,0.05));
          margin-bottom: 16px;
        }
        .hr-fade {
          height: 1px;
          background: linear-gradient(90deg, rgba(0,0,0,0.1), rgba(0,0,0,0));
        }
        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .success-card {
          background: #fff;
          padding: 24px 28px;
          border-radius: 16px;
          text-align: center;
          animation: popIn .35s ease both;
        }
        @keyframes popIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .checkmark {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #10b981;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 38px;
          margin-bottom: 12px;
          box-shadow: 0 8px 20px rgba(16,185,129,0.4);
          animation: pulse 0.9s ease 1;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .hold-tip-wrapper {
          position: relative; display: inline-block;
        }
        .hold-tip-trigger {
          color: #0ea5e9;
          margin-left: 6px;
          cursor: pointer;
          user-select: none;
        }
        .hold-tip-bubble {
          position: absolute;
          top: -8px;
          left: 20px;
          min-width: 220px;
          max-width: 320px;
          background: #0ea5e9;
          color: white;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35);
          animation: tipFade .2s ease both;
        }
        @keyframes tipFade {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .red-note {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 4px;
        }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0">Register Project</h4>
            {nowSaved && (
              <span className="small">
                Autosaved at{" "}
                <Badge bg="light" text="dark">
                  {nowSaved}
                </Badge>
              </span>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <div className="mb-3">
              <Form.Label>
                Project Type{" "}
                <HoldTip text="Choose Local for individuals/small teams. Choose Organization for full verification and carbon credit workflow." />
              </Form.Label>
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="Local">Local (short form)</option>
                <option value="Organization">
                  Organization (full, production-grade)
                </option>
                <option value="Collaboration" disabled>
                  Collaboration (coming soon)
                </option>
              </Form.Select>
            </div>

            {errorSummary && (
              <Alert variant="danger" className="animate-in">
                {errorSummary}
              </Alert>
            )}

            {projectType === "Local" && (
              <>
                <div className="section animate-in">
                  <p className="mb-2">
                    <strong>Use this Local Project form</strong> when you
                    are a small team, individual, or community restoring a
                    coastal area (mangrove, seagrass, salt marsh). Projects
                    registered here can later be upgraded to an Organization
                    Project for carbon credit issuance. Drafts save
                    automatically.
                  </p>
                  <div className="text-muted small">
                    A short, lightweight form to create a verifiable project
                    record. It collects owner identity, basic location and
                    size, ecosystem type, minimal evidence (photos), and a
                    short description. Not for immediate carbon credit
                    minting.
                  </div>
                </div>

                <SectionTitle>Project Details</SectionTitle>
                <Form.Group className="mb-3">
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
                    <div className="red-note">
                      {localErrors.projectTitle}
                    </div>
                  )}
                </Form.Group>

                <SectionTitle>Owner Details</SectionTitle>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
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
                        <div className="red-note">
                          {localErrors.ownerName}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Contact Phone *
                        <HoldTip text="Enter reachable number with country code if possible. 7–20 digits." />
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="ownerPhone"
                        value={localData.ownerPhone}
                        onChange={handleChange}
                        isInvalid={!!localErrors.ownerPhone}
                        data-err="ownerPhone"
                        placeholder="+91-XXXXXXXXXX"
                      />
                      {localErrors.ownerPhone && (
                        <div className="red-note">
                          {localErrors.ownerPhone}
                        </div>
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
                        <div className="red-note">
                          {localErrors.ownerEmail}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Ecosystem Type *
                        <HoldTip text="Choose the ecosystem that best describes the project site." />
                      </Form.Label>
                      <Form.Select
                        name="ecosystemType"
                        value={localData.ecosystemType}
                        onChange={handleChange}
                        isInvalid={!!localErrors.ecosystemType}
                        data-err="ecosystemType"
                      >
                        {ECOSYSTEM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Form.Select>
                      {localErrors.ecosystemType && (
                        <div className="red-note">
                          {localErrors.ecosystemType}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Short Description
                        <HoldTip text="One paragraph summary (what you planted/restored and why). Max 500 chars." />
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
                        <div className="red-note">
                          {localErrors.country}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3">
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
                        <div className="red-note">
                          {localErrors.placeName}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <div className="d-flex gap-2 mb-3">
                      <Button
                        variant="outline-primary"
                        onClick={useDeviceGPSLocal}
                      >
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
                      {localErrors.lat && (
                        <div className="red-note">{localErrors.lat}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
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
                      {localErrors.lng && (
                        <div className="red-note">{localErrors.lng}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        GPS Accuracy (m)
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
                    <Form.Group className="mb-3">
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
                        <div className="red-note">
                          {localErrors.areaHa}
                        </div>
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

                <SectionTitle>Evidence</SectionTitle>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Photos (at least 2) *
                    <HoldTip text="Upload clear JPG/PNG images (<=10MB each). Include a wide shot and a close-up; GPS-tag helps." />
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="photos"
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
                      <Form.Label>
                        Onset Image (optional)
                        <HoldTip text="Planting day image or PDF note (optional)." />
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="onsetImage"
                        accept="image/*,application/pdf"
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Supporting Documents (optional)
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="supportingDocs"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleChange}
                      />
                      <FileHints text="Max 20MB each." />
                    </Form.Group>
                  </Col>
                </Row>

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
              </>
            )}

            {projectType === "Organization" && (
              <>
                <div className="section animate-in">
                  <p className="mb-2">
                    <strong>Use Organization Project Registration</strong> for
                    NGO, company, government or community projects that seek
                    formal verification and carbon credit issuance. Provide
                    thorough evidence, GPS boundaries, monitoring plans, and lab
                    reports where available.
                  </p>
                </div>

                <SectionTitle>A. Administrative & Identification</SectionTitle>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
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
                        <div className="red-note">
                          {orgErrors.projectTitle}
                        </div>
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
                      >
                        <option value="">Select type</option>
                        {ORGANIZATION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Form.Select>
                      {orgErrors.organizationType && (
                        <div className="red-note">
                          {orgErrors.organizationType}
                        </div>
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
                        <div className="red-note">
                          {orgErrors.organizationName}
                        </div>
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
                        <div className="red-note">
                          {orgErrors.orgContactName}
                        </div>
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
                        <div className="red-note">
                          {orgErrors.orgContactEmail}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Phone (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgContactPhone"
                        value={orgData.orgContactPhone}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.orgContactPhone}
                        data-err="orgContactPhone"
                      />
                      {orgErrors.orgContactPhone && (
                        <div className="red-note">
                          {orgErrors.orgContactPhone}
                        </div>
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
                        <div className="red-note">
                          {orgErrors.ownerWallet}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>B. Project Time & Status</SectionTitle>
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
                        <div className="red-note">
                          {orgErrors.startDate}
                        </div>
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

                <SectionTitle>C. Location & Spatial Data</SectionTitle>
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
                        <div className="red-note">
                          {orgErrors.placeName}
                        </div>
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
                      {orgErrors.lat && (
                        <div className="red-note">{orgErrors.lat}</div>
                      )}
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
                      {orgErrors.lng && (
                        <div className="red-note">{orgErrors.lng}</div>
                      )}
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
                      <Button
                        variant="outline-primary"
                        onClick={useDeviceGPSOrg}
                      >
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
                        <div className="red-note">
                          {orgErrors.areaHa}
                        </div>
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
                        accept=".geojson,.json,.kml,.zip"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.geoBoundaryFile}
                        data-err="geoBoundaryFile"
                      />
                      {orgErrors.geoBoundaryFile && (
                        <div className="red-note">
                          {orgErrors.geoBoundaryFile}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <SectionTitle>D. Technical & MRV</SectionTitle>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ecosystem Type *</Form.Label>
                      <Form.Select
                        name="ecosystemType"
                        value={orgData.ecosystemType}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.ecosystemType}
                        data-err="ecosystemType"
                      >
                        {ECOSYSTEM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Form.Select>
                      {orgErrors.ecosystemType && (
                        <div className="red-note">
                          {orgErrors.ecosystemType}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
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
                </Row>
                <Form.Group className="mb-3">
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
                    <div className="red-note">
                      {orgErrors.methodology}
                    </div>
                  )}
                </Form.Group>

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

                <SectionTitle>E. Planting & Biological Data</SectionTitle>
                <div className="mb-2">
                  <div className="mb-1">
                    Select Plant Types (checkbox, multi-select){" "}
                    <HoldTip text="Choose plant categories used in the project. If you select more than two, you must provide counts for each and upload a research report." />
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Mangroves"
                      checked={orgData.plantTypes.mangroves}
                      onChange={() => togglePlantType("mangroves")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Seagrasses"
                      checked={orgData.plantTypes.seagrasses}
                      onChange={() => togglePlantType("seagrasses")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Tidal Marshes"
                      checked={orgData.plantTypes.tidalMarshes}
                      onChange={() => togglePlantType("tidalMarshes")}
                    />
                  </div>
                  {orgErrors.plantTypes && (
                    <div className="red-note" data-err="plantTypes">
                      {orgErrors.plantTypes}
                    </div>
                  )}
                </div>

                {selectedPlantTypeCount > 2 && (
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
                            <div className="red-note">
                              {orgErrors.numMangroves}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    )}
                    {orgData.plantTypes.seagrasses && (
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>
                            Number of plants (Seagrasses) *
                          </Form.Label>
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
                            <div className="red-note">
                              {orgErrors.numSeagrasses}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    )}
                    {orgData.plantTypes.tidalMarshes && (
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>
                            Number of plants (Tidal Marshes) *
                          </Form.Label>
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
                            <div className="red-note">
                              {orgErrors.numTidalMarshes}
                            </div>
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
                          isInvalid={
                            !!orgErrors.speciesList &&
                            idx === 0 &&
                            !s.speciesName
                          }
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
                            !!orgErrors[
                              `speciesList_${idx}_expectedSurvivalPercent`
                            ]
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
                          <Button
                            variant="success"
                            size="sm"
                            onClick={addSpeciesRow}
                          >
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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                    <div className="red-note">
                      {orgErrors.monitoringPlan}
                    </div>
                  )}
                </Form.Group>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
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
                        <div className="red-note">
                          {orgErrors.soilBulkDensity}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Soil Organic Carbon (%) (opt)
                      </Form.Label>
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
                        <div className="red-note">
                          {orgErrors.waterSalinityPsu}
                        </div>
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

                <SectionTitle>G. Evidence Files</SectionTitle>
                <Form.Group className="mb-3">
                  <Form.Label>High-resolution Photos *</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    name="photos"
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.photos}
                    data-err="photos"
                  />
                  {orgErrors.photos && (
                    <div className="red-note">{orgErrors.photos}</div>
                  )}
                  <FileHints text={`JPG/PNG, <= ${MAX_ORG_PHOTO_MB}MB each. Provide onset + monitoring images.`} />
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
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.satelliteImages}
                        data-err="satelliteImages"
                      />
                      {orgErrors.satelliteImages && (
                        <div className="red-note">
                          {orgErrors.satelliteImages}
                        </div>
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
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Research Documents{" "}
                        {selectedPlantTypeCount > 2 ? "(required)" : "(optional)"}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        name="researchDocs"
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.researchDocs}
                        data-err="researchDocs"
                      />
                      {orgErrors.researchDocs && (
                        <div className="red-note">
                          {orgErrors.researchDocs}
                        </div>
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
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
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
                      onChange={() =>
                        setOrgField("regulatoryRequired", "unsure")
                      }
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
                        <Form.Label>License Number {orgData.regulatoryRequired === "yes" ? "*" : "(optional)"}</Form.Label>
                        <Form.Control
                          type="text"
                          name="licenseNumber"
                          value={orgData.licenseNumber}
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseNumber}
                          data-err="licenseNumber"
                        />
                        {orgErrors.licenseNumber && (
                          <div className="red-note">
                            {orgErrors.licenseNumber}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>License Document {orgData.regulatoryRequired === "yes" ? "*" : "(optional)"}</Form.Label>
                        <Form.Control
                          type="file"
                          name="licenseDoc"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChange(e, true)}
                          isInvalid={!!orgErrors.licenseDoc}
                          data-err="licenseDoc"
                        />
                        {orgErrors.licenseDoc && (
                          <div className="red-note">
                            {orgErrors.licenseDoc}
                          </div>
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
                        />
                        {orgErrors.permitDocs && (
                          <div className="red-note">
                            {orgErrors.permitDocs}
                          </div>
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
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form.Group>

                <SectionTitle>H–L. Additional Fields</SectionTitle>
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
              </>
            )}

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
                    localStorage.setItem(
                      "registerForm.type",
                      projectType
                    );
                    if (projectType === "Local") {
                      localStorage.setItem(
                        "registerForm.local",
                        JSON.stringify(localData)
                      );
                    } else {
                      localStorage.setItem(
                        "registerForm.org",
                        JSON.stringify(orgData)
                      );
                    }
                    setAutosaveStamp(new Date().toISOString());
                  } catch {}
                }}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                onClick={clearDraft}
              >
                Clear Draft
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Map modals */}
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

      {/* Success overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="checkmark">✓</div>
            <h5 className="mb-1">Thank you!</h5>
            <div className="text-muted">
              Your project was submitted successfully.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
Install commands
npm install react-bootstrap bootstrap
Ensure you import Bootstrap CSS once in your src/index.jsx:

import 'bootstrap/dist/css/bootstrap.min.css';
How to link (CRA)
In HomePage.js, add a button to navigate to the form route or render <RegisterForm /> directly.

If using React Router, create a route like:

<Route path="/register" element={<RegisterForm />} />
Otherwise, import and use:

import RegisterForm from './RegisterForm';
<RegisterForm /> inside your HomePage.js.
I added autosave, per-field red errors, hold-to-show help (?), GPS + map picker, soil and MRV constraints, org plant-type checkboxes with conditional counts and mandatory research when >2, attractive Bootstrap styling, animations, and a thank-you closing animation with redirect.

Give me local from in details.
Research real projects, and choose those details which is only needed in local form.

And also optional and everything else mandatory.

From owner name, to area, numbers, ecosystem types and etc.
And mention that in prompt for local form.
Give that form example with all necessary.

With dropdown for organizations.

And in organization, Mentioned all and every things, which is very necessary.
Like research data (can be optional), Soil, Ecosystem, and everything.
Find all the details and forms requirement.

Make it so that, when the user doesn't fill the mandatory * details and submit. They get a red message below telling them they have to fill this.   And put some limits and constraints.

And when a user chooses an organization form, they get to choose multiple plants of different species to make it Checkbox.    And when the user selects more than 2, They should get
Number of plants (Mangroves) :
Number of plants (Seagrasses) :
Number of plants (Tidal Mashes) :

According to their choice, and add a research report as mandatory, where we expect the organisation to provide us with every possible data.

Increase the Bootstrap and Css in form and make it attractive with animation and design. Show structure and everything.
I want hover and fade up in, and Multiple animation, make it like form and yet asthetic and creative in design. Use some colors and etc.

And ask for gps permission and they should be able to choose the location from the map exactly. Use Google maps, if you can.
For auto coordinates.

Ask for the country, area, contact number according to the country, Licence for this initiative, verification proof necessary like asking for some documents which are asked in real projects.

Ask for every single thing, a government verifier will check , I mean every single thing, do a detailed research and think longer. Find various documents and links and check for everything.

So if the organisation fills that form correctly, they can easily get verified. But make sure to make some unnecessary details as Optional. But ask important as mandatory.

And make sure the local form is also asked with seriousness for carbon credits.

And I said, to make a (?) symbol beside every important detail, when the user clicks it and holds, a small note opens and it explains what the user must enter, like when written area, It should explain that users are supposed to enter the area of their project property, so they understand easily. And it fades immediately after we let go of the holding ..

And I said for the option to automatically save the input after writing directly, to save it when in slow network and reload. So as to not rewrite Everything.

And an option for saving drafts, so they can edit it later...

And after submitting, show some closing animation with a thank you message. And back to the dashboard we made.

And make sure to check if the values are real, like soil density or whatever they may ask, you know the range of how it is measured in, so users cannot throw around make values like 1000 density or whatever. They should have proper formula and range. Also, know that we are not limiting bad areas, but over value are not input ...    Use formulas for every single one of them.

*Btw, divide the sections while asking for information, like project details, owner details, organization details, project data and etc.
To make it easy and structured. *

And think longer for a better answer, do a deep research and give me every single thing I asked for. Reread every single request again and i want it all shown in my code.

Local Project Registration (short form)

Top prompt (show at top of the form):

Use this Local Project form when you are a small team, individual, or community restoring a coastal area (mangrove, seagrass, salt marsh). This form collects essential data to create a verifiable project record. Projects registered here can later be upgraded to an Organization Project for carbon credit issuance. Provide accurate location and at least two photos. Drafts save automatically.

Summary of purpose

A short, lightweight form for individuals / small community teams who need to register their restoration project with minimum friction. It collects owner identity, basic location and size, ecosystem type, minimal evidence (photos), and a short description. This is NOT for immediate carbon credit minting — it creates a record which verifiers can request more evidence for.

Fields (order on form, with exact label, type, mandatory flag, constraints, help tooltip text)

1. 

Project Title — projectTitle

Type: text

Mandatory: Yes

Constraints: 5–200 chars

Help: Short descriptive name. Example: “Ramnagar Mangrove Restoration — 2025”.


2. 

Owner / Primary Contact Name — ownerName

Type: text

Mandatory: Yes

Constraints: 3–120 chars

Help: Individual or group lead who submits this project.


3. 

Contact Phone — ownerPhone

Type: text (phone)

Mandatory: Yes

Constraints: international format allowed, 7–20 characters

Help: Used for verification; enter reachable phone number.


4. 

Contact Email — ownerEmail

Type: email

Mandatory: Yes

Constraints: valid email format

Help: We send project updates here.


5. 

Project Type (dropdown) — projectType

Type: dropdown

Mandatory: Yes

Options: Local (default), Organization (switch triggers org form), Collaboration (future)

Help: Choose Local to submit this short form.


6. 

Ecosystem Type (dropdown) — ecosystemType

Type: dropdown

Mandatory: Yes

Options: Mangrove, Seagrass, Salt marsh, Coastal mudflat, Coastal sediment, Other

Help: Choose the ecosystem that best describes the project site.


7. 

Short Description — shortDescription

Type: multiline text

Mandatory: No (recommended)

Constraints: max 500 chars

Help: One-paragraph summary (what you planted/restored and why).


8. 

Location — Place Name — placeName

Type: text

Mandatory: Yes

Constraints: 3–200 chars

Help: Village or coastal landmark.


9. 

Latitude — lat

Type: number (decimal)

Mandatory: Yes

Constraints: valid latitude (-90 to 90), precision at least 4 decimal places recommended

Help: GPS coordinate for verification.


10. 

Longitude — lng

Type: number (decimal)

Mandatory: Yes

Constraints: valid longitude (-180 to 180)

Help: GPS coordinate for verification.


11. 

Area (hectares) — areaHa

Type: number (decimal)

Mandatory: Yes

Constraints: > 0, decimal precision 2 (e.g., 2.50)

Help: Estimate of restored/planting area in hectares.


12. 

Approx. number of plants — approxPlants

Type: integer

Mandatory: Optional (recommended if available)

Constraints: > 0


13. 

Start Date — startDate

Type: date

Mandatory: Optional (recommended)

Help: Date planting began or restoration started.


14. 

Photos (evidence) — photos[]

Type: file upload (multiple)

Mandatory: Yes (at least 2 photos required)

Allowed types: image/jpeg, image/png

Max single file: 10 MB (recommend compress)

Recommended: 3–10 photos; include at least one wide shot and one close-up with a GPS-tag (if phone camera embeds GPS).

Help: Upload clear images with timestamps if possible.


15. 

Onset Image (planting documentation) — onsetImage

Type: file (optional)

Allowed types: image/pdf

Help: Optional planting day image.


16. 

Supporting Document(s) — supportingDocs[]

Type: file upload (optional)

Allowed types: PDF, DOCX, JPG, PNG

Max single: 15 MB


17. 

Local Permissions / Permits (Yes/No + upload) — hasPermit (boolean) and permitDoc (file optional)

Mandatory: Optional but recommended

Help: If you have government/local permission, attach it.


18. 

GPS Accuracy (meters) — gpsAccuracy

Type: number (optional)

Help: If device GPS provided accuracy, include it.


19. 

Consent (checkbox) — consent

Type: boolean

Mandatory: Yes (must check before submit)

Text: “I confirm the information is true and I have the right to upload these files.”


20. 

Save Draft / Submit buttons

Behavior: Save draft to localStorage automatically (autosave). Optional “Save Draft to server” if backend supports. Submit posts to /api/projects endpoint.


Validation logic (client-side)

Required fields must be filled.

Latitude/longitude numeric ranges enforced.

Photos count >= 2.

File size and type checks.

Owner phone/email format validation.


Minimal JSON structure produced for Local Project

{   "type": "local",   "projectTitle": "Ramnagar Mangrove Pocket",   "ownerName": "Suman Das",   "ownerPhone": "+91-9876543210",   "ownerEmail": "suman@example.com",   "ecosystemType": "mangrove",   "shortDescription": "Community-led planting on tidal fringe to restore 0.5 ha.",   "placeName": "Ramnagar Village, Sundarbans",   "lat": 21.8321,   "lng": 88.9206,   "areaHa": 0.5,   "approxPlants": 800,   "startDate": "2025-06-10",   "photos": ["ramnagar_wide_20250610.jpg","ramnagar_close_20250610.jpg"],   "supportingDocs": [],   "hasPermit": false,   "gpsAccuracy": 6.5,   "consent": true,   "createdAt": "2025-06-11T10:23:00Z" } 

2ndly,  Organization Project Registration (full, production-grade)

Top prompt (show at top):

Use Organization Project Registration for NGO, company, government or community projects that seek formal verification and carbon credit issuance. Provide thorough evidence, GPS boundaries, monitoring plans, and lab reports where available. Submitting complete data reduces back-and-forth with verifiers and accelerates credit issuance.

Purpose & overview

This form captures all MRV-relevant fields for an organizational blue carbon project. It must support creating a full project package that the backend can pack (project JSON), upload to IPFS, compute SHA-256, and on approval anchor on-chain.

Fields (grouped by sections). For every field I give: label/key — type — mandatory? — constraints/help.

A. Administrative & Identification

1. 

Project Title — projectTitle — Mandatory — 5–250 chars. Help: Unique human-readable name.

2. 

Project External ID — projectExternalId — Optional — e.g., internal org ID, grant ID.

3. 

Project Owner Organization Name — organizationName — Mandatory — Full legal name.

4. 

Organization Registration Number — orgRegistrationNumber — Optional — Company/NGO registration.

5. 

Organization Contact Person — orgContactName — Mandatory.

6. 

Contact Email — orgContactEmail — Mandatory.

7. 

Contact Phone — orgContactPhone — Optional.

8. 

Organization Address — orgAddress — Optional.

9. 

Project Lead Wallet Address — ownerWallet — Optional but recommended — Ethereum-compatible address (0x...).

B. Project Time & Status

1. Project Start Date — startDate — Mandatory.


2. Base Date / Baseline Measurement Date — baseDate — Optional.


3. Project End Date or Ongoing flag — ongoing (boolean) — Mandatory (if not ongoing supply endDate).



C. Location & Spatial Data

1. Site Name / Place — placeName — Mandatory.


2. Administrative area — state, district, country — Optional but recommended.


3. Centroid Latitude / Longitude — lat, lng — Mandatory.


4. Area (hectares) — areaHa — Mandatory.


5. Boundary File (GeoJSON/KML) — geoBoundaryFile — Mandatory (recommended) — Accept .geojson, .json, .kml; max 20 MB. If not available require at least coordinates of corners or centroid + area.


6. Map link / WMS / shapefile reference — mapReference — Optional.



D. Technical & MRV Details

1. Ecosystem Type — ecosystemType — Mandatory — Mangrove, Seagrass, Salt marsh, Coastal sediment, Other.


2. Vegetation Type / Habitat Sub-type — habitatType — Optional.


3. Methodology/Standard — methodology — Mandatory — Select and describe: e.g., IPCC Tier 1/2 methodology, Verra VM0033 variant, or custom. Include a short explanation and reference documents.


4. Estimated Carbon Sequestration (tCO₂) — estimatedSequestrationTCO2 — Optional but recommended.


5. Credits Requested — requestedCredits — Optional.



E. Planting & Biological Data

1. Species List (table) — speciesList[] — Mandatory (at least one species) — fields per row: speciesName, countPlanted, plantingDensity, expectedSurvivalPercent, ageClass (if applicable).


2. Planting Regime — plantingRegime — Optional — describe spacing, nursery vs direct planting.


3. Initial Planting Densities (per m² or per hectare) — density — Optional.



F. Monitoring & Sampling

1. Monitoring Plan — monitoringPlan — Mandatory — Describe frequency, sample plots, photo transects, GPS approach.


2. Sample Protocol — sampleProtocol — Optional but recommended.


3. Soil Sample Records (table) — soilSamples[] — Optional (rows: sampleId, location, depth, labReportCID).


4. Vegetation Sample Records (table) — vegSamples[].


5. Onset Events / Planting Dates table — plantingEvents[] — Optional but recommended.



G. Evidence Files (critical)

1. High-resolution Photos (onset + monitoring) — photos[] — Mandatory — recommend 10+ images; each max 15 MB; prefer geo-tagged.


2. Satellite imagery / NDVI files — satelliteImages[] — Optional but recommended; allow .tif, .jpg.


3. Lab reports (soil, biomass) — labReports[] — Optional but strong evidence; PDF preferred.


4. Research documents (PDF/DOCX) — researchDocs[] — Optional; include methodology papers, prior surveys.


5. Permits & legal docs — permitDocs[] — Mandatory if required by local law. If none, include a statement.


6. Project Agreement / Funding docs — fundingDocs[] — Optional.



H. Carbon Calculations & Modeling Inputs

1. Baseline Carbon Stock (tCO₂/ha) — baselineCarbon — Optional.


2. Estimation method and parameters — calculationParams — JSON or structured fields (wood density, growth curves, equation references). Recommended to be uploaded as a calculation file or described.



I. Institutional & Governance

1. Partners — partners — Optional (list).


2. Roles & responsibilities — rolesJson — Optional structured data: who does monitoring, community liaison, verifier contact.


3. Contact for verification — verifierContact — Optional (if pre-arranged).



J. Financial & Benefits

1. Funding Source — fundingSource — Optional.


2. Benefit Sharing Plan — benefitSharing — Optional but recommended (how revenue is shared with community).



K. Metadata & Tags

1. Tags / Keywords — tags — Optional.


2. Confidential flag — isConfidential — Optional (if true, certain docs are hidden to public viewers).



L. Declarations & Consent

1. Legal Declaration & Consent — consent — Mandatory — confirmation checkbox: owner certifies data correctness and permission to anchor hash to blockchain.



Files allowed & constraints (summary)

Images: .jpg, .jpeg, .png — max 15 MB each. Geo-tag recommended.

Boundary files: .geojson, .kml, .zip (shapefile) — max 20 MB.

Documents: .pdf, .doc, .docx — max 20 MB.

Satellite imagery: .tif, .jpg — please compress for uploads if possible.


Validation & server-side checks (recommend)

Required fields presence and ranges (lat/lng, area>0).

Minimum evidence: at least 5 photos or 1 satellite tile + 3 photos.

Species rows validated: species name and count positive.

GeoBoundary file: validate contains at least one polygon.

File virus scan and MIME type verification.

Compute and verify SHA-256 of project_json on server and compare with client-supplied hash.


Example Organization Project JSON (abridged)

{   "type": "org",   "projectTitle": "Bayview Mangrove Restoration Project",   "projectExternalId": "BV-MANG-2025-01",   "organizationName": "Coastal Green NGO",   "orgRegistrationNumber": "CIN-123456789",   "orgContactName": "Dr. Priya Sharma",   "orgContactEmail": "priya@coastalgreen.org",   "orgContactPhone": "+91-9876512340",   "ownerWallet": "0xAbc123...789",   "startDate": "2024-11-01",   "baseDate": "2024-11-01",   "ongoing": true,   "placeName": "Bayview Coast, Tamil Nadu",   "state": "Tamil Nadu",   "district": "Cuddalore",   "lat": 11.7658,   "lng": 79.7654,   "areaHa": 12.37,   "ecosystemType": "mangrove",   "methodology": "Adopted Verra-compatible methodology adapted for mangrove planting; sampling plots 10x10m",   "speciesList": [     {"speciesName":"Rhizophora mucronata","countPlanted":2500,"expectedSurvivalPercent":70,"notes":""},     {"speciesName":"Avicennia marina","countPlanted":1200,"expectedSurvivalPercent":65,"notes":""}   ],   "monitoringPlan": "Quarterly monitoring with photo transects and 10 permanent sample plots; annual soil sampling.",   "photos": ["bayview_onset_20241101.jpg", "bayview_plot1_20241201.jpg"],   "geoBoundaryFileName":"bayview_boundary.geojson",   "labReports":["soil_preplanting_report.pdf"],   "fundingSource":"Coastal Resilience Fund",   "estimatedSequestrationTCO2": 1450,   "requestedCredits": 1300,   "consent": true,   "createdAt":"2025-02-12T15:00:00Z" } 



Give me the code for what I asked.

Use the below code. And modify it to what I asked and all the above Features. Forget sha256 algorithm if it gives error. But all other should work, features. And no api or anything else, just simply add linked by Index.jsx And make it beautiful like above.... And tell the command to install anything. We used react-create-app. Not next app, so make it accordingly. Because the earlier code was entirely wrong.
 
And our home page name is HomePage.js It's not javascript .js, it's the files we used. Not tsx. So make files accordingly, we are using everything.
 
Modify the below code to every single thing i explained before. And change it, and make it's structure better like that error code.
 
// src/RegisterForm.js import React, { useState } from "react"; import axios from "axios"; import { Form, Button, Row, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
 
/* Complete RegisterForm.js
 
 
- Single file containing Local + Organization forms
 
- No localStorage
 
- File uploads via FormData to /api/projects
 
- Client-side validation (required fields, photos count, lat/lng ranges)
 
- Add/remove species rows for organization form */
 

 
const tip = (text) => {text};
 
const RegisterForm = () => { const [projectType, setProjectType] = useState("Local"); // "Local" or "Organization"
 
// Local form state const [localData, setLocalData] = useState({ projectTitle: "", ownerName: "", ownerPhone: "", ownerEmail: "", ecosystemType: "Mangrove", shortDescription: "", placeName: "", lat: "", lng: "", areaHa: "", approxPlants: "", startDate: "", photos: [], // File[] onsetImage: null, supportingDocs: [], // File[] hasPermit: false, permitDoc: null, gpsAccuracy: "", consent: false, });
 
// Organization form state const [orgData, setOrgData] = useState({ projectTitle: "", projectExternalId: "", organizationName: "", orgRegistrationNumber: "", orgContactName: "", orgContactEmail: "", orgContactPhone: "", orgAddress: "", ownerWallet: "", startDate: "", baseDate: "", ongoing: true, endDate: "", placeName: "", state: "", district: "", country: "", lat: "", lng: "", areaHa: "", geoBoundaryFile: null, mapReference: "", ecosystemType: "Mangrove", habitatType: "", methodology: "", estimatedSequestrationTCO2: "", requestedCredits: "", speciesList: [ { speciesName: "", countPlanted: "", plantingDensity: "", expectedSurvivalPercent: "", ageClass: "" }, ], plantingRegime: "", density: "", monitoringPlan: "", sampleProtocol: "", soilSamples: [], // allow later vegSamples: [], plantingEvents: [], photos: [], // File[] satelliteImages: [], // File[] labReports: [], // File[] researchDocs: [], // File[] permitDocs: [], // File[] fundingDocs: [], // File[] baselineCarbon: "", calculationParams: "", partners: "", rolesJson: "", verifierContact: "", fundingSource: "", benefitSharing: "", tags: "", isConfidential: false, consent: false, });
 
// Generic change handler for local or org (isOrg boolean) const handleChange = (e, isOrg = false) => { const { name, type, checked, value, files } = e.target;
 `if (isOrg) {     const copy = { ...orgData };     if (type === "checkbox") copy[name] = checked;     else if (type === "file") {       // multiple vs single file fields       if (files && files.length > 1) copy[name] = Array.from(files);       else copy[name] = files && files.length === 1 ? files[0] : null;     } else {       copy[name] = value;     }     setOrgData(copy);   } else {     const copy = { ...localData };     if (type === "checkbox") copy[name] = checked;     else if (type === "file") {       if (files && files.length > 1) copy[name] = Array.from(files);       else copy[name] = files && files.length === 1 ? files[0] : null;     } else {       copy[name] = value;     }     setLocalData(copy);   }   ` 
};
 
// Species list row handlers (organization) const addSpeciesRow = () => { setOrgData((prev) => ({ ...prev, speciesList: [...prev.speciesList, { speciesName: "", countPlanted: "", plantingDensity: "", expectedSurvivalPercent: "", ageClass: "" }], })); }; const removeSpeciesRow = (i) => { setOrgData((prev) => { const s = [...prev.speciesList]; s.splice(i, 1); return { ...prev, speciesList: s }; }); }; const handleSpeciesChange = (index, e) => { const { name, value } = e.target; setOrgData((prev) => { const s = [...prev.speciesList]; s[index][name] = value; return { ...prev, speciesList: s }; }); };
 
// Validation helpers const isValidLat = (v) => { if (v === "" || v === null) return false; const n = Number(v); return !isNaN(n) && n >= -90 && n <= 90; }; const isValidLng = (v) => { if (v === "" || v === null) return false; const n = Number(v); return !isNaN(n) && n >= -180 && n <= 180; };
 
const validateLocal = () => { // required fields if (!localData.projectTitle || localData.projectTitle.length < 5) { alert("Project Title is required (5–200 chars)."); return false; } if (!localData.ownerName || localData.ownerName.length < 3) { alert("Owner Name is required (3–120 chars)."); return false; } if (!localData.ownerPhone || localData.ownerPhone.length < 7) { alert("Owner Phone is required (7–20 chars)."); return false; } if (!localData.ownerEmail) { alert("Owner Email is required."); return false; } if (!localData.ecosystemType) { alert("Ecosystem Type is required."); return false; } if (!localData.placeName || localData.placeName.length < 3) { alert("Place Name is required (3–200 chars)."); return false; } if (!isValidLat(localData.lat)) { alert("Valid Latitude is required (-90 to 90)."); return false; } if (!isValidLng(localData.lng)) { alert("Valid Longitude is required (-180 to 180)."); return false; } if (!localData.areaHa || Number(localData.areaHa) <= 0) { alert("Area (ha) must be > 0."); return false; } // photos if (!localData.photos || localData.photos.length < 2) { alert("Please upload at least 2 photos."); return false; } // check photos sizes and types for (const f of localData.photos) { if (!["image/jpeg", "image/png"].includes(f.type)) { alert("Photos must be JPG or PNG."); return false; } if (f.size > 10 * 1024 * 1024) { alert("Each photo must be <= 10 MB."); return false; } } // consent if (!localData.consent) { alert("Consent is required."); return false; } return true; };
 
const validateOrg = () => { if (!orgData.projectTitle || orgData.projectTitle.length < 5) { alert("Project Title is required (5–250 chars)."); return false; } if (!orgData.organizationName) { alert("Organization Name is required."); return false; } if (!orgData.orgContactName) { alert("Organization Contact Name is required."); return false; } if (!orgData.orgContactEmail) { alert("Organization Contact Email is required."); return false; } if (!orgData.startDate) { alert("Start Date is required."); return false; } if (!orgData.ecosystemType) { alert("Ecosystem Type is required."); return false; } if (!orgData.placeName) { alert("Place Name is required."); return false; } if (!isValidLat(orgData.lat)) { alert("Valid Latitude is required (-90 to 90)."); return false; } if (!isValidLng(orgData.lng)) { alert("Valid Longitude is required (-180 to 180)."); return false; } if (!orgData.areaHa || Number(orgData.areaHa) <= 0) { alert("Area (ha) must be > 0."); return false; } if (!orgData.methodology || orgData.methodology.trim() === "") { alert("Methodology/Standard is required."); return false; } if (!orgData.monitoringPlan || orgData.monitoringPlan.trim() === "") { alert("Monitoring Plan is required."); return false; } // species list validation: at least one species with name if (!Array.isArray(orgData.speciesList) || orgData.speciesList.length === 0 || !orgData.speciesList[0].speciesName) { alert("Please add at least one species with a name."); return false; } // photos requirement if (!orgData.photos || orgData.photos.length < 5) { alert("Please upload at least 5 photos for Organization projects."); return false; } // files size/type checks for photos (<=15MB) for (const f of orgData.photos) { if (!["image/jpeg", "image/png"].includes(f.type)) { alert("Organization photos must be JPG or PNG."); return false; } if (f.size > 15 * 1024 * 1024) { alert("Each organization photo must be <= 15 MB."); return false; } } if (!orgData.consent) { alert("Consent is required."); return false; } return true; };
 
// Submit handler const handleSubmit = async (e) => { e.preventDefault();
 `if (projectType === "Local") {     if (!validateLocal()) return;   } else {     if (!validateOrg()) return;   }    try {     const payload = new FormData();      if (projectType === "Local") {       // append simple fields       for (const key of Object.keys(localData)) {         const val = localData[key];         if (Array.isArray(val)) {           // multiple files (photos, supportingDocs)           for (const f of val) payload.append(key, f);         } else if (val instanceof File) {           payload.append(key, val);         } else if (val !== undefined && val !== null) {           payload.append(key, String(val));         }       }       payload.append("type", "local");     } else {       // organization: need to special-handle arrays and files       for (const key of Object.keys(orgData)) {         const val = orgData[key];         if (key === "speciesList") {           // append speciesList as JSON string           payload.append("speciesList", JSON.stringify(val));         } else if (Array.isArray(val)) {           for (const f of val) payload.append(key, f);         } else if (val instanceof File) {           payload.append(key, val);         } else if (val !== undefined && val !== null) {           payload.append(key, String(val));         }       }       payload.append("type", "org");     }      // POST to backend (adjust URL if needed)     const url = "/api/projects"; // change to full URL if backend on other origin     const res = await axios.post(url, payload, {       headers: { "Content-Type": "multipart/form-data" },     });      if (res.data && (res.data.success || res.status === 200)) {       alert("Project submitted successfully.");       // reset minimal state (not wiping all fields to avoid UX surprise)       if (projectType === "Local") {         setLocalData({           projectTitle: "",           ownerName: "",           ownerPhone: "",           ownerEmail: "",           ecosystemType: "Mangrove",           shortDescription: "",           placeName: "",           lat: "",           lng: "",           areaHa: "",           approxPlants: "",           startDate: "",           photos: [],           onsetImage: null,           supportingDocs: [],           hasPermit: false,           permitDoc: null,           gpsAccuracy: "",           consent: false,         });       } else {         setOrgData({           ...orgData,           photos: [],           satelliteImages: [],           labReports: [],           researchDocs: [],           permitDocs: [],           fundingDocs: [],         });       }       // redirect to homepage where cards show (optional)       // window.location.href = "/";     } else {       alert("Server responded but indicated failure.");       console.error(res.data);     }   } catch (err) {     console.error("Submit error:", err);     alert("Error submitting project. See console for details.");   }   ` 
};
 
return ( 
 
### Register Project
  <Form.Group className="mb-3"> <Form.Label>Project Type</Form.Label> <Form.Select value={projectType} onChange={(e) => setProjectType(e.target.value)}> Local Organization </Form.Select> </Form.Group>
 `    {projectType === "Local" && (         <>           <p className="text-muted">             Use this Local Project form when you are a small team, individual, or community restoring a coastal area (mangrove, seagrass, salt marsh). Provide accurate location and at least two photos.           </p>            <Form.Group className="mb-3">             <Form.Label>               Project Title *               <OverlayTrigger placement="right" overlay={tip("Short descriptive name. Example: “Ramnagar Mangrove Restoration — 2025”.")}>                 <span className="ms-2 text-info" style={{ cursor: "pointer" }}>(?)</span>               </OverlayTrigger>             </Form.Label>             <Form.Control type="text" name="projectTitle" value={localData.projectTitle} onChange={(e) => handleChange(e)} maxLength={200} required />           </Form.Group>            <Row>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Owner / Primary Contact Name *</Form.Label>                 <Form.Control type="text" name="ownerName" value={localData.ownerName} onChange={(e) => handleChange(e)} minLength={3} maxLength={120} required />               </Form.Group>             </Col>             <Col md={3}>               <Form.Group className="mb-3">                 <Form.Label>Contact Phone *</Form.Label>                 <Form.Control type="tel" name="ownerPhone" value={localData.ownerPhone} onChange={(e) => handleChange(e)} minLength={7} maxLength={20} required />               </Form.Group>             </Col>             <Col md={3}>               <Form.Group className="mb-3">                 <Form.Label>Contact Email *</Form.Label>                 <Form.Control type="email" name="ownerEmail" value={localData.ownerEmail} onChange={(e) => handleChange(e)} required />               </Form.Group>             </Col>           </Row>            <Form.Group className="mb-3">             <Form.Label>Ecosystem Type *</Form.Label>             <Form.Select name="ecosystemType" value={localData.ecosystemType} onChange={(e) => handleChange(e)} required>               <option>Mangrove</option>               <option>Seagrass</option>               <option>Salt marsh</option>               <option>Coastal mudflat</option>               <option>Coastal sediment</option>               <option>Other</option>             </Form.Select>           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Short Description </Form.Label>             <Form.Control as="textarea" rows={3} name="shortDescription" maxLength={500} value={localData.shortDescription} onChange={(e) => handleChange(e)} />           </Form.Group>            <Row>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Place Name *</Form.Label>                 <Form.Control type="text" name="placeName" value={localData.placeName} onChange={(e) => handleChange(e)} minLength={3} maxLength={200} required />               </Form.Group>             </Col>             <Col md={3}>               <Form.Group className="mb-3">                 <Form.Label>Latitude *</Form.Label>                 <Form.Control type="number" name="lat" value={localData.lat} onChange={(e) => handleChange(e)} step="0.0001" min={-90} max={90} required />               </Form.Group>             </Col>             <Col md={3}>               <Form.Group className="mb-3">                 <Form.Label>Longitude *</Form.Label>                 <Form.Control type="number" name="lng" value={localData.lng} onChange={(e) => handleChange(e)} step="0.0001" min={-180} max={180} required />               </Form.Group>             </Col>           </Row>            <Row>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Area (hectares) *</Form.Label>                 <Form.Control type="number" name="areaHa" value={localData.areaHa} onChange={(e) => handleChange(e)} step="0.01" min={0.01} required />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Approx. number of plants (optional)</Form.Label>                 <Form.Control type="number" name="approxPlants" value={localData.approxPlants} onChange={(e) => handleChange(e)} min={1} />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Start Date </Form.Label>                 <Form.Control type="date" name="startDate" value={localData.startDate} onChange={(e) => handleChange(e)} />               </Form.Group>             </Col>           </Row>            <Form.Group className="mb-3">             <Form.Label>               Photos (at least 2) *               <OverlayTrigger placement="right" overlay={tip("Upload clear images (.jpg/.png), max 10 MB each. At least one wide shot and one close-up recommended.")}>                 <span className="ms-2 text-info" style={{ cursor: "pointer" }}>(?)</span>               </OverlayTrigger>             </Form.Label>             <Form.Control type="file" name="photos" multiple accept="image/jpeg,image/png" onChange={(e) => handleChange(e)} required />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Onset Image (optional)</Form.Label>             <Form.Control type="file" name="onsetImage" accept="image/*,application/pdf" onChange={(e) => handleChange(e)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Supporting Documents (optional)</Form.Label>             <Form.Control type="file" name="supportingDocs" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleChange(e)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Check type="checkbox" label="Local Permissions / Permit (check if available)" name="hasPermit" checked={localData.hasPermit} onChange={(e) => handleChange(e)} />             {localData.hasPermit && (               <div className="mt-2">                 <Form.Label>Upload Permit Document</Form.Label>                 <Form.Control type="file" name="permitDoc" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleChange(e)} />               </div>             )}           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>GPS Accuracy (meters) (optional)</Form.Label>             <Form.Control type="number" name="gpsAccuracy" value={localData.gpsAccuracy} onChange={(e) => handleChange(e)} step="0.1" min="0" />           </Form.Group>            <Form.Group className="mb-3">             <Form.Check type="checkbox" name="consent" checked={localData.consent} onChange={(e) => handleChange(e)} label="I confirm the information is true and I have the right to upload these files. *" />           </Form.Group>         </>       )}        {projectType === "Organization" && (         <>           <p className="text-muted">             Use Organization Project Registration for NGO, company, government or community projects that seek formal verification and carbon credit issuance.           </p>            <Form.Group className="mb-3">             <Form.Label>Project Title *</Form.Label>             <Form.Control type="text" name="projectTitle" value={orgData.projectTitle} onChange={(e) => handleChange(e, true)} required />           </Form.Group>            <Row>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Project External ID (optional)</Form.Label>                 <Form.Control type="text" name="projectExternalId" value={orgData.projectExternalId} onChange={(e) => handleChange(e, true)} />               </Form.Group>             </Col>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Organization Name *</Form.Label>                 <Form.Control type="text" name="organizationName" value={orgData.organizationName} onChange={(e) => handleChange(e, true)} required />               </Form.Group>             </Col>           </Row>            <Row>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Organization Contact Person *</Form.Label>                 <Form.Control type="text" name="orgContactName" value={orgData.orgContactName} onChange={(e) => handleChange(e, true)} required />               </Form.Group>             </Col>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Contact Email *</Form.Label>                 <Form.Control type="email" name="orgContactEmail" value={orgData.orgContactEmail} onChange={(e) => handleChange(e, true)} required />               </Form.Group>             </Col>           </Row>            <Row>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Contact Phone (optional)</Form.Label>                 <Form.Control type="text" name="orgContactPhone" value={orgData.orgContactPhone} onChange={(e) => handleChange(e, true)} />               </Form.Group>             </Col>             <Col md={6}>               <Form.Group className="mb-3">                 <Form.Label>Organization Registration Number (optional)</Form.Label>                 <Form.Control type="text" name="orgRegistrationNumber" value={orgData.orgRegistrationNumber} onChange={(e) => handleChange(e, true)} />               </Form.Group>             </Col>           </Row>            <Form.Group className="mb-3">             <Form.Label>Organization Address (optional)</Form.Label>             <Form.Control type="text" name="orgAddress" value={orgData.orgAddress} onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Row>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Start Date *</Form.Label>                 <Form.Control type="date" name="startDate" value={orgData.startDate} onChange={(e) => handleChange(e, true)} required />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Base Date (optional)</Form.Label>                 <Form.Control type="date" name="baseDate" value={orgData.baseDate} onChange={(e) => handleChange(e, true)} />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Check type="checkbox" name="ongoing" checked={orgData.ongoing} onChange={(e) => handleChange(e, true)} label="Ongoing project" />               </Form.Group>             </Col>           </Row>            {!orgData.ongoing && (             <Form.Group className="mb-3">               <Form.Label>End Date</Form.Label>               <Form.Control type="date" name="endDate" value={orgData.endDate} onChange={(e) => handleChange(e, true)} />             </Form.Group>           )}            <Form.Group className="mb-3">             <Form.Label>Place Name *</Form.Label>             <Form.Control type="text" name="placeName" value={orgData.placeName} onChange={(e) => handleChange(e, true)} required />           </Form.Group>            <Row>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Latitude *</Form.Label>                 <Form.Control type="number" name="lat" value={orgData.lat} onChange={(e) => handleChange(e, true)} step="0.0001" min={-90} max={90} required />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Longitude *</Form.Label>                 <Form.Control type="number" name="lng" value={orgData.lng} onChange={(e) => handleChange(e, true)} step="0.0001" min={-180} max={180} required />               </Form.Group>             </Col>             <Col md={4}>               <Form.Group className="mb-3">                 <Form.Label>Area (ha) *</Form.Label>                 <Form.Control type="number" name="areaHa" value={orgData.areaHa} onChange={(e) => handleChange(e, true)} step="0.01" min={0.01} required />               </Form.Group>             </Col>           </Row>            <Form.Group className="mb-3">             <Form.Label>               Boundary File (GeoJSON/KML) (recommended)               <OverlayTrigger placement="right" overlay={tip("Upload GeoJSON, KML, or JSON polygon (max 20 MB). If not available provide centroid + area.")}>                 <span className="ms-2 text-info" style={{ cursor: "pointer" }}>(?)</span>               </OverlayTrigger>             </Form.Label>             <Form.Control type="file" name="geoBoundaryFile" accept=".geojson,.json,.kml,.zip" onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Ecosystem Type *</Form.Label>             <Form.Select name="ecosystemType" value={orgData.ecosystemType} onChange={(e) => handleChange(e, true)} required>               <option>Mangrove</option>               <option>Seagrass</option>               <option>Salt marsh</option>               <option>Coastal sediment</option>               <option>Other</option>             </Form.Select>           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Methodology / Standard *</Form.Label>             <Form.Control as="textarea" rows={3} name="methodology" value={orgData.methodology} onChange={(e) => handleChange(e, true)} required />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Species List (at least one)</Form.Label>             {orgData.speciesList.map((s, idx) => (               <Row key={idx} className="mb-2 align-items-end">                 <Col md={3}>                   <Form.Control placeholder="Species name" name="speciesName" value={s.speciesName} onChange={(e) => handleSpeciesChange(idx, e)} required={idx === 0} />                 </Col>                 <Col md={2}>                   <Form.Control placeholder="Count planted" type="number" name="countPlanted" value={s.countPlanted} onChange={(e) => handleSpeciesChange(idx, e)} min={0} />                 </Col>                 <Col md={2}>                   <Form.Control placeholder="Density" name="plantingDensity" value={s.plantingDensity} onChange={(e) => handleSpeciesChange(idx, e)} />                 </Col>                 <Col md={2}>                   <Form.Control placeholder="Survival %" name="expectedSurvivalPercent" type="number" value={s.expectedSurvivalPercent} onChange={(e) => handleSpeciesChange(idx, e)} min={0} max={100} />                 </Col>                 <Col md={2}>                   <Form.Control placeholder="Age class" name="ageClass" value={s.ageClass} onChange={(e) => handleSpeciesChange(idx, e)} />                 </Col>                 <Col md={1}>                   {idx === 0 ? (                     <Button variant="success" size="sm" onClick={addSpeciesRow}>+</Button>                   ) : (                     <Button variant="danger" size="sm" onClick={() => removeSpeciesRow(idx)}>-</Button>                   )}                 </Col>               </Row>             ))}           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Monitoring Plan *</Form.Label>             <Form.Control as="textarea" rows={3} name="monitoringPlan" value={orgData.monitoringPlan} onChange={(e) => handleChange(e, true)} required />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Photos (min 5) *</Form.Label>             <Form.Control type="file" multiple accept="image/jpeg,image/png" name="photos" onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Satellite Images (optional)</Form.Label>             <Form.Control type="file" multiple accept=".tif,image/jpeg" name="satelliteImages" onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Lab Reports (optional)</Form.Label>             <Form.Control type="file" multiple accept=".pdf,.doc,.docx" name="labReports" onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Label>Permits / Legal Docs (if any)</Form.Label>             <Form.Control type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" name="permitDocs" onChange={(e) => handleChange(e, true)} />           </Form.Group>            <Form.Group className="mb-3">             <Form.Check type="checkbox" name="consent" checked={orgData.consent} onChange={(e) => handleChange(e, true)} label="I confirm the information is true and I have the right to upload these files and to anchor the project JSON hash to blockchain. *" />           </Form.Group>         </>       )}        <div className="d-flex gap-2">         <Button type="submit" variant="primary">Submit Project</Button>         <Button type="button" variant="secondary" onClick={() => { window.location.href = "/"; }}>Cancel</Button>       </div>     </Form>   </div>   ` 
); };
 
export default RegisterForm;
 
Think and give no error code ,make sure for all syntax with absolute accuracy.


Fix the code and return the modified code with all I asked, and it should run with our homepage after linking and give only 1 files code, and with no error or dependent. 
Again we are using react, bootstrap.
Not backend yet.
Thought for 38s
I'll create a single enhanced src/RegisterForm.js that implements all requested Local + Organization form features (autosave, per-field red errors, hold-to-show tooltips, Leaflet map/GPS, plant type logic, MRV ranges, animations, success overlay), with no backend calls. Then I'll provide minimal install and linking instructions.

Updated todo list 2 times and thought for 49s
Status: I completed a single-file RegisterForm.js implementing Local + Organization forms with autosave, per-field red validation, hold-to-show tooltips, Leaflet map picker and GPS, org plant-type checkboxes with conditional counts and research-doc requirement when >2 selected, MRV ranges, animations, and a thank-you overlay redirect. Now I'll provide the file and minimal install/use steps.

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

// IMPORTANT: ensure bootstrap CSS is imported in your src/index.jsx:
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
const PHONE_REGEX = /^\+?[0-9\-() ]{7,20}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MAX_LOCAL_PHOTO_MB = 10;
const MAX_ORG_PHOTO_MB = 15;
const MAX_DOC_MB = 20;
const MAX_BOUNDARY_MB = 20;

const useDebouncedEffect = (effect, deps, delay = 600) => {
  const cleanupRef = useRef(null);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = effect();
    }, delay);
    return () => clearTimeout(handler);
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
  const [tempLat, setTempLat] = useState(initialLat || 20.5937);
  const [tempLng, setTempLng] = useState(initialLng || 78.9629);

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
              initialLat != null ? Number(initialLat) : 20.5937,
              initialLng != null ? Number(initialLng) : 78.9629,
            ],
            zoom: initialLat != null ? 13 : 5,
          });
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
          }).addTo(mapRef.current);

          if (initialLat != null && initialLng != null) {
            markerRef.current = window.L.marker([
              Number(initialLat),
              Number(initialLng),
            ]).addTo(mapRef.current);
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
                value={tempLat ?? ""}
                onChange={(e) => setTempLat(e.target.value)}
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
                value={tempLng ?? ""}
                onChange={(e) => setTempLng(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-primary" onClick={useDeviceGPS}>Use My GPS</Button>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (tempLat == null || tempLng == null) return;
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

const RegisterForm = () => {
  const [projectType, setProjectType] = useState("Local");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");
  const [autosaveStamp, setAutosaveStamp] = useState(null);
  const [showMapFor, setShowMapFor] = useState(null); // 'local' | 'org' | null

  // Local form state
  const [localData, setLocalData] = useState({
    projectTitle: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ecosystemType: "Mangrove",
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

  // Organization form state
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
    ecosystemType: "Mangrove",
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
  });
  const [orgErrors, setOrgErrors] = useState({});

  // Load draft
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

  const setLocalField = (name, value) =>
    setLocalData((prev) => ({ ...prev, [name]: value }));
  const setOrgField = (name, value) =>
    setOrgData((prev) => ({ ...prev, [name]: value }));

  // Autosave
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

  // Change handler
  const handleChange = (e, isOrg = false) => {
    const { name, type, checked, value, files, multiple } = e.target;
    const setter = isOrg ? setOrgData : setLocalData;
    setter((prev) => {
      const copy = { ...prev };
      if (type === "checkbox") {
        copy[name] = checked;
      } else if (type === "file") {
        if (multiple) copy[name] = files ? Array.from(files) : [];
        else copy[name] = files && files.length === 1 ? files[0] : null;
      } else {
        copy[name] = value;
      }
      return copy;
    });
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

  // Org plant type logic
  const togglePlantType = (key) => {
    setOrgData((prev) => ({
      ...prev,
      plantTypes: { ...prev.plantTypes, [key]: !prev.plantTypes[key] },
    }));
  };
  const selectedPlantTypeCount = useMemo(() => {
    const p = orgData.plantTypes || {};
    return ["mangroves", "seagrasses", "tidalMarshes"].reduce(
      (acc, k) => acc + (p[k] ? 1 : 0),
      0
    );
  }, [orgData.plantTypes]);

  // GPS
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

  // Validate Local
  const validateLocal = () => {
    const errs = {};
    const d = localData;

    if (!d.projectTitle || d.projectTitle.trim().length < 5)
      errs.projectTitle = "5–200 characters required.";
    if (!d.ownerName || d.ownerName.trim().length < 3)
      errs.ownerName = "3–120 characters required.";
    if (!d.ownerPhone || !PHONE_REGEX.test(d.ownerPhone))
      errs.ownerPhone = "Enter valid phone (7–20 chars, country code allowed).";
    if (!d.ownerEmail || !EMAIL_REGEX.test(d.ownerEmail))
      errs.ownerEmail = "Enter valid email address.";
    if (!d.ecosystemType) errs.ecosystemType = "Please select an ecosystem.";
    if (!d.country) errs.country = "Country is required.";
    if (!d.placeName || d.placeName.trim().length < 3)
      errs.placeName = "3–200 characters required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!Array.isArray(d.photos) || d.photos.length < 2) {
      errs.photos = "Upload at least 2 photos (JPG/PNG, <= 10 MB each).";
    } else {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (f.size > MAX_LOCAL_PHOTO_MB * 1024 * 1024) {
          errs.photos = `Each photo must be <= ${MAX_LOCAL_PHOTO_MB} MB.`;
          break;
        }
      }
    }

    if (!d.consent) errs.consent = "You must confirm to submit this form.";
    return errs;
  };

  // Validate Org
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
    if (d.orgContactPhone && !PHONE_REGEX.test(d.orgContactPhone))
      errs.orgContactPhone = "Enter a valid phone number.";
    if (d.ownerWallet && !WALLET_REGEX.test(d.ownerWallet))
      errs.ownerWallet = "Invalid Ethereum address (0x + 40 hex).";

    if (!d.startDate) errs.startDate = "Start Date is required.";
    if (!d.ongoing && !d.endDate) errs.endDate = "Provide End Date or mark Ongoing.";

    if (!d.placeName) errs.placeName = "Place Name is required.";
    if (!d.country) errs.country = "Country is required.";
    if (!isValidLat(d.lat)) errs.lat = "Latitude must be -90 to 90.";
    if (!isValidLng(d.lng)) errs.lng = "Longitude must be -180 to 180.";
    if (!positive(d.areaHa)) errs.areaHa = "Area (ha) must be > 0.";

    if (!d.ecosystemType) errs.ecosystemType = "Ecosystem Type is required.";
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
    }

    if (Array.isArray(d.photos)) {
      for (const f of d.photos) {
        if (!["image/jpeg", "image/png"].includes(f.type)) {
          errs.photos = "Photos must be JPG or PNG.";
          break;
        }
        if (f.size > MAX_ORG_PHOTO_MB * 1024 * 1024) {
          errs.photos = `Each photo must be <= ${MAX_ORG_PHOTO_MB} MB.`;
          break;
        }
      }
    }
    if (Array.isArray(d.satelliteImages)) {
      for (const f of d.satelliteImages) {
        const name = (f.name || "").toLowerCase();
        const typeOk = ["image/tiff", "image/tif", "image/jpeg", "image/jpg", "image/png"].includes(f.type);
        const extOk = name.endsWith(".tif") || name.endsWith(".tiff") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
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
      errs.soilOrganicCarbonPercent = "SOC% should be between 0 and 60.";
    if (d.waterSalinityPsu && !within(d.waterSalinityPsu, 0, 40))
      errs.waterSalinityPsu = "Salinity should be 0–40 PSU.";
    if (d.waterPh && !within(d.waterPh, 5, 9))
      errs.waterPh = "Water pH should be between 5 and 9.";

    if (!d.consent)
      errs.consent = "You must confirm to submit this form.";

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
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
    } else if (projectType === "Organization") {
      const errs = validateOrg();
      setOrgErrors(errs);
      setSubmitting(false);
      if (Object.keys(errs).length) {
        setErrorSummary("Please fix the highlighted fields below.");
        scrollToFirstError(errs);
        return;
      }
    }

    // Success animation and redirect (no backend)
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

  const nowSaved = autosaveStamp ? new Date(autosaveStamp).toLocaleTimeString() : null;

  return (
    <div className="container py-4">
      <style>{`
        .bg-gradient-1 { background: linear-gradient(135deg, #4f46e5, #0ea5e9); }
        .card-neo {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,0.08);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .card-neo:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(2,6,23,0.12); }
        .animate-in { animation: fadeUp .5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .section {
          padding: 16px; border-radius: 12px; border: 1px dashed rgba(99,102,241,0.3);
          background: linear-gradient(0deg, rgba(99,102,241,0.06), rgba(14,165,233,0.05));
          margin-bottom: 16px;
        }
        .hr-fade { height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0.1), rgba(0,0,0,0)); }
        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .success-card {
          background: #fff; padding: 24px 28px; border-radius: 16px; text-align: center;
          animation: popIn .35s ease both;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1); } }
        .checkmark {
          width: 64px; height: 64px; border-radius: 50%; background: #10b981;
          display: inline-flex; align-items: center; justify-content: center; color: white;
          font-size: 38px; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.4); animation: pulse 0.9s ease 1;
        }
        @keyframes pulse { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .hold-tip-wrapper { position: relative; display: inline-block; }
        .hold-tip-trigger { color: #0ea5e9; margin-left: 6px; cursor: pointer; user-select: none; }
        .hold-tip-bubble {
          position: absolute; top: -8px; left: 20px; min-width: 220px; max-width: 320px;
          background: #0ea5e9; color: white; padding: 8px 10px; border-radius: 8px; font-size: 12px;
          box-shadow: 0 6px 14px rgba(14,165,233,0.35); animation: tipFade .2s ease both;
        }
        @keyframes tipFade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
        .red-note { color: #dc2626; font-size: 0.875rem; margin-top: 4px; }
      `}</style>

      <Card className="card-neo animate-in">
        <Card.Header className="bg-gradient-1 text-white">
          <div className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0">Register Project</h4>
            {nowSaved && (
              <span className="small">
                Autosaved at <Badge bg="light" text="dark">{nowSaved}</Badge>
              </span>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <div className="mb-3">
              <Form.Label>
                Project Type{" "}
                <HoldTip text="Choose Local for individuals/small teams. Choose Organization for full verification and carbon credit workflow." />
              </Form.Label>
              <Form.Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
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
                <div className="section animate-in">
                  <p className="mb-2">
                    <strong>Use this Local Project form</strong> when you are a small team,
                    individual, or community restoring a coastal area (mangrove, seagrass,
                    salt marsh). This form collects essential data to create a verifiable
                    project record. Drafts save automatically.
                  </p>
                  <div className="text-muted small">
                    Lightweight record: owner identity, location and size, ecosystem type,
                    minimal evidence (photos), short description. Not for immediate carbon
                    credit minting.
                  </div>
                </div>

                <SectionTitle>Project Details</SectionTitle>
                <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Contact Phone *
                        <HoldTip text="Enter reachable number, preferably with country code. 7–20 digits." />
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="ownerPhone"
                        value={localData.ownerPhone}
                        onChange={handleChange}
                        isInvalid={!!localErrors.ownerPhone}
                        data-err="ownerPhone"
                        placeholder="+91-XXXXXXXXXX"
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

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Ecosystem Type *
                        <HoldTip text="Choose the ecosystem that best describes the project site." />
                      </Form.Label>
                      <Form.Select
                        name="ecosystemType"
                        value={localData.ecosystemType}
                        onChange={handleChange}
                        isInvalid={!!localErrors.ecosystemType}
                        data-err="ecosystemType"
                      >
                        {ECOSYSTEM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Form.Select>
                      {localErrors.ecosystemType && (
                        <div className="red-note">{localErrors.ecosystemType}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
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
                  </Col>
                </Row>

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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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

                <SectionTitle>Evidence</SectionTitle>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Photos (at least 2) *
                    <HoldTip text="Upload clear JPG/PNG images (<=10MB each). Include a wide shot and a close-up; GPS-tag helps." />
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="photos"
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
                      <Form.Label>
                        Onset Image (optional)
                        <HoldTip text="Planting day image or PDF note (optional)." />
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="onsetImage"
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleChange}
                      />
                      <FileHints text="Max 20MB each." />
                    </Form.Group>
                  </Col>
                </Row>

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
              </>
            )}

            {projectType === "Organization" && (
              <>
                <div className="section animate-in">
                  <p className="mb-2">
                    <strong>Use Organization Project Registration</strong> for NGO, company,
                    government or community projects that seek formal verification and carbon
                    credit issuance. Provide thorough evidence, GPS boundaries, monitoring plans,
                    and lab reports where available.
                  </p>
                </div>

                <SectionTitle>A. Administrative & Identification</SectionTitle>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
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
                      <Form.Label>Contact Phone (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="orgContactPhone"
                        value={orgData.orgContactPhone}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.orgContactPhone}
                        data-err="orgContactPhone"
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

                <SectionTitle>B. Project Time & Status</SectionTitle>
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

                <SectionTitle>C. Location & Spatial Data</SectionTitle>
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

                <SectionTitle>D. Technical & MRV</SectionTitle>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ecosystem Type *</Form.Label>
                      <Form.Select
                        name="ecosystemType"
                        value={orgData.ecosystemType}
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.ecosystemType}
                        data-err="ecosystemType"
                      >
                        {ECOSYSTEM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Form.Select>
                      {orgErrors.ecosystemType && (
                        <div className="red-note">{orgErrors.ecosystemType}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={8}>
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
                </Row>
                <Form.Group className="mb-3">
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

                <SectionTitle>E. Planting & Biological Data</SectionTitle>
                <div className="mb-2">
                  <div className="mb-1">
                    Select Plant Types (checkbox, multi-select){" "}
                    <HoldTip text="Choose plant categories. If you select more than two, you must provide counts for each and upload a research report." />
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Mangroves"
                      checked={orgData.plantTypes.mangroves}
                      onChange={() => togglePlantType("mangroves")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Seagrasses"
                      checked={orgData.plantTypes.seagrasses}
                      onChange={() => togglePlantType("seagrasses")}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Tidal Marshes"
                      checked={orgData.plantTypes.tidalMarshes}
                      onChange={() => togglePlantType("tidalMarshes")}
                    />
                  </div>
                  {orgErrors.plantTypes && (
                    <div className="red-note" data-err="plantTypes">
                      {orgErrors.plantTypes}
                    </div>
                  )}
                </div>

                {selectedPlantTypeCount > 2 && (
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

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
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
                    <Form.Group className="mb-3">
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

                <SectionTitle>G. Evidence Files</SectionTitle>
                <Form.Group className="mb-3">
                  <Form.Label>High-resolution Photos *</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    name="photos"
                    onChange={(e) => handleChange(e, true)}
                    isInvalid={!!orgErrors.photos}
                    data-err="photos"
                  />
                  {orgErrors.photos && <div className="red-note">{orgErrors.photos}</div>}
                  <FileHints text={`JPG/PNG, <= ${MAX_ORG_PHOTO_MB}MB each. Provide onset + monitoring images.`} />
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
                        onChange={(e) => handleChange(e, true)}
                        isInvalid={!!orgErrors.satelliteImages}
                        data-err="s
atelliteImages"
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
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Research Documents {selectedPlantTypeCount > 2 ? "(required)" : "(optional)"}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        name="researchDocs"
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
                        onChange={(e) => handleChange(e, true)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
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
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form.Group>

                <SectionTitle>H–L. Additional Fields</SectionTitle>
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
              </>
            )}

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
                    if (projectType === "Local") {
                      localStorage.setItem(
                        "registerForm.local",
                        JSON.stringify(localData)
                      );
                    } else {
                      localStorage.setItem(
                        "registerForm.org",
                        JSON.stringify(orgData)
                      );
                    }
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
