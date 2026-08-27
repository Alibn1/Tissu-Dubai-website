import {describe, it, expect} from 'vitest';
import {generateWhatsAppMessage, buildWhatsAppUrl} from './index';

describe('WhatsApp Service', () => {
  const baseParams = {
    productName: 'Soie Royale Dubai',
    reference: 'TD-CAF-0001',
    color: 'Bordeaux',
    quantity: 4
  };

  describe('generateWhatsAppMessage', () => {
    it('generates French message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'fr'});
      expect(message).toContain('Bonjour, je souhaite commander');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('TD-CAF-0001');
      expect(message).toContain('Bordeaux');
      expect(message).toContain('4 mètres');
    });

    it('generates Arabic message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'ar'});
      expect(message).toContain('مرحباً');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('4 متر');
    });

    it('generates English message', () => {
      const message = generateWhatsAppMessage({...baseParams, locale: 'en'});
      expect(message).toContain('Hello, I would like to order');
      expect(message).toContain('Soie Royale Dubai');
      expect(message).toContain('4 meters');
    });

    it('uses singular for quantity 1', () => {
      const message = generateWhatsAppMessage({...baseParams, quantity: 1, locale: 'en'});
      expect(message).toContain('1 meter');
      expect(message).not.toContain('1 meters');
    });

    it('uses plural for quantity > 1', () => {
      const message = generateWhatsAppMessage({...baseParams, quantity: 5, locale: 'en'});
      expect(message).toContain('5 meters');
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
