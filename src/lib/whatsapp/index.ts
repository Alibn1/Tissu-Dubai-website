import type {Locale} from '@/types';

type WhatsAppMessageParams = {
  productName: string;
  reference: string;
  color: string;
  quantity: number;
  name: string;
  phone: string;
  locale: Locale;
};

const messages: Record<Locale, (params: WhatsAppMessageParams) => string> = {
  fr: ({productName, reference, color, quantity, name, phone}) =>
    `Bonjour, je suis ${name}.\n\n` +
    `Je souhaite commander :\n` +
    `• ${productName}\n` +
    `Référence : ${reference}\n` +
    `Couleur : ${color}\n` +
    `Quantité : ${quantity}\n\n` +
    `Mon téléphone : ${phone}\n\n` +
    `Merci de me confirmer la disponibilité.`,
  ar: ({productName, reference, color, quantity, name, phone}) =>
    `مرحباً، أنا ${name}.\n\n` +
    `أريد طلب ما يلي :\n` +
    `• ${productName}\n` +
    `المرجع : ${reference}\n` +
    `اللون : ${color}\n` +
    `الكمية : ${quantity}\n\n` +
    `هاتفي : ${phone}\n\n` +
    `شكراً لتأكيد التوفر.`,
  en: ({productName, reference, color, quantity, name, phone}) =>
    `Hello, I am ${name}.\n\n` +
    `I would like to order:\n` +
    `• ${productName}\n` +
    `Reference: ${reference}\n` +
    `Color: ${color}\n` +
    `Quantity: ${quantity}\n\n` +
    `My phone: ${phone}\n\n` +
    `Please confirm availability.`
};

export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  const generator = messages[params.locale] || messages.fr;
  return generator(params);
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
}

export function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
}
