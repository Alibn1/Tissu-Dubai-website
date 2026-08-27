'use server';

import {addContact, type ContactEntry} from '@/lib/data/store';
import {z} from 'zod';

const phoneRegex = /^(\+?212|0)[5-7]\d{8}$/;

const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(phoneRegex),
  subject: z.string().min(1),
  message: z.string().min(1),
  locale: z.enum(['fr', 'ar', 'en'])
});

type ContactResult = {success: true; data: ContactEntry} | {success: false; error: string};

export async function submitContactForm(formData: {
  name: string;
  phone: string;
  subject: string;
  message: string;
  locale: string;
}): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(formData);

  if (!parsed.success) {
    return {success: false, error: 'Invalid form data'};
  }

  try {
    const entry = addContact(parsed.data);
    return {success: true, data: entry};
  } catch {
    return {success: false, error: 'Failed to save contact entry'};
  }
}
