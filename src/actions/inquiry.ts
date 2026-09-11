'use server';

import {addInquiry, type InquiryEntry} from '@/lib/data/store';

type InquiryResult = {success: true; data: InquiryEntry} | {success: false; error: string};

export async function trackInquiry(data: {
  productName: string;
  reference: string;
  color: string;
  quantity: number;
  locale: string;
}): Promise<InquiryResult> {
  try {
    const entry = addInquiry(data);
    return {success: true, data: entry};
  } catch {
    return {success: false, error: 'Failed to track inquiry'};
  }
}