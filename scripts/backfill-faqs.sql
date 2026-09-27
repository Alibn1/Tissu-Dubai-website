-- Backfill the faqs table from the questions still inside the site_settings blob.
--
-- Run once, after migrations/0002_faqs.sql, on each backend:
--   npx wrangler d1 execute tissu-dubai --remote --file scripts/backfill-faqs.sql
--
-- Safe to re-run: existing rows are left alone by ON CONFLICT DO NOTHING. The
-- blob keeps its copy until the next saveSiteSettings() call rewrites it without
-- the faq key, so nothing is lost if this is run twice.
--
-- entry.key is the array index, which becomes the display order.

INSERT INTO faqs (
  id,
  question_fr,
  question_ar,
  question_en,
  answer_fr,
  answer_ar,
  answer_en,
  sort_order
)
SELECT
  json_extract(entry.value, '$.id'),
  COALESCE(json_extract(entry.value, '$.question.fr'), ''),
  COALESCE(json_extract(entry.value, '$.question.ar'), ''),
  COALESCE(json_extract(entry.value, '$.question.en'), ''),
  COALESCE(json_extract(entry.value, '$.answer.fr'), ''),
  COALESCE(json_extract(entry.value, '$.answer.ar'), ''),
  COALESCE(json_extract(entry.value, '$.answer.en'), ''),
  entry.key
FROM site_settings AS s, json_each(s.value, '$.faq') AS entry
WHERE s.key = 'site'
  AND json_extract(entry.value, '$.id') IS NOT NULL
ON CONFLICT(id) DO NOTHING;
