'use client';

import {Fragment, useState} from 'react';
import {useTranslations} from 'next-intl';
import {MessageCircle} from 'lucide-react';
import {Modal} from '@/components/ui/Modal';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';
import {useSiteSettings} from '@/lib/siteSettingsContext';
import {cn} from '@/lib/utils';

export const phoneRegex = /^(\+?212|0)[5-7]\d{8}$/;

function renderWhatsAppText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIndex) => {
    const segments = line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
    return (
      <Fragment key={lineIndex}>
        {segments.map((segment, i) => {
          if (/^\*[^*]+\*$/.test(segment)) {
            return (
              <strong key={i} className="font-semibold">
                {segment.slice(1, -1)}
              </strong>
            );
          }
          if (/^_[^_]+_$/.test(segment)) {
            return <em key={i}>{segment.slice(1, -1)}</em>;
          }
          if (/^~[^~]+~$/.test(segment)) {
            return (
              <del key={i} className="opacity-70">
                {segment.slice(1, -1)}
              </del>
            );
          }
          return segment;
        })}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    );
  });
}

export type ConfirmationField = {
  name: string;
  label: string;
  value: string;
  required?: boolean;
  type?: 'text' | 'tel' | 'textarea';
  readOnly?: boolean;
};

type WhatsAppConfirmationFlowProps = {
  open: boolean;
  fields: ConfirmationField[];
  buildMessage: (values: Record<string, string>) => string;
  onClose: () => void;
  onSent?: () => void;
};

type FieldValues = Record<string, string>;
type FieldErrors = Record<string, string>;

export function WhatsAppConfirmationFlow({
  open,
  fields,
  buildMessage,
  onClose,
  onSent
}: WhatsAppConfirmationFlowProps) {
  const t = useTranslations('confirmation');
  const settings = useSiteSettings();

  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<FieldValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevFields, setPrevFields] = useState(fields);

  if (open !== prevOpen || fields !== prevFields) {
    setPrevOpen(open);
    setPrevFields(fields);
    if (open) {
      setStep(1);
      setTouched({});
      setErrors({});
      setValues(
        Object.fromEntries(fields.map((f) => [f.name, f.value ?? '']))
      );
    }
  }

  if (!open) return null;

  const fieldErrors = (field: ConfirmationField): string | undefined => {
    const value = values[field.name]?.trim() ?? '';
    if (field.required && !value) {
      return field.type === 'tel' ? t('phoneRequired') : t('fieldRequired');
    }
    if (field.type === 'tel' && value && !phoneRegex.test(value)) {
      return t('phoneInvalid');
    }
    return undefined;
  };

  const canContinue =
    fields.every((f) => {
      const value = values[f.name]?.trim() ?? '';
      if (f.required && !value) return false;
      if (f.type === 'tel' && value && !phoneRegex.test(value)) return false;
      return true;
    });

  const openStep2 = () => {
    const nextErrors: FieldErrors = {};
    for (const f of fields) {
      const err = fieldErrors(f);
      if (err) nextErrors[f.name] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  };

  const send = () => {
    const message = buildMessage(values);
    window.open(
      buildWhatsAppUrl(getWhatsAppNumber(settings), message),
      '_blank',
      'noopener,noreferrer'
    );
    onSent?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? t('title') : t('previewTitle')}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-brand-muted">{t('subtitle')}</p>

          {fields.map((field) => {
            const showError = touched[field.name] && !!fieldErrors(field);
            const isTel = field.type === 'tel';
            return (
              <div key={field.name}>
                <label
                  htmlFor={`confirm-${field.name}`}
                  className="mb-1 flex items-center gap-1 text-sm font-medium text-brand-secondary"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-brand-error">*</span>
                  )}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`confirm-${field.name}`}
                    rows={4}
                    readOnly={field.readOnly}
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))
                    }
                    onBlur={() =>
                      setTouched((prev) => ({...prev, [field.name]: true}))
                    }
                    className={cn(
                      'w-full resize-none rounded-md border bg-brand-surface px-3.5 py-2.5 text-sm text-brand-secondary',
                      'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
                      field.readOnly && 'opacity-70',
                      showError ? 'border-brand-error' : 'border-brand-border'
                    )}
                  />
                ) : (
                  <input
                    id={`confirm-${field.name}`}
                    type={isTel ? 'tel' : 'text'}
                    readOnly={field.readOnly}
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))
                    }
                    onBlur={() =>
                      setTouched((prev) => ({...prev, [field.name]: true}))
                    }
                    className={cn(
                      'w-full rounded-md border bg-brand-surface px-3.5 py-2.5 text-sm text-brand-secondary',
                      'placeholder:text-brand-muted',
                      'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
                      field.readOnly && 'opacity-70',
                      showError ? 'border-brand-error' : 'border-brand-border'
                    )}
                  />
                )}
                {showError && (
                  <p className="mt-1 text-xs text-brand-error">
                    {fieldErrors(field)}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-5 py-2.5',
                'border border-brand-border text-sm font-medium text-brand-secondary',
                'hover:bg-brand-light transition-colors duration-200'
              )}
            >
              {t('back')}
            </button>
            <button
              type="button"
              onClick={openStep2}
              disabled={!canContinue}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-6 py-2.5',
                'bg-brand-primary hover:bg-brand-primary/90 text-white',
                'text-sm font-semibold transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {t('continue')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-brand-muted">{t('previewSubtitle')}</p>

          {/* WhatsApp-style chat bubble */}
          <div className="rounded-2xl border border-brand-border/60 bg-brand-light p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-brand-muted">
              <span className="h-2 w-2 rounded-full bg-[#25D366]" />
              WhatsApp
            </div>
            <p className="text-sm leading-relaxed text-brand-secondary">
              {renderWhatsAppText(buildMessage(values))}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-5 py-2.5',
                'border border-brand-border text-sm font-medium text-brand-secondary',
                'hover:bg-brand-light transition-colors duration-200'
              )}
            >
              {t('edit')}
            </button>
            <button
              type="button"
              onClick={send}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5',
                'bg-[#25D366] hover:bg-[#20BD5A] text-white',
                'text-sm font-semibold transition-colors duration-200'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {t('send')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}