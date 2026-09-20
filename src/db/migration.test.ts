import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

let dir: string;
let dbPath: string;

const OLD_SCHEMA = `
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  collection_slug TEXT NOT NULL REFERENCES collections(slug),
  name_fr TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  UNIQUE(slug, collection_slug)
);
`;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'tissu-migrate-'));
  dbPath = join(dir, 'old.db');
  const db = new DatabaseSync(dbPath);
  db.exec(OLD_SCHEMA);
  db.prepare(`INSERT INTO collections (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)`)
    .run('c1', 'caftan', 'Caftan', 'قفطان', 'Caftan');
  db.prepare(`INSERT INTO collections (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)`)
    .run('c2', 'tekchita', 'Takchita', 'تكشيطة', 'Takchita');
  db.prepare(`INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('soie-caftan', 'soie', 'caftan', 'Soie', 'حرير', 'Silk');
  db.prepare(`INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('soie-tekchita', 'soie', 'tekchita', 'Soie', 'حرير', 'Silk');
  db.prepare(`INSERT INTO models (id, slug, collection_slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('velours-caftan', 'velours', 'caftan', 'Velours', 'مخمل', 'Velvet');
  db.close();
  process.env.TISSU_DB_PATH = dbPath;
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  delete process.env.TISSU_DB_PATH;
  rmSync(dir, {recursive: true, force: true});
});

describe('junction migration', () => {
  it('dedupes models and links collections through the junction table', async () => {
    const {getModels} = await import('@/lib/data/store');
    const models = getModels();
    const soie = models.find((m) => m.slug === 'soie');
    const velours = models.find((m) => m.slug === 'velours');
    expect(soie?.collectionSlugs.sort()).toEqual(['caftan', 'tekchita']);
    expect(velours?.collectionSlugs).toEqual(['caftan']);
    expect(models.filter((m) => m.slug === 'soie')).toHaveLength(1);
    expect(getModels().length).toBe(2);
  });
});