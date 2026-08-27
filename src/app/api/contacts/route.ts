import {NextRequest, NextResponse} from 'next/server';
import {getContacts} from '@/lib/data/store';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;

  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  const contacts = getContacts();
  return NextResponse.json(contacts);
}
