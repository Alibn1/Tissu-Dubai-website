import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'tissu-d1-'));
  process.env.TISSU_DB_PATH = join(dir, 'test.db');
});

afterAll(async () => {
  const {closeDb} = await import('@/db');
  closeDb();
  delete process.env.TISSU_DB_PATH;
  rmSync(dir, {recursive: true, force: true});
});

/**
 * The data layer replaced the old in-memory WorkersDatabase, which silently
 * served mock products on Cloudflare and lost every admin write on a cold
 * start. These tests pin the contract that replaced it: one async interface,
 * real SQL in every environment, and no hidden fallback.
 */
describe('async data layer', () => {
  it('uses node:sqlite locally and reports D1 as inactive', async () => {
    const {isUsingD1} = await import('@/db');
    expect(await isUsingD1()).toBe(false);
  });

  it('returns a real SQL handle rather than a test double', async () => {
    const {getDb} = await import('@/db');
    // A real database can answer PRAGMA output and accept arbitrary SQL; the
    // deleted in-memory fallback rejected anything it did not recognise.
    expect(() => getDb().prepare('PRAGMA table_info(products)').all()).not.toThrow();
    expect(() => getDb().prepare('SELECT 1 AS one').all()).not.toThrow();
  });

  it('reads rows through dbAll and dbFirst', async () => {
    const {dbAll, dbFirst} = await import('@/db');
    await import('@/db').then(async (m) => {
      await m.dbRun('INSERT INTO collections (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)', [
        'c-test',
        'test-collection',
        'Test',
        'اختبار',
        'Test',
      ]);
    });

    const all = await dbAll<{slug: string}>('SELECT slug FROM collections WHERE slug = ?', ['test-collection']);
    expect(all.map((row) => row.slug)).toEqual(['test-collection']);

    expect((await dbFirst<{slug: string}>('SELECT slug FROM collections WHERE slug = ?', ['test-collection']))?.slug).toBe(
      'test-collection'
    );
    expect(await dbFirst('SELECT slug FROM collections WHERE slug = ?', ['does-not-exist'])).toBeNull();
  });

  it('reports the number of affected rows from dbRun', async () => {
    const {dbRun} = await import('@/db');
    const inserted = await dbRun(
      'INSERT INTO models (id, slug, name_fr, name_ar, name_en) VALUES (?, ?, ?, ?, ?)',
      ['m-test', 'model-test', 'Model', 'موديل', 'Model']
    );
    expect(inserted).toBe(1);

    const deleted = await dbRun('DELETE FROM models WHERE id = ?', ['m-test']);
    expect(deleted).toBe(1);

    expect(await dbRun('DELETE FROM models WHERE id = ?', ['m-test'])).toBe(0);
  });

  it('normalizes booleans for D1 compatibility', async () => {
    const {dbAll, dbRun} = await import('@/db');
    const id = 'p-adapter';
    await dbRun(
      `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, in_stock, featured, is_new, width, price, seo_fr, seo_ar, seo_en, images, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, 'adapter', 'REF-ADAPTER', 'A', 'ب', 'A', true, false, true, '', null, '{}', '{}', '{}', '[]', '', '']
    );

    // true/false arrive as 1/0 rather than being rejected as unbindable.
    const row = await dbAll<{in_stock: number; featured: number; is_new: number; price: null}>(
      'SELECT in_stock, featured, is_new, price FROM products WHERE id = ?',
      [id]
    );
    expect(row[0].in_stock).toBe(1);
    expect(row[0].featured).toBe(0);
    expect(row[0].is_new).toBe(1);
    expect(row[0].price).toBeNull();

    await dbRun('DELETE FROM products WHERE id = ?', [id]);
  });

  it('turns undefined into NULL on a nullable column', async () => {
    const {dbAll, dbRun} = await import('@/db');
    const id = 'p-undefined';
    await dbRun(
      `INSERT INTO products (id, slug, reference, name_fr, name_ar, name_en, in_stock, featured, is_new, width, price, seo_fr, seo_ar, seo_en, images, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, 'undef', 'REF-UNDEF', 'U', 'و', 'U', true, false, false, '', undefined, '{}', '{}', '{}', '[]', '', '']
    );

    const row = await dbAll<{price: null}>('SELECT price FROM products WHERE id = ?', [id]);
    expect(row[0].price).toBeNull();

    await dbRun('DELETE FROM products WHERE id = ?', [id]);
  });
});
