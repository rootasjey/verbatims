ALTER TABLE authors ADD COLUMN birth_year INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN birth_era TEXT DEFAULT 'ce';
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN birth_month INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN birth_day INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN birth_is_approximate INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN birth_calendar TEXT DEFAULT 'gregorian-proleptic';
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_year INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_era TEXT DEFAULT 'ce';
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_month INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_day INTEGER;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_is_approximate INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE authors ADD COLUMN death_calendar TEXT DEFAULT 'gregorian-proleptic';
--> statement-breakpoint
UPDATE authors SET birth_year = CAST(substr(birth_date, 1, 4) AS INTEGER), birth_month = CASE WHEN length(birth_date) >= 7 AND substr(birth_date, 6, 2) GLOB '[0-9][0-9]' THEN CAST(substr(birth_date, 6, 2) AS INTEGER) END, birth_day = CASE WHEN length(birth_date) >= 10 AND substr(birth_date, 9, 2) GLOB '[0-9][0-9]' THEN CAST(substr(birth_date, 9, 2) AS INTEGER) END WHERE birth_date GLOB '[0-9][0-9][0-9][0-9]*';
--> statement-breakpoint
UPDATE authors SET death_year = CAST(substr(death_date, 1, 4) AS INTEGER), death_month = CASE WHEN length(death_date) >= 7 AND substr(death_date, 6, 2) GLOB '[0-9][0-9]' THEN CAST(substr(death_date, 6, 2) AS INTEGER) END, death_day = CASE WHEN length(death_date) >= 10 AND substr(death_date, 9, 2) GLOB '[0-9][0-9]' THEN CAST(substr(death_date, 9, 2) AS INTEGER) END WHERE death_date GLOB '[0-9][0-9][0-9][0-9]*';
