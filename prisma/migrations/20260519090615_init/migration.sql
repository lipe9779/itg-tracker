-- CreateTable
CREATE TABLE "TrackingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_input" TEXT NOT NULL,
    "input_type" TEXT NOT NULL,
    "detected_carrier" TEXT,
    "carrier_confidence_score" REAL,
    "status" TEXT NOT NULL,
    "error_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrackingResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tracking_request_id" TEXT NOT NULL,
    "carrier_name" TEXT NOT NULL,
    "container_number" TEXT,
    "bill_of_lading_number" TEXT,
    "vessel_name" TEXT,
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "etd" DATETIME,
    "eta" DATETIME,
    "current_status" TEXT,
    "last_event_location" TEXT,
    "last_event_date" DATETIME,
    "source_type" TEXT NOT NULL,
    "source_url" TEXT,
    "raw_response_json" TEXT,
    "confidence_score" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "TrackingResult_tracking_request_id_fkey" FOREIGN KEY ("tracking_request_id") REFERENCES "TrackingRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carrier_name" TEXT NOT NULL,
    "carrier_code" TEXT,
    "scac_code" TEXT,
    "tracking_url" TEXT,
    "api_available" BOOLEAN NOT NULL DEFAULT false,
    "api_documentation_url" TEXT,
    "parser_strategy" TEXT,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_carrier_name_key" ON "Carrier"("carrier_name");
