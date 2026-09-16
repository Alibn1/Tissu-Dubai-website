'use client';

import {useRef} from 'react';
import Image from 'next/image';
import {ImagePlus, Trash2, Upload} from 'lucide-react';

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FileUploadButton({
  onUpload,
  label = 'Ajouter une image',
}: {
  onUpload: (dataUrl: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            readFileAsDataUrl(file)
              .then(onUpload)
              .catch(() => {});
          }
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-brand-border px-3 py-2 text-sm text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Upload className="h-4 w-4" />
        {label}
      </button>
    </>
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
  onUpload,
  onRemove,
}: {
  src?: string;
  alt?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => inputRef.current?.click();

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            readFileAsDataUrl(file)
              .then(onUpload)
              .catch(() => {});
          }
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
                onClick={pickFile}
                aria-label="Remplacer l'image"
                className="flex h-7 w-7 items-center justify-center rounded bg-white text-brand-secondary shadow-sm transition-colors hover:text-brand-primary"
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
            onClick={pickFile}
            aria-label="Ajouter une image"
            className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-brand-border bg-brand-light text-brand-muted transition-colors hover:border-brand-primary hover:text-brand-primary"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );
}