CREATE TABLE IF NOT EXISTS "line_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "depot_id" text,
  "name" text NOT NULL,
  "line_length_km" integer NOT NULL,
  "weekdays" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "default_departure_time" text DEFAULT '06:00' NOT NULL,
  "default_stops" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  "updated_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "line_templates_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "depots"("id") ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "tours" (
  "id" text PRIMARY KEY NOT NULL,
  "depot_id" text,
  "type" text NOT NULL,
  "name" text NOT NULL,
  "date" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "compliance_profile" text NOT NULL,
  "line_length_km" integer,
  "line_template_id" text,
  "vehicle_id" text,
  "driver_id" text,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  "updated_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "tours_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "depots"("id") ON DELETE set null,
  CONSTRAINT "tours_line_template_id_line_templates_id_fk" FOREIGN KEY ("line_template_id") REFERENCES "line_templates"("id") ON DELETE set null,
  CONSTRAINT "tours_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE set null,
  CONSTRAINT "tours_driver_id_staff_members_id_fk" FOREIGN KEY ("driver_id") REFERENCES "staff_members"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "tours_date_idx" ON "tours" ("date");

CREATE TABLE IF NOT EXISTS "tour_stops" (
  "id" text PRIMARY KEY NOT NULL,
  "tour_id" text NOT NULL,
  "sequence" integer NOT NULL,
  "location_name" text NOT NULL,
  "address" text DEFAULT '' NOT NULL,
  "lat" text,
  "lng" text,
  "planned_arrival" text NOT NULL,
  "planned_departure" text NOT NULL,
  "stop_type" text DEFAULT 'pickup' NOT NULL,
  "driving_minutes_from_prev" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "tour_stops_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "tour_stops_tour_id_idx" ON "tour_stops" ("tour_id");
