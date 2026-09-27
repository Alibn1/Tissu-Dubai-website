import Link from 'next/link';
import './globals.css';

// This has to live at the app root: a nested not-found.tsx only catches
// notFound() calls from its own subtree, not arbitrary unmatched URLs. The
// root layout renders no <html>/<body> of its own, so this file supplies them.
export default function NotFound() {
  return (
    <html lang="fr" dir="ltr" className="h-full antialiased">
      <body className="min-h-full bg-light">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-heading text-7xl font-bold text-brand-primary sm:text-8xl">404</p>

          <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-secondary sm:text-3xl">
            Page introuvable
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted sm:text-base">
            Cette page n&apos;existe pas ou a été déplacée. Vérifiez l&apos;adresse, ou
            revenez à la boutique pour poursuivre votre visite.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/fr"
              className="rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
            >
              Retour à la boutique
            </Link>

            <Link
              href="/fr/contact"
              className="rounded-md border border-brand-border px-6 py-3 text-sm font-medium text-brand-muted transition-colors hover:border-brand-primary hover:text-brand-secondary"
            >
              Nous contacter
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
