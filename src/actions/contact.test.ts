import {describe, it, expect, vi, beforeEach} from 'vitest';
import {submitContactForm} from './contact';

vi.mock('@/lib/data/store', () => ({
  addContact: vi.fn((data: Record<string, unknown>) => ({
    ...data,
    id: 'test-id',
    createdAt: new Date().toISOString(),
    read: false
  }))
}));

describe('submitContactForm Server Action', () => {
  const validData = {
    name: 'Ahmed',
    phone: '+212612345678',
    subject: 'Fabric inquiry',
    message: 'I am interested in silk fabrics',
    locale: 'fr' as const
  };

  it('returns success for valid data', async () => {
    const result = await submitContactForm(validData);
    expect(result.success).toBe(true);
  });

  it('returns error for invalid phone format', async () => {
    const result = await submitContactForm({...validData, phone: '12345'});
    expect(result.success).toBe(false);
  });

  it('returns error for missing name', async () => {
    const result = await submitContactForm({...validData, name: ''});
    expect(result.success).toBe(false);
  });

  it('returns error for missing message', async () => {
    const result = await submitContactForm({...validData, message: ''});
    expect(result.success).toBe(false);
  });

  it('accepts Moroccan phone with +212 prefix', async () => {
    const result = await submitContactForm({...validData, phone: '+212612345678'});
    expect(result.success).toBe(true);
  });

  it('accepts Moroccan phone with 0 prefix', async () => {
    const result = await submitContactForm({...validData, phone: '0612345678'});
    expect(result.success).toBe(true);
  });

  it('rejects non-Moroccan phone', async () => {
    const result = await submitContactForm({...validData, phone: '+33612345678'});
    expect(result.success).toBe(false);
  });
});
