'use client';

import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {QuantitySelector} from '@/components/ui/QuantitySelector';
import {Badge} from '@/components/ui/Badge';
import {WhatsAppConfirmationFlow} from '@/components/forms/WhatsAppConfirmationFlow';
import {generateWhatsAppMessage} from '@/lib/whatsapp';
import {MessageCircle, Share2} from 'lucide-react';
import {formatDimensions} from '@/lib/dimensions';
import {type Product, type Locale} from '@/types';

type ProductInfoProps = {
  product: Product;
  locale: Locale;
  selectedVariant: number;
};

export function ProductInfo({product, locale, selectedVariant}: ProductInfoProps) {
  const t = useTranslations();
  const tForm = useTranslations('contact.form');

  const [quantity, setQuantity] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);

  const variant = product.variants[selectedVariant];
  const name = product.name[locale] || product.name.fr;
  const material = product.material[locale] || product.material.fr;
  const variantColor = variant ? variant.color[locale] || variant.color.fr : '';

  const displayPrice = product.price;

  const buildMessage = (values: Record<string, string>) =>
    generateWhatsAppMessage({
      productName: name,
      reference: product.reference,
      color: variantColor,
      quantity,
      name: values.name ?? '',
      phone: values.phone ?? '',
      locale
    });

  const fields = useMemo(
    () => [
      {name: 'name', label: tForm('name'), value: '', required: true},
      {name: 'phone', label: tForm('phone'), value: '', required: true, type: 'tel' as const},
      {name: 'product', label: t('product.name'), value: name, readOnly: true},
      {name: 'reference', label: t('product.reference'), value: product.reference, readOnly: true},
      {name: 'color', label: t('product.color'), value: variantColor, readOnly: true},
      {name: 'quantity', label: t('product.selectQuantity'), value: String(quantity), readOnly: true}
    ],
    [name, product, quantity, t, tForm, variantColor]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {product.isNew && <Badge variant="primary">{t('product.new')}</Badge>}
        {product.featured && <Badge variant="accent">{t('product.featured')}</Badge>}
        {!product.inStock && <Badge variant="error">{t('product.outOfStock')}</Badge>}
      </div>

      {/* Collections stickers */}
      {product.collections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {product.collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
                'border-brand-primary/40 bg-brand-primary/10',
                'text-xs font-semibold tracking-wide text-brand-gold-light',
                'hover:border-brand-primary hover:bg-brand-primary/20',
                'transition-colors duration-200'
              )}
            >
              {collection.name[locale] || collection.name.fr}
            </Link>
          ))}
        </div>
      )}

      {/* Name */}
      <h1 className="font-heading text-2xl font-bold text-brand-secondary sm:text-3xl">
        {name}
      </h1>

      {/* Reference */}
      <p className="text-sm text-brand-muted">
        {t('product.reference')}: <span className="font-medium text-brand-secondary">{product.reference}</span>
      </p>

      {/* Price */}
      <div>
        {displayPrice !== null ? (
          <span className="text-2xl font-bold text-brand-primary">
            {displayPrice} {t('common.currency')}
          </span>
        ) : (
          <span className="text-lg font-medium text-brand-muted italic">
            {t('common.surDevis')}
          </span>
        )}
      </div>

      {/* Material & Dimensions */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-brand-muted">{t('product.material')}: </span>
          <span className="font-medium text-brand-secondary">{material}</span>
        </div>
        <div>
          <span className="text-brand-muted">{t('product.width')}: </span>
          <span className="font-medium text-brand-secondary">{formatDimensions(product.width, locale)}</span>
        </div>
        {variant && (
          <div>
            <span className="text-brand-muted">{t('product.color')}: </span>
            <span className="font-medium text-brand-secondary">{variantColor}</span>
          </div>
        )}
      </div>

      {/* Choose color */}
      {product.variants.length > 1 && (
        <button
          type="button"
          onClick={() => {
            document
              .getElementById('product-color-gallery')
              ?.scrollIntoView({behavior: 'smooth', block: 'center'});
          }}
          className={cn(
            'self-start inline-flex items-center justify-center gap-2',
            'rounded-full px-6 py-2.5',
            'bg-transparent border border-brand-primary/60',
            'text-sm font-semibold tracking-wide text-brand-gold-light',
            'hover:bg-brand-primary/10 hover:border-brand-primary',
            'shadow-[0_0_0_1px_rgba(201,162,39,0.15)]',
            'transition-all duration-300'
          )}
        >
          {t('product.chooseColor')}
        </button>
      )}

      {/* Availability */}
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-success" />
        <span className="text-sm text-brand-secondary">
          {variant?.inStock ? t('product.inStock') : t('product.outOfStock')}
        </span>
      </div>

      {/* Quantity */}
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        label={t('product.selectQuantity')}
      />

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setOrderOpen(true)}
          disabled={!product.inStock || !variant?.inStock}
          className={cn(
            'flex items-center justify-center gap-2',
            'bg-[#25D366] hover:bg-[#20BD5A] text-white',
            'px-6 py-3.5 rounded-md',
            'text-sm font-semibold',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <MessageCircle className="h-5 w-5" />
          {t('product.orderWhatsApp')}
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({title: name, url: window.location.href});
            }
          }}
          className={cn(
            'flex items-center justify-center gap-2',
            'border border-brand-border rounded-md px-6 py-3',
            'text-sm font-medium text-brand-secondary',
            'hover:bg-brand-light transition-colors'
          )}
        >
          <Share2 className="h-4 w-4" />
          {t('product.share')}
        </button>
      </div>

      <WhatsAppConfirmationFlow
        open={orderOpen}
        fields={fields}
        buildMessage={buildMessage}
        onClose={() => setOrderOpen(false)}
      />
    </div>
  );
}
