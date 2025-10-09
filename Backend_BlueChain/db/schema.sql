-- Backend_BlueChain/db/schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  city TEXT,
  country TEXT,
  category TEXT,
  id_note TEXT,
  password_hash TEXT NOT NULL,
  user_uid TEXT NOT NULL UNIQUE,
  recovery_words_hash TEXT
);

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
  kind TEXT NOT NULL,
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
  kind TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT
);
