import {setRequestLocale} from 'next-intl/server';
import {getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getProductBySlug, getRelatedProducts, getProducts} from '@/lib/api';
import {JsonLd} from '@/lib/seo/JsonLd';
import {resolveSeoValue} from '@/lib/productSeo';
import {Breadcrumbs} from '@/components/ui/Breadcrumbs';
import {ProductGallery} from '@/components/product/ProductGallery';
import {ProductView} from '@/components/product/ProductView';
import {ProductInfo} from '@/components/product/ProductInfo';
import {ProductDetails} from '@/components/product/ProductDetails';
import {RelatedProducts} from '@/components/product/RelatedProducts';
import {type Locale} from '@/types';

type Props = {
  params: Promise<{locale: string; collection: string; slug: string}>;
};

export async function generateStaticParams() {
  const products = await getProducts();
  return products.flatMap((p) =>
    p.collections.map((c) => ({
      collection: c.slug,
      slug: p.slug,
    }))
  );
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const loc = locale as Locale;
  const name = product.name[loc] || product.name.fr;
  const desc = product.description[loc] || product.description.fr;
  const title = resolveSeoValue(product.seo, loc, 'title', name);
  const description = resolveSeoValue(product.seo, loc, 'metaDescription', name, desc);
  const altImage = resolveSeoValue(product.seo, loc, 'altImage', name);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{url: `${baseUrl}${product.images[0]}`, width: 600, height: 800, alt: altImage}]
    }
  };
}

export default async function ProductDetailPage({params}: Props) {
  const {locale, collection, slug} = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product, 4);
  const t = await getTranslations('common');
  const loc = locale as Locale;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const productCollection =
    product.collections.find((c) => c.slug === collection) ?? product.collections[0] ?? null;

  // Structured data must agree with the meta tags, otherwise Google can show a
  // title in search results that differs from the one the admin typed.
  const name = product.name[loc] || product.name.fr;
  const desc = product.description[loc] || product.description.fr;
  const seoName = resolveSeoValue(product.seo, loc, 'title', name);
  const seoDesc = resolveSeoValue(product.seo, loc, 'metaDescription', name, desc);

  const breadcrumbs = [
    {name: t('home'), url: '/'},
    {name: t('collections'), url: '/collections'},
    {
      name: productCollection?.name[loc] || productCollection?.name.fr || collection,
      url: `/collections/${collection}`,
    },
    {name: seoName, url: `/collections/${collection}/${product.slug}`}
  ];

  return (
    <>
      <JsonLd
        locale={loc}
        type="BreadcrumbList"
        data={{
          itemListElement: breadcrumbs.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            item: `${baseUrl}${b.url}`
          }))
        }}
      />
      <JsonLd
        locale={loc}
        type="Product"
        data={{
          name: seoName,
          description: seoDesc,
          image: product.images.map((img) => `${baseUrl}${img}`),
          sku: product.reference,
          brand: {name: 'Tissu Dubai'},
          offers: product.price
            ? {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'MAD',
                availability: product.inStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock'
              }
            : undefined
        }}
      />

      <section className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={breadcrumbs.map((b) => ({label: b.name, href: b.url}))}
          />

          <div className="mt-6">
            <ProductView product={product} locale={loc} />
          </div>

          <ProductDetails product={product} locale={loc} />

          {relatedProducts.length > 0 && (
            <RelatedProducts products={relatedProducts} locale={loc} />
          )}
        </div>
      </section>
    </>
  );
}
