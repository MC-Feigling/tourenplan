CREATE TABLE IF NOT EXISTS "depots" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "address" text DEFAULT '' NOT NULL,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "display_name" text NOT NULL,
  "role" text DEFAULT 'driver' NOT NULL,
  "depot_id" text,
  "created_at" integer DEFAULT floor(extract(epoch from now()))::integer NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "depots"("id") ON DELETE set null
);
