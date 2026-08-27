'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {Save, Loader2} from 'lucide-react';
import type {Product} from '@/types';

type Props = {
  product: Product;
  locale: string;
};

export function ProductEditForm({product, locale}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    nameFr: product.name.fr,
    nameAr: product.name.ar,
    nameEn: product.name.en,
    descriptionFr: product.description.fr,
    descriptionAr: product.description.ar,
    descriptionEn: product.description.en,
    materialFr: product.material.fr,
    materialAr: product.material.ar,
    materialEn: product.material.en,
    price: product.price ?? '',
    inStock: product.inStock,
    featured: product.featured,
    isNew: product.isNew,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: {fr: formData.nameFr, ar: formData.nameAr, en: formData.nameEn},
          description: {fr: formData.descriptionFr, ar: formData.descriptionAr, en: formData.descriptionEn},
          material: {fr: formData.materialFr, ar: formData.materialAr, en: formData.materialEn},
          price: formData.price === '' ? null : Number(formData.price),
          inStock: formData.inStock,
          featured: formData.featured,
          isNew: formData.isNew,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-secondary',
    'focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
  );

  const labelClass = 'block text-sm font-medium text-brand-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Names */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">Product Names</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>French</label>
            <input
              value={formData.nameFr}
              onChange={(e) => setFormData({...formData, nameFr: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Arabic</label>
            <input
              value={formData.nameAr}
              onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div>
            <label className={labelClass}>English</label>
            <input
              value={formData.nameEn}
              onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Descriptions */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">Descriptions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>French</label>
            <textarea
              rows={4}
              value={formData.descriptionFr}
              onChange={(e) => setFormData({...formData, descriptionFr: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Arabic</label>
            <textarea
              rows={4}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({...formData, descriptionAr: e.target.value})}
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div>
            <label className={labelClass}>English</label>
            <textarea
              rows={4}
              value={formData.descriptionEn}
              onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">Materials</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>French</label>
            <input
              value={formData.materialFr}
              onChange={(e) => setFormData({...formData, materialFr: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Arabic</label>
            <input
              value={formData.materialAr}
              onChange={(e) => setFormData({...formData, materialAr: e.target.value})}
              className={inputClass}
              dir="rtl"
            />
          </div>
          <div>
            <label className={labelClass}>English</label>
            <input
              value={formData.materialEn}
              onChange={(e) => setFormData({...formData, materialEn: e.target.value})}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Pricing & Status */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-secondary mb-4">Pricing & Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Base Price (MAD)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})}
              className={inputClass}
              placeholder="Leave empty for price on request"
            />
          </div>
          <div className="flex items-end gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-brand-secondary">In Stock</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-brand-secondary">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({...formData, isNew: e.target.checked})}
                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-brand-secondary">New</span>
            </label>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors',
            saved
              ? 'bg-green-600'
              : 'bg-brand-primary hover:bg-brand-primary/90',
            'disabled:opacity-50'
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            'Saved!'
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="rounded-md px-4 py-2.5 text-sm font-medium text-brand-muted hover:text-brand-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
