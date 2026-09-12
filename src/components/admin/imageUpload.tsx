'use client';

import {useRef} from 'react';
import Image from 'next/image';
import {ImagePlus, Upload} from 'lucide-react';

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