import type {Locale} from '@/types';

type WhatsAppMessageParams = {
  productName: string;
  reference: string;
  color: string;
  quantity: number;
  locale: Locale;
};

const messages: Record<Locale, (params: WhatsAppMessageParams) => string> = {
  fr: ({productName, reference, color, quantity}) =>
    `Bonjour, je souhaite commander :\n\n` +
    `Tissu : ${productName}\n` +
    `Référence : ${reference}\n` +
    `Couleur : ${color}\n` +
    `Quantité : ${quantity}\n\n` +
    `Merci de me confirmer la disponibilité.`,
  ar: ({productName, reference, color, quantity}) =>
    `مرحباً، أريد الطلب ما يلي :\n\n` +
    `القماش : ${productName}\n` +
    `المرجع : ${reference}\n` +
    `اللون : ${color}\n` +
    `الكمية : ${quantity}\n\n` +
    `شكراً لتأكيد التوفر.`,
  en: ({productName, reference, color, quantity}) =>
    `Hello, I would like to order:\n\n` +
    `Fabric: ${productName}\n` +
    `Reference: ${reference}\n` +
    `Color: ${color}\n` +
    `Quantity: ${quantity}\n\n` +
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
