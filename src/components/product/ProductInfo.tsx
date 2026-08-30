'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {QuantitySelector} from '@/components/ui/QuantitySelector';
import {Badge} from '@/components/ui/Badge';
import {buildWhatsAppUrl, getWhatsAppNumber} from '@/lib/whatsapp';
import {generateWhatsAppMessage} from '@/lib/whatsapp';
import {MessageCircle, Share2} from 'lucide-react';
import {type Product, type Locale} from '@/types';

type ProductInfoProps = {
  product: Product;
  locale: Locale;
  selectedVariant: number;
};

export function ProductInfo({product, locale, selectedVariant}: ProductInfoProps) {
  const t = useTranslations();

  const [quantity, setQuantity] = useState(1);

  const variant = product.variants[selectedVariant];
  const name = product.name[locale] || product.name.fr;
  const material = product.material[locale] || product.material.fr;
  const description = product.description[locale] || product.description.fr;

  const displayPrice = variant?.price ?? product.price;

  const handleWhatsApp = () => {
    const number = getWhatsAppNumber();
    const message = generateWhatsAppMessage({
      productName: name,
      reference: product.reference,
      color: variant?.color || '',
      quantity,
      locale
    });
    window.open(buildWhatsAppUrl(number, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Badges */}
      <div className="flex gap-2">
        {product.isNew && <Badge variant="primary">{t('product.new')}</Badge>}
        {product.featured && <Badge variant="accent">{t('product.featured')}</Badge>}
        {!product.inStock && <Badge variant="error">{t('product.outOfStock')}</Badge>}
      </div>

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

      {/* Material & Width */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-brand-muted">{t('product.material')}: </span>
          <span className="font-medium text-brand-secondary">{material}</span>
        </div>
        <div>
          <span className="text-brand-muted">{t('product.width')}: </span>
          <span className="font-medium text-brand-secondary">{product.width}</span>
        </div>
        {variant && (
          <div>
            <span className="text-brand-muted">{t('product.selectColor')}: </span>
            <span className="font-medium text-brand-secondary">{variant.color}</span>
          </div>
        )}
      </div>

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
          onClick={handleWhatsApp}
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
    </div>
  );
}
