import type {Locale} from '@/types';

// ── Types ──

export type TranslatableText = Record<Locale, string>;

export type BusinessDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BusinessHours {
  day: BusinessDay;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface FaqEntry {
  id: string;
  question: TranslatableText;
  answer: TranslatableText;
}

export interface ContactInfo {
  address: string;
  phones: string[];
  whatsappNumber: string;
  social: {instagram?: string; tiktok?: string; facebook?: string};
}

export type CollectionCardId = 'caftan' | 'jellaba' | 'tekchita';

export const COLLECTION_CARDS: ReadonlyArray<{id: CollectionCardId; label: string}> = [
  {id: 'caftan', label: 'Caftan'},
  {id: 'jellaba', label: 'Djellaba'},
  {id: 'tekchita', label: 'Takchita'},
];

/** The women's sub-collections grouped under the "Femme" entry point. */
export const WOMEN_COLLECTION_SLUGS: readonly string[] = ['caftan', 'jellaba', 'tekchita'];

export interface CollectionCard {
  id: CollectionCardId;
  image: string;
  title: TranslatableText;
  description: TranslatableText;
}

export interface HeroSettings {
  image: string;
  title: TranslatableText;
  subtitle: TranslatableText;
}

export interface HomepageContent {
  hero: HeroSettings;
  collectionCards: CollectionCard[];
}

export interface SiteSettings {
  contact: ContactInfo;
  businessHours: BusinessHours[];
  faq: FaqEntry[];
  homepage: HomepageContent;
}

export interface ResolvedContact {
  address: string;
  phones: string[];
  primaryPhone: string;
  whatsappNumber: string;
  social: {instagram: string; tiktok: string; facebook: string};
}

export interface BusinessHoursDisplay {
  day: BusinessDay;
  days: BusinessDay[];
  label: string;
  isClosed: boolean;
  value: string;
}

// ── Constants ──

export const DAY_ORDER: BusinessDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<BusinessDay, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

export const SOCIAL_LABELS: Record<keyof NonNullable<ContactInfo['social']>, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
};

// ── Defaults / placeholders ──

let uidCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${uidCounter++}`;

const text = (fr = '', en = '', ar = ''): TranslatableText => ({fr, en, ar});

export function createEmptyText(): TranslatableText {
  return text();
}

export function getDefaultSiteSettings(): SiteSettings {
  return {
    contact: {
      address: "12 Rue des Étoiles, Casablanca, Maroc",
      phones: ['+212 6 12 34 56 78'],
      whatsappNumber: '+212 6 12 34 56 78',
      social: {
        instagram: 'https://instagram.com/tissudubai',
        tiktok: 'https://tiktok.com/@tissudubai',
        facebook: 'https://facebook.com/tissudubai',
      },
    },
    businessHours: DAY_ORDER.map((day) => ({
      day,
      isClosed: day === 'sunday',
      openTime: '09:00',
      closeTime: '19:00',
    })),
    faq: [
      {
        id: uid('faq'),
        question: text(
          'Quels types de tissus proposez-vous ?',
          'What types of fabrics do you offer?',
          'ما أنواع الأقمشة التي تقدمونها؟'
        ),
        answer: text(
          "Nous proposons une large gamme de tissus premium destinés à la confection de vêtements traditionnels marocains : caftans, djellabas, takchitas, ainsi que des tissus pour créations sur mesure. Nos collections incluent des soies, des brocades, des velours, des cotonnades de luxe et bien plus.",
          'We offer a wide range of premium fabrics for traditional Moroccan clothing: caftans, djellabas, takchitas, as well as fabrics for bespoke creations. Our collections include silks, brocades, velvets, luxury cotton, and more.',
          'نقدم مجموعة واسعة من الأقمشة الفاخرة المخصصة لتصميم الملابس التقليدية المغربية: الكفتان، الجلابة، التكشيطة، بالإضافة إلى أقمشة للتصميم حسب الطلب. تتضمن مجموعاتنا الحرير، البروكار، المخمل، القطن الفاخر والمزيد.'
        ),
      },
      {
        id: uid('faq'),
        question: text('Vendez-vous au mètre ?', 'Do you sell by the meter?', 'هل تبيعون بالمتر؟'),
        answer: text(
          "Oui, tous nos tissus sont vendus au mètre. La plupart de nos tissus sont disponibles en largeurs standard de 1,40 m à 3 mètres, selon les références.",
          'Yes, all our fabrics are sold by the meter. Most of our fabrics are available in standard widths from 1.40m to 3 meters, depending on the reference.',
          'نعم، جميع أقمشتنا تُبع بالمتر. معظم أقمشتنا متوفرة بعروض معيارية من 1.40 م إلى 3 أمتار، حسب المراجع.'
        ),
      },
      {
        id: uid('faq'),
        question: text(
          "Comment vérifier la disponibilité d'un tissu ?",
          'How can I check fabric availability?',
          'كيف أتحقق من توفر قماش معين؟'
        ),
        answer: text(
          "Vous pouvez vérifier la disponibilité directement sur notre site web, ou nous contacter par téléphone ou WhatsApp pour une confirmation immédiate. Notre équipe se tient à votre disposition pour toute information.",
          'You can check availability directly on our website, or contact us by phone or WhatsApp for immediate confirmation. Our team is available to provide any information.',
          'يمكنكم التحقق من التوفر مباشرة على موقعنا، أو الاتصال بنا عبر الهاتف أو واتساب للحصول على تأكيد فوري. فريقنا متاح لتقديم جميع المعلومات.'
        ),
      },
      {
        id: uid('faq'),
        question: text(
          'Comment passer une commande ?',
          'How do I place an order?',
          'كيف أضع طلباً؟'
        ),
        answer: text(
          "Pour commander, il vous suffit de nous contacter via WhatsApp en nous indiquant la référence du tissu, la couleur souhaitée et la quantité. Nous vous confirmerons la disponibilité et le prix, puis organiserons la suite.",
          'To place an order, simply contact us via WhatsApp with the fabric reference, desired color, and quantity. We will confirm availability and pricing, and arrange the next steps.',
          'لتقديم طلب، يكفيكم التواصل معنا عبر واتساب مع ذكر مرجع القماش واللون المطلوب والكمية. سنجيبكم بالتوفر والسعر، ثم نتشرف بخدمة ما يلي.'
        ),
      },
      {
        id: uid('faq'),
        question: text('Où êtes-vous situés ?', 'Where are you located?', 'أين أنتم موجودون؟'),
        answer: text(
          "Notre magasin est situé au cœur de Casablanca. Vous pouvez retrouver notre adresse exacte et nos horaires d'ouverture sur la page 'Notre Magasin'.",
          "Our store is located in the heart of Casablanca. You can find our exact address and opening hours on the 'Our Store' page.",
          "محلنا موجود في قلب الدار البيضاء. يمكنكم العثور على عنواننا الدقيق وساعات العمل في صفحة 'محلنا'."
        ),
      },
      {
        id: uid('faq'),
        question: text(
          'Proposez-vous des échantillons ?',
          'Do you offer samples?',
          'هل تقدمون عينات؟'
        ),
        answer: text(
          "Oui, nous pouvons vous envoyer des échantillons pour vous permettre de voir et toucher les tissus avant de commander. Contactez-nous via WhatsApp pour en savoir plus.",
          'Yes, we can send samples so you can see and feel the fabrics before ordering. Contact us via WhatsApp to learn more.',
          'نعم، يمكننا إرسال عينات لتمكينكم من رؤية ولمس الأقمشة قبل الطلب. تواصلوا معنا عبر واتساب لمزيد من المعلومات.'
        ),
      },
      {
        id: uid('faq'),
        question: text(
          "Livrez-vous à l'intérieur du Maroc ?",
          'Do you deliver within Morocco?',
          'هل تقومون بالتوصيل داخل المغرب؟'
        ),
        answer: text(
          "Oui, nous assurons la livraison dans tout le Maroc. Contactez-nous pour plus de détails sur les modalités de livraison et les tarifs.",
          'Yes, we offer delivery throughout Morocco. Contact us for more details on delivery options and rates.',
          'نعم، نوفر التوصيل في جميع أنحاء المغرب. تواصلوا معنا لمزيد من التفاصيل حول شروط التوصيل والأسعار.'
        ),
      },
    ],

    homepage: {
      hero: {
        image: '',
        title: text(
          "L'Excellence du Tissu au Maroc",
          'The Excellence of Moroccan Fabric',
          'فخامة الأقمشة في المغرب'
        ),
        subtitle: text(
          "Découvrez notre collection exclusive de tissus premium, soigneusement sélectionnés pour les créations les plus prestigieuses.",
          'Discover our exclusive collection of premium fabrics, carefully selected to form the foundation of the most prestigious creations.',
          'اكتشفوا مجموعتنا الحصرية من الأقمشة الفاخرة، المختارة بعناية لتكون أساس أرقى الإبداعات.'
        ),
      },
      collectionCards: [
        {
          id: 'caftan',
          image: '',
          title: text('Caftan', 'Caftan', 'الكفتان'),
          description: text(
            "Soies, brocades et velours pour un caftan d'exception",
            'Silks, brocades, and velvets for an exceptional caftan',
            'حرير، بروكار، ومخمل لكفتان استثنائي'
          ),
        },
        {
          id: 'jellaba',
          image: '',
          title: text('Djellaba', 'Djellaba', 'الجلابة'),
          description: text(
            'Laines, cachemires et tissus légers pour une jellaba élégante',
            'Wools, cashmeres, and lightweight fabrics for an elegant jellaba',
            'صوف، كشمير، وأقمشة خفيفة لجلابة أنيقة'
          ),
        },
        {
          id: 'tekchita',
          image: '',
          title: text('Takchita', 'Takchita', 'التكشيطة'),
          description: text(
            'Tissus riches et soyeux pour une tekchita rayonnante',
            'Rich and silky fabrics for a radiant tekchita',
            'أقمشة غنية وحريرية لتكشيطة متألقة'
          ),
        },
      ],
    },
  };
}

// ── Migration / normalization ──

type LegacyHomepage = Partial<HomepageContent> & {categoryCards?: CollectionCard[]};

export function migrateSiteSettings(input: unknown): SiteSettings {
  const defaults = getDefaultSiteSettings();
  if (!input || typeof input !== 'object') return defaults;

  const settings = input as Partial<SiteSettings> & {homepage?: LegacyHomepage};
  const homepage: LegacyHomepage = settings.homepage ?? {};

  return {
    contact: settings.contact ?? defaults.contact,
    businessHours: settings.businessHours ?? defaults.businessHours,
    faq: settings.faq ?? defaults.faq,
    homepage: {
      hero: homepage.hero ?? defaults.homepage.hero,
      collectionCards:
        homepage.collectionCards ?? homepage.categoryCards ?? defaults.homepage.collectionCards,
    },
  };
}

// ── Resolution helpers ──
// DB/admin settings are the source of truth; the NEXT_PUBLIC_* env vars are
// only fallbacks for when a DB field is empty.

const CLOSED_LABEL: Record<Locale, string> = {
  fr: 'Fermé',
  en: 'Closed',
  ar: 'مغلق',
};

const DAY_INDEX: Record<BusinessDay, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export const WEEKDAY_SCHEMA_NAME: Record<BusinessDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function weekdayLabel(day: BusinessDay, locale: Locale): string {
  const date = new Date(Date.UTC(2024, 0, 1 + DAY_INDEX[day]));
  return new Intl.DateTimeFormat(locale, {weekday: 'long', timeZone: 'UTC'}).format(date);
}

export function resolveContact(settings: SiteSettings): ResolvedContact {
  const contact = settings.contact;
  const phones = contact.phones.map((phone) => phone.trim()).filter(Boolean);

  return {
    address: contact.address.trim() || process.env.NEXT_PUBLIC_STORE_ADDRESS || '',
    phones,
    primaryPhone: phones[0] || process.env.NEXT_PUBLIC_STORE_PHONE || '',
    whatsappNumber: contact.whatsappNumber.trim() || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
    social: {
      instagram: contact.social.instagram || process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
      tiktok: contact.social.tiktok || process.env.NEXT_PUBLIC_TIKTOK_URL || '',
      facebook: contact.social.facebook || process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    },
  };
}

export function formatBusinessHours(
  hours: BusinessHours[],
  locale: Locale
): BusinessHoursDisplay[] {
  const byIndex = new Map<BusinessDay, BusinessHours>();
  for (const hour of hours) {
    if (DAY_INDEX[hour.day] !== undefined) byIndex.set(hour.day, hour);
  }
  const ordered = DAY_ORDER.map((day) => byIndex.get(day)).filter(
    (h): h is BusinessHours => h != null
  );

  // Group consecutive days that share the exact same schedule into a single row.
  const runs: Array<{days: BusinessDay[]; isClosed: boolean; value: string}> = [];
  for (const hour of ordered) {
    const value =
      hour.isClosed || !hour.openTime || !hour.closeTime
        ? CLOSED_LABEL[locale]
        : `${hour.openTime} – ${hour.closeTime}`;
    const current = runs[runs.length - 1];
    if (current && current.value === value) {
      current.days.push(hour.day);
    } else {
      runs.push({days: [hour.day], isClosed: hour.isClosed, value});
    }
  }

  return runs.map((run) => ({
    day: run.days[0],
    days: run.days,
    label: weekdayRangeLabel(run.days, locale),
    isClosed: run.isClosed,
    value: run.value,
  }));
}

function weekdayRangeLabel(days: BusinessDay[], locale: Locale): string {
  const start = weekdayLabel(days[0], locale);
  if (days.length === 1) return start;
  const end = weekdayLabel(days[days.length - 1], locale);
  return `${start} – ${end}`;
}