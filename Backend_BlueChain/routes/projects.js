// server/routes/projects.js
// Express router to save Local/Org submissions + files. Uses multer to /uploads.
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db");

const router = express.Router();

// ensure uploads dir (relative to server CWD)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
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

router.get("/", async (req, res) => {
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
