import {NextResponse} from 'next/server';

// DeepL plan is detected from the key: free-plan keys end with ":fx".
const FREE_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const PRO_ENDPOINT = 'https://api.deepl.com/v2/translate';
const FREE_PLAN_SUFFIX = ':fx';

const SUPPORTED_TARGETS = new Set(['EN', 'FR', 'AR']);

// DeepL auto-detects the source language, but we still pass the source the
// admin produced when known; default to FR otherwise.
const SOURCE_LANGS = new Set(['EN', 'FR', 'AR']);
const DEFAULT_SOURCE_LANG = 'FR';

export async function POST(request: Request) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {error: 'Clé DEEPL_API_KEY manquante côté serveur.'},
      {status: 500}
    );
  }

  const body = await request.json().catch(() => null);

  const text = body?.text;
  const targetLang = body?.targetLang;
  if (typeof text !== 'string' || text.trim() === '' || typeof targetLang !== 'string') {
    return NextResponse.json(
      {error: 'Les champs "text" (non vide) et "targetLang" sont obligatoires.'},
      {status: 400}
    );
  }

  const code = targetLang.toUpperCase();
  if (!SUPPORTED_TARGETS.has(code)) {
    return NextResponse.json(
      {error: `Langue cible non prise en charge : ${targetLang}`},
      {status: 400}
    );
  }

  const rawSource = typeof body?.sourceLang === 'string' ? body.sourceLang : '';
  const sourceCode = SOURCE_LANGS.has(rawSource.toUpperCase()) ? rawSource.toUpperCase() : DEFAULT_SOURCE_LANG;

  try {
    return await translateWithDeepL(text, code, apiKey, sourceCode);
  } catch {
    return NextResponse.json(
      {error: 'Échec de la connexion au service de traduction.'},
      {status: 500}
    );
  }
}

async function translateWithDeepL(text: string, code: string, apiKey: string, sourceCode: string): Promise<NextResponse> {
  const endpoint = apiKey.endsWith(FREE_PLAN_SUFFIX) ? FREE_ENDPOINT : PRO_ENDPOINT;
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', code);
  params.append('source_lang', sourceCode);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message ?? `DeepL a répondu avec le statut ${response.status}`;
    return NextResponse.json({error: `Erreur DeepL : ${message}`}, {status: 500});
  }

  const translatedText = data?.translations?.[0]?.text;
  if (typeof translatedText !== 'string') {
    return NextResponse.json({error: 'Réponse invalide de DeepL.'}, {status: 500});
  }

  return NextResponse.json({translatedText});
}