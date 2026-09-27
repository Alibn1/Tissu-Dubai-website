import {NextResponse} from 'next/server';
import {ValidationError} from './schemas';

/**
 * Turns a refused write into a 400 the admin form can display, not a 500.
 *
 * A ValidationError carries every problem found in the payload, so they are
 * returned together as `issues` for a form to place next to the right field,
 * with `error` holding a single readable line for anything less clever.
 */
export function writeErrorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({error: error.issues.join(' '), issues: error.issues}, {status: 400});
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({error: message}, {status: 400});
}
