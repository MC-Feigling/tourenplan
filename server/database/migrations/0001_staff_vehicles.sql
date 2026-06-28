CREATE TABLE IF NOT EXISTS "staff_members" (
  "id" text PRIMARY KEY NOT NULL,
  "depot_id" text,
  "user_id" text,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "phone" text DEFAULT '' NOT NULL,
  "email" text DEFAULT '' NOT NULL,
  "job_role" text DEFAULT 'driver' NOT NULL,
  "license_classes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "qualifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "employment_type" text DEFAULT 'full' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  "updated_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "staff_members_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "depots"("id") ON DELETE set null,
  CONSTRAINT "staff_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "leave_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "staff_member_id" text NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "type" text DEFAULT 'vacation' NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "leave_requests_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" text PRIMARY KEY NOT NULL,
  "depot_id" text,
  "plate_number" text NOT NULL,
  "name" text NOT NULL,
  "seats" integer NOT NULL,
  "vehicle_class" text DEFAULT 'coach' NOT NULL,
  "status" text DEFAULT 'available' NOT NULL,
  "features" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "tacho_type" text DEFAULT 'none' NOT NULL,
  "next_inspection_date" text,
  "next_maintenance_km" integer,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  "updated_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "vehicles_plate_number_unique" UNIQUE("plate_number"),
  CONSTRAINT "vehicles_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "depots"("id") ON DELETE set null
);
