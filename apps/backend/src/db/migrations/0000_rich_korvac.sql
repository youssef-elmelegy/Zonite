CREATE TYPE "public"."game_mode_enum" AS ENUM('SOLO', 'TEAM');--> statement-breakpoint
CREATE TYPE "public"."match_outcome_enum" AS ENUM('WIN', 'LOSS', 'DRAW');--> statement-breakpoint
CREATE TYPE "public"."player_status_enum" AS ENUM('WAITING', 'READY', 'LEFT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"username" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"otp" text,
	"otp_expires_at" timestamp with time zone,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"profile_image" text,
	"level" integer DEFAULT 1 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_blocks_mined" integer DEFAULT 0 NOT NULL,
	"total_matches_played" integer DEFAULT 0 NOT NULL,
	"current_win_streak" integer DEFAULT 0 NOT NULL,
	"date_of_birth" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'LOBBY' NOT NULL,
	"host_user_id" uuid NOT NULL,
	"game_mode" "game_mode_enum" DEFAULT 'SOLO' NOT NULL,
	"grid_size" integer DEFAULT 12 NOT NULL,
	"duration_seconds" integer DEFAULT 60 NOT NULL,
	"max_players" integer DEFAULT 6 NOT NULL,
	"tournament_id" text,
	"round_number" integer,
	"tournament_roster" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	CONSTRAINT "rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "match_player_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" uuid,
	"player_status" "player_status_enum" NOT NULL,
	"selected_color" integer,
	"game_mode" "game_mode_enum" NOT NULL,
	"grid_size" integer NOT NULL,
	"outcome" "match_outcome_enum" NOT NULL,
	"blocks_claimed" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_records" ADD CONSTRAINT "match_player_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_records" ADD CONSTRAINT "match_player_records_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_otp_expires_at_idx" ON "users" USING btree ("otp_expires_at");--> statement-breakpoint
CREATE INDEX "rooms_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rooms_host_user_id_idx" ON "rooms" USING btree ("host_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_tournament_round_unique" ON "rooms" USING btree ("tournament_id","round_number") WHERE "rooms"."tournament_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "match_player_records_user_played_at_idx" ON "match_player_records" USING btree ("user_id","played_at");--> statement-breakpoint
CREATE INDEX "match_player_records_room_id_idx" ON "match_player_records" USING btree ("room_id");