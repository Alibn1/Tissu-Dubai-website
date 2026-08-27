import {setRequestLocale} from 'next-intl/server';
import {getContacts, getInquiries} from '@/lib/data/store';
import {Mail, MessageCircle, Inbox} from 'lucide-react';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminRequestsPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const contacts = getContacts();
  const inquiries = getInquiries();

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Requests & Inquiries
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Contact form submissions and WhatsApp inquiries
        </p>
      </div>

      {/* Contact Submissions */}
      <div className="mb-8 rounded-md border border-brand-border bg-brand-surface">
        <div className="flex items-center gap-2 border-b border-brand-border px-5 py-3">
          <Mail className="h-4 w-4 text-brand-primary" />
          <h2 className="font-heading text-base font-semibold text-brand-secondary">
            Contact Form Submissions ({contacts.length})
          </h2>
        </div>

        {contacts.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-brand-muted/30" />
            <p className="mt-2 text-sm text-brand-muted">No submissions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {contacts.map((contact) => (
              <div key={contact.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-secondary">
                        {contact.name}
                      </p>
                      {!contact.read && (
                        <span className="h-2 w-2 rounded-full bg-brand-primary" />
                      )}
                    </div>
                    <p className="text-xs text-brand-muted">
                      {contact.phone} · [{contact.locale.toUpperCase()}]
                    </p>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {new Date(contact.createdAt).toLocaleDateString()}{' '}
                    {new Date(contact.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-muted">{contact.subject}</p>
                <p className="mt-1 text-sm text-brand-muted">{contact.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp Inquiries */}
      <div className="rounded-md border border-brand-border bg-brand-surface">
        <div className="flex items-center gap-2 border-b border-brand-border px-5 py-3">
          <MessageCircle className="h-4 w-4 text-[#25D366]" />
          <h2 className="font-heading text-base font-semibold text-brand-secondary">
            WhatsApp Inquiries ({inquiries.length})
          </h2>
        </div>

        {inquiries.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-brand-muted/30" />
            <p className="mt-2 text-sm text-brand-muted">No inquiries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-secondary">
                        {inquiry.productName}
                      </p>
                      {!inquiry.read && (
                        <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                      )}
                    </div>
                    <p className="text-xs text-brand-muted">
                      Ref: {inquiry.reference} · {inquiry.color} · {inquiry.quantity}m · [{inquiry.locale.toUpperCase()}]
                    </p>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {new Date(inquiry.createdAt).toLocaleDateString()}{' '}
                    {new Date(inquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
