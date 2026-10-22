'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {ImagePlus, Trash2, Upload} from 'lucide-react';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Uploads an image to the R2 bucket through the admin API and returns the URL
 * to store in the database.
 *
 * The file goes to the Worker rather than straight to the bucket, so the
 * admin session is checked and the R2 credentials never reach the browser.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Image too large (${(file.size / 1_000_000).toFixed(1)} MB, the limit is 10 MB).`);
  }

  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);

  const response = await fetch('/api/images', {method: 'POST', body});
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.error ?? `Upload failed (${response.status}).`);
  }

  const data = await response.json();
  if (!data?.url) throw new Error('Upload failed: the server returned no URL.');
  return data.url as string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Upload failed.';
}

export function FileUploadButton({
  onUpload,
  folder = 'misc',
  label = 'Ajouter une image',
}: {
  onUpload: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      onUpload(await uploadImage(file, folder));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-4 w-4" />
        {busy ? 'Envoi en cours...' : label}
      </button>
      {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
    </div>
  );
}

export function ImagePreview({src, alt = ''}: {src?: string; alt?: string}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-brand-border bg-brand-light">
      {src ? (
        <Image src={src} alt={alt} width={48} height={48} unoptimized className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className="h-5 w-5 text-brand-muted" />
      )}
    </div>
  );
}

export function VariantImageControl({
  src,
  alt = '',
  folder = 'variants',
  onUpload,
  onRemove,
}: {
  src?: string;
  alt?: string;
  folder?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      onUpload(await uploadImage(file, folder));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="group relative h-14 w-14 shrink-0">
        {src ? (
          <>
            <Image
              src={src}
              alt={alt}
              width={56}
              height={56}
              unoptimized
              className="h-full w-full rounded-md border border-brand-border object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-md bg-brand-secondary/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                disabled={busy}
                onClick={pickFile}
                aria-label="Remplacer l'image"
                className="flex h-7 w-7 items-center justify-center rounded bg-white text-brand-secondary shadow-sm transition-colors hover:text-brand-primary disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                aria-label="Supprimer l'image"
                className="flex h-7 w-7 items-center justify-center rounded bg-white text-brand-secondary shadow-sm transition-colors hover:text-brand-error"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={pickFile}
            aria-label="Ajouter une image"
            className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-brand-border bg-brand-light text-brand-muted transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
    </div>
  );
}
