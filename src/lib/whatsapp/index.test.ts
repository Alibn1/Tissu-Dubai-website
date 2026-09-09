import {describe, it, expect} from 'vitest';
import {generateWhatsAppMessage, buildWhatsAppUrl} from './index';

describe('WhatsApp Service', () => {
  const baseParams = {
    productName: 'Soie Royale Dubai',
    reference: 'TD-CAF-0001',
    color: 'Bordeaux',
    quantity: 4,
    name: 'Karim',
    phone: '0612345678'
  };

  describe('generateWhatsAppMessage', () => {
    it('generates French message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'fr'});
      expect(message).toContain('Bonjour, je suis Karim');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('TD-CAF-0001');
      expect(message).toContain('Bordeaux');
      expect(message).toContain('Quantité : 4');
      expect(message).toContain('Mon téléphone : 0612345678');
    });

    it('generates Arabic message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'ar'});
      expect(message).toContain('مرحباً');
      expect(message).toContain('Karim');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('الكمية : 4');
      expect(message).toContain('0612345678');
    });

    it('generates English message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'en'});
      expect(message).toContain('Hello, I am Karim');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('Quantity: 4');
      expect(message).toContain('My phone: 0612345678');
    });

    it('includes the quantity number', () => {
      const message = generateWhatsAppMessage({...baseParams, quantity: 1, locale: 'en'});
      expect(message).toContain('Quantity: 1');
    });

    it('includes the quantity number for multiple items', () => {
      const message = generateWhatsAppMessage({...baseParams, quantity: 5, locale: 'en'});
      expect(message).toContain('Quantity: 5');
    });
  });

  describe('buildWhatsAppUrl', () => {
    it('builds correct URL with phone and message', () => {
      const url = buildWhatsAppUrl('+212612345678', 'Hello');
      expect(url).toContain('https://wa.me/212612345678');
      expect(url).toContain('text=Hello');
    });

    it('strips non-numeric characters from phone', () => {
      const url = buildWhatsAppUrl('+212 612 345 678', 'Test');
      expect(url).toContain('wa.me/212612345678');
    });

    it('encodes message properly', () => {
      const url = buildWhatsAppUrl('+212612345678', 'Bonjour, je souhaite commander');
      expect(url).toContain('Bonjour%2C%20je');
    });
  });
});
