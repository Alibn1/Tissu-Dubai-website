import {SectionHeading} from '@/components/ui/SectionHeading';
import {CategoryCards} from '@/components/category/CategoryCards';

export async function CategoriesSection() {
  const t = await (await import('next-intl/server')).getTranslations('home.categories');

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />

        <CategoryCards />
      </div>
    </section>
  );
}
