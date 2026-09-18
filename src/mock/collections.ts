import type {Collection} from '@/types';

export const collections: Collection[] = [
  {
    id: 'cat-1',
    slug: 'caftan',
    name: {fr: 'Caftan', ar: 'الكفتان', en: 'Caftan'},
    description: {
      fr: 'Soies, brocades et velours pour un caftan d\'exception',
      ar: 'حرير، بروكار، ومخمل لكفتان استثنائي',
      en: 'Silks, brocades, and velvets for an exceptional caftan'
    },
    image: '/images/categories/caftan.svg',
    productCount: 7
  },
  {
    id: 'cat-2',
    slug: 'jellaba',
    name: {fr: 'Djellaba', ar: 'الجلابة', en: 'Djellaba'},
    description: {
      fr: 'Laines, cachemires et tissus légers pour une djellaba élégante',
      ar: 'صوف، كشمير، وأقمشة خفيفة لجلابة أنيقة',
      en: 'Wools, cashmeres, and lightweight fabrics for an elegant djellaba'
    },
    image: '/images/categories/jellaba.svg',
    productCount: 5
  },
  {
    id: 'cat-3',
    slug: 'tekchita',
    name: {fr: 'Takchita', ar: 'التكشيطة', en: 'Takchita'},
    description: {
      fr: 'Tissus riches et soyeux pour une takchita rayonnante',
      ar: 'أقمشة غنية وحريرية لتكشيطة متألقة',
      en: 'Rich and silky fabrics for a radiant takchita'
    },
    image: '/images/categories/tekchita.svg',
    productCount: 4
  }
];
