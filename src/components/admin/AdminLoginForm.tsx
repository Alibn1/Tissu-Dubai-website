'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import {Lock} from 'lucide-react';

export function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password})
      });

      if (res.ok) {
        // Hard navigation so the admin layout re-renders server-side
        // with the session cookie and the sidebar becomes visible.
        window.location.href = '/fr/admin/dashboard';
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-md border border-brand-border bg-brand-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-brand-primary" />
          <h1 className="mt-3 font-heading text-xl font-bold text-brand-secondary">
            Administration
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-brand-error/10 p-3 text-sm text-brand-error">
              Mot de passe invalide
            </p>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-secondary mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full rounded-md border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-secondary',
                'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
              )}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={cn(
              'w-full rounded-md bg-brand-primary px-4 py-2.5',
              'text-sm font-semibold text-white',
              'hover:bg-brand-primary/90 transition-colors'
            )}
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
