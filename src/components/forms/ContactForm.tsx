'use client';

import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {cn} from '@/lib/utils';
import {Send} from 'lucide-react';
import {
  WhatsAppConfirmationFlow,
  phoneRegex
} from '@/components/forms/WhatsAppConfirmationFlow';
import {type Locale} from '@/types';

type ContactFormProps = {
  locale: Locale;
};

const createSchema = (locale: Locale) => {
  const messages: Record<Locale, {nameRequired: string; phoneRequired: string; phoneInvalid: string; subjectRequired: string; messageRequired: string}> = {
    fr: {nameRequired: 'Le nom est requis', phoneRequired: 'Le téléphone est requis', phoneInvalid: 'Numéro de téléphone invalide', subjectRequired: 'Le sujet est requis', messageRequired: 'Le message est requis'},
    ar: {nameRequired: 'الاسم مطلوب', phoneRequired: 'الهاتف مطلوب', phoneInvalid: 'رقم الهاتف غير صالح', subjectRequired: 'الموضوع مطلوب', messageRequired: 'الرسالة مطلوبة'},
    en: {nameRequired: 'Name is required', phoneRequired: 'Phone is required', phoneInvalid: 'Invalid phone number', subjectRequired: 'Subject is required', messageRequired: 'Message is required'}
  };

  return z.object({
    name: z.string().min(1, messages[locale].nameRequired),
    phone: z.string().min(1, messages[locale].phoneRequired).regex(phoneRegex, messages[locale].phoneInvalid),
    subject: z.string().optional(),
    message: z.string().min(1, messages[locale].messageRequired)
  });
};

type FormData = {
  name: string;
  phone: string;
  subject?: string;
  message: string;
};

export function ContactForm({locale}: ContactFormProps) {
  const t = useTranslations('contact.form');

  const schema = createSchema(locale);
  const [flowData, setFlowData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: {errors},
    reset
  } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => {
    setFlowData(data);
  };

  const buildMessage = (values: Record<string, string>) => {
    const phrases =
      locale === 'ar'
        ? {greeting: 'مرحباً تيسو دبي', intro: 'أتصل بكم من موقعكم الإلكتروني.', name: 'الاسم', phone: 'الهاتف', subject: 'الموضوع', message: 'الرسالة'}
        : locale === 'fr'
          ? {greeting: 'Bonjour Tissu Dubai', intro: 'Je vous contacte depuis votre site.', name: 'Nom', phone: 'Téléphone', subject: 'Sujet', message: 'Message'}
          : {greeting: 'Hello Tissu Dubai', intro: 'I am contacting you from your website.', name: 'Name', phone: 'Phone', subject: 'Subject', message: 'Message'};

    const messageLines = [
      `*${phrases.greeting}*`,
      '',
      phrases.intro,
      '',
      `*${phrases.name} :* ${values.name}`,
      `*${phrases.phone} :* ${values.phone}`,
      values.subject?.trim() ? `*${phrases.subject} :* ${values.subject}` : null,
      '',
      `*${phrases.message} :*`,
      values.message
    ].filter(Boolean) as string[];

    return messageLines.join('\n');
  };

  const fields = useMemo(
    () =>
      flowData
        ? [
            {name: 'name', label: t('name'), value: flowData.name, required: true},
            {name: 'phone', label: t('phone'), value: flowData.phone, required: true, type: 'tel' as const},
            {name: 'subject', label: t('subject'), value: flowData.subject ?? '', required: false},
            {name: 'message', label: t('message'), value: flowData.message, required: true, type: 'textarea' as const}
          ]
        : [],
    [flowData, t]
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-secondary mb-1">
            {t('name')}
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder={t('namePlaceholder')}
            className={cn(
              'w-full rounded-md border bg-brand-surface px-4 py-2.5 text-sm text-brand-secondary',
              'placeholder:text-brand-muted',
              'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
              errors.name ? 'border-brand-error' : 'border-brand-border'
            )}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-brand-error">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-brand-secondary mb-1">
            {t('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder={t('phonePlaceholder')}
            className={cn(
              'w-full rounded-md border bg-brand-surface px-4 py-2.5 text-sm text-brand-secondary',
              'placeholder:text-brand-muted',
              'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
              errors.phone ? 'border-brand-error' : 'border-brand-border'
            )}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-brand-error">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-brand-secondary mb-1">
          {t('subject')}
        </label>
        <input
          id="subject"
          type="text"
          {...register('subject')}
          placeholder={t('subjectPlaceholder')}
          className={cn(
            'w-full rounded-md border bg-brand-surface px-4 py-2.5 text-sm text-brand-secondary',
            'placeholder:text-brand-muted',
            'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
            errors.subject ? 'border-brand-error' : 'border-brand-border'
          )}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-brand-error">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-secondary mb-1">
          {t('message')}
        </label>
        <textarea
          id="message"
          {...register('message')}
          placeholder={t('messagePlaceholder')}
          rows={5}
          className={cn(
            'w-full rounded-md border bg-brand-surface px-4 py-2.5 text-sm text-brand-secondary',
            'placeholder:text-brand-muted resize-none',
            'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary',
            errors.message ? 'border-brand-error' : 'border-brand-border'
          )}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-brand-error">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        className={cn(
          'inline-flex items-center gap-2',
          'bg-[#25D366] hover:bg-[#20BD5A] text-white',
          'px-8 py-3 rounded-md',
          'text-sm font-semibold',
          'transition-colors duration-200'
        )}
      >
        <Send className="h-4 w-4" />
        {t('sendWhatsApp')}
      </button>
      </form>

      <WhatsAppConfirmationFlow
        open={!!flowData}
        fields={fields}
        buildMessage={buildMessage}
        onClose={() => setFlowData(null)}
        onSent={() => reset()}
      />
    </>
  );
}
