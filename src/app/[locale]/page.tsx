import {setRequestLocale} from 'next-intl/server';
import {JsonLd} from '@/lib/seo/JsonLd';
import {HeroSection} from '@/components/home/HeroSection';
import {CollectionsSection} from '@/components/home/CollectionsSection';
import {FeaturedSection} from '@/components/home/FeaturedSection';
import {NewArrivalsSection} from '@/components/home/NewArrivalsSection';
import {BrandStorySection} from '@/components/home/BrandStorySection';
import {WhyUsSection} from '@/components/home/WhyUsSection';
import {WhatsAppCtaSection} from '@/components/home/WhatsAppCtaSection';
import {StoreLocationSection} from '@/components/home/StoreLocationSection';
import {type Locale} from '@/types';

type Props = {
  params: Promise<{locale: string}>;
};

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd locale={locale as Locale} type="LocalBusiness" />
      <JsonLd locale={locale as Locale} type="WebSite" />
      <HeroSection />
      <CollectionsSection />
      <FeaturedSection />
      <NewArrivalsSection />
      <BrandStorySection />
      <WhyUsSection />
      <WhatsAppCtaSection />
      <StoreLocationSection />
    </>
  );
}
