import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'fs';
import {join} from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const CONTACT_FILE = join(DATA_DIR, 'contacts.json');
const INQUIRIES_FILE = join(DATA_DIR, 'inquiries.json');
const PRODUCTS_FILE = join(DATA_DIR, 'products.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, {recursive: true});
  }
}

function readJSON<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return fallback;
}

function writeJSON(filePath: string, data: unknown) {
  ensureDataDir();
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export type ContactEntry = {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  locale: string;
  createdAt: string;
  read: boolean;
};

export type InquiryEntry = {
  id: string;
  productName: string;
  reference: string;
  color: string;
  quantity: number;
  locale: string;
  createdAt: string;
  read: boolean;
};

export type AdminProduct = {
  id: string;
  name: {fr: string; ar: string; en: string};
  slug: string;
  reference: string;
  material: {fr: string; ar: string; en: string};
  materialSlug: string;
  description: {fr: string; ar: string; en: string};
  width: string;
  price: number | null;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  categorySlug: string;
  variants: {color: string; colorHex: string; sku: string; price: number | null; inStock: boolean}[];
  characteristics: {fr: string[]; ar: string[]; en: string[]};
};

// ── Contacts ──

export function getContacts(): ContactEntry[] {
  return readJSON<ContactEntry[]>(CONTACT_FILE, []);
}

export function addContact(entry: Omit<ContactEntry, 'id' | 'createdAt' | 'read'>): ContactEntry {
  const contacts = getContacts();
  const newEntry: ContactEntry = {
    ...entry,
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false
  };
  contacts.push(newEntry);
  writeJSON(CONTACT_FILE, contacts);
  return newEntry;
}

export function markContactRead(id: string) {
  const contacts = getContacts();
  const entry = contacts.find((c) => c.id === id);
  if (entry) {
    entry.read = true;
    writeJSON(CONTACT_FILE, contacts);
  }
}

export function deleteContact(id: string) {
  const contacts = getContacts().filter((c) => c.id !== id);
  writeJSON(CONTACT_FILE, contacts);
}

// ── Inquiries (WhatsApp clicks) ──

export function getInquiries(): InquiryEntry[] {
  return readJSON<InquiryEntry[]>(INQUIRIES_FILE, []);
}

export function addInquiry(entry: Omit<InquiryEntry, 'id' | 'createdAt' | 'read'>): InquiryEntry {
  const inquiries = getInquiries();
  const newEntry: InquiryEntry = {
    ...entry,
    id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false
  };
  inquiries.push(newEntry);
  writeJSON(INQUIRIES_FILE, inquiries);
  return newEntry;
}

// ── Admin Products (for future CRUD) ──

export function getAdminProducts(): AdminProduct[] {
  return readJSON<AdminProduct[]>(PRODUCTS_FILE, []);
}

export function saveAdminProducts(products: AdminProduct[]) {
  writeJSON(PRODUCTS_FILE, products);
}
