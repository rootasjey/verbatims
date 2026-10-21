ALTER TABLE user_messages ADD COLUMN subject TEXT;
--> statement-breakpoint
ALTER TABLE user_messages ADD COLUMN theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE user_messages ADD COLUMN image_variant TEXT;
--> statement-breakpoint
ALTER TABLE user_messages ADD COLUMN reported_image_url TEXT;
