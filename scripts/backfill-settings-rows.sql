-- Split the pre-split single-document settings row into one row per setting.
--
-- Run after the code that reads per-section rows is deployed, then check the
-- result before running the DELETE at the bottom of this file:
--
--   npx wrangler d1 execute tissu-dubai --remote --file=scripts/backfill-settings-rows.sql
--
-- Expect 14 rows: contact, homepage.hero, 3 collection cards, 2 gender cards
-- and 7 days of opening hours. FAQ is not here; it already lives in its own
-- table (scripts/backfill-faqs.sql).
--
-- json_extract returns each sub-object as JSON text, so it can be stored
-- straight back into the value column.

INSERT OR REPLACE INTO site_settings (key, value)
SELECT 'contact', json_extract(s.value, '$.contact')
FROM site_settings AS s
WHERE s.key = 'site' AND json_extract(s.value, '$.contact') IS NOT NULL;

INSERT OR REPLACE INTO site_settings (key, value)
SELECT 'homepage.hero', json_extract(s.value, '$.homepage.hero')
FROM site_settings AS s
WHERE s.key = 'site' AND json_extract(s.value, '$.homepage.hero') IS NOT NULL;

-- Keyed by the card's own id so the row name matches what store.ts writes.
INSERT OR REPLACE INTO site_settings (key, value)
SELECT 'homepage.collection_cards.' || json_extract(card.value, '$.id'), card.value
FROM site_settings AS s, json_each(s.value, '$.homepage.collectionCards') AS card
WHERE s.key = 'site' AND json_extract(card.value, '$.id') IS NOT NULL;

INSERT OR REPLACE INTO site_settings (key, value)
SELECT 'homepage.gender_cards.' || json_extract(card.value, '$.id'), card.value
FROM site_settings AS s, json_each(s.value, '$.homepage.genderCards') AS card
WHERE s.key = 'site' AND json_extract(card.value, '$.id') IS NOT NULL;

INSERT OR REPLACE INTO site_settings (key, value)
SELECT 'business_hours.' || json_extract(day.value, '$.day'), day.value
FROM site_settings AS s, json_each(s.value, '$.businessHours') AS day
WHERE s.key = 'site' AND json_extract(day.value, '$.day') IS NOT NULL;

-- Only run this once the 14 rows above are verified. The single-document row is
-- the one thing the user asked to get rid of, and after this the application
-- code drops it on every save as well.
-- DELETE FROM site_settings WHERE key = 'site';
