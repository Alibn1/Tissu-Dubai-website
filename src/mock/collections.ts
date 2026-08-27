import type {Collection} from '@/types';

export const collections: Collection[] = [
  {
    id: 'col-1',
    slug: 'royal-heritage',
    name: {fr: 'Patrimoine Royal', ar: 'التراث الملكي', en: 'Royal Heritage'},
    description: {
      fr: 'Une collection inspirée des plus beaux caftans royaux marocains, alliant tradition et noblesse.',
      ar: 'مجموعة مستوحاة من أجمل الكفتانات الملكية المغربية، تجمع بين التقاليد والróyalité.',
      en: 'A collection inspired by the finest Moroccan royal caftans, combining tradition and nobility.'
    },
    image: '/images/collections/royal-heritage.svg',
    productCount: 5
  },
  {
    id: 'col-2',
    slug: 'casablanca-gold',
    name: {fr: 'Casablanca Gold', ar: 'كازابلانكا غولد', en: 'Casablanca Gold'},
    description: {
      fr: 'Des tissus dorés et chatoyants qui évoquent la splendeur de Casablanca.',
      ar: 'أقمشة ذهبية لامعة تستحضر روعة الدار البيضاء.',
      en: 'Golden and shimmering fabrics that evoke the splendor of Casablanca.'
    },
    image: '/images/collections/casablanca-gold.svg',
    productCount: 4
  },
  {
    id: 'col-3',
    slug: 'silk-dreams',
    name: {fr: 'Rêves de Soie', ar: 'أحلام الحرير', en: 'Silk Dreams'},
    description: {
      fr: 'La finesse et la douceur du soie dans notre collection la plus élégante.',
      ar: 'نعومة الحرير في أكثر مجموعاتنا أناقة.',
      en: 'The fineness and softness of silk in our most elegant collection.'
    },
    image: '/images/collections/silk-dreams.svg',
    productCount: 6
  }
];
