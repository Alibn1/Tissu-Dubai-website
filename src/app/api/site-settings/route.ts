import {NextRequest, NextResponse} from 'next/server';
import {getSiteSettings, saveSiteSettings} from '@/lib/data/store';
import {writeErrorResponse} from '@/lib/validation/routeError';
import {isAdminRequest, unauthorizedResponse} from '@/lib/adminAuth';

export async function GET() {
  return NextResponse.json(await getSiteSettings());
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({error: 'Invalid settings payload'}, {status: 400});
  }

  try {
    await saveSiteSettings(body);
  } catch (error) {
    return writeErrorResponse(error, 'Failed to save settings');
  }
  return NextResponse.json({success: true, settings: await getSiteSettings()});
}