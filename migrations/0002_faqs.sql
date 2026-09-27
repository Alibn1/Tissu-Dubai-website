-- Move FAQ entries out of the site_settings JSON blob into their own table.
--
-- Rationale: a question is an individually editable, ordered record, not a
-- scalar. Storing the list inside a single JSON row means a read-modify-write of
-- the whole site configuration to change one question, no per-field validation,
-- and no way to order or disable entries with SQL.
--
-- Nothing about the SiteSettings type changes: getSiteSettings() still returns
-- faq: FaqEntry[], merged from this table, so the public FAQ page, FaqAccordion
-- and the admin settings form all keep working untouched.
--
-- Backfill the existing entries with:
--   npx wrangler d1 execute tissu-dubai --remote --file scripts/backfill-faqs.sql

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question_fr TEXT NOT NULL DEFAULT '',
  question_ar TEXT NOT NULL DEFAULT '',
  question_en TEXT NOT NULL DEFAULT '',
  answer_fr TEXT NOT NULL DEFAULT '',
  answer_ar TEXT NOT NULL DEFAULT '',
  answer_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- getFaqs(): ORDER BY sort_order, created_at
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
