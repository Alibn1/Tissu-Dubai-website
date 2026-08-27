import {setRequestLocale} from 'next-intl/server';
import {getContacts, getInquiries} from '@/lib/data/store';
import {MessageCircle, Mail, Package, Eye} from 'lucide-react';
import {cn} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AdminDashboardPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const contacts = getContacts();
  const inquiries = getInquiries();

  const stats = [
    {
      label: 'Total Contacts',
      value: contacts.length,
      icon: Mail,
      color: 'text-brand-primary'
    },
    {
      label: 'Unread Contacts',
      value: contacts.filter((c) => !c.read).length,
      icon: Eye,
      color: 'text-brand-warning'
    },
    {
      label: 'WhatsApp Inquiries',
      value: inquiries.length,
      icon: MessageCircle,
      color: 'text-[#25D366]'
    },
    {
      label: 'Products',
      value: 18,
      icon: Package,
      color: 'text-brand-secondary'
    }
  ];

  return (
    <div className="min-h-[70vh]">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Overview of your store activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-brand-border bg-brand-surface p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-muted">{stat.label}</span>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <p className="mt-2 text-2xl font-bold text-brand-secondary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent contacts */}
      <div className="rounded-md border border-brand-border bg-brand-surface">
        <div className="border-b border-brand-border px-5 py-3">
          <h2 className="font-heading text-base font-semibold text-brand-secondary">
            Recent Contacts
          </h2>
        </div>

        {contacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-muted">
            No contact submissions yet.
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {contacts.slice(-10).reverse().map((contact) => (
              <div key={contact.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-secondary">
                      {contact.name}
                    </p>
                    <p className="text-xs text-brand-muted">{contact.phone}</p>
                    <p className="mt-1 text-sm text-brand-muted">{contact.subject}</p>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-brand-muted line-clamp-2">
                  {contact.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
