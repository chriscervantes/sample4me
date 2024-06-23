import { expect } from 'chai';
import { Order } from '../../entities';
import { deriveQuoteCarrierOutcome } from './quoteCarrier.deriver';
import { calculateCarrierFees } from '../../../../../api-tests/util';

const mockOrder: Order = {
  id: '123',
  carrierBooked: 'UPS',
  carrierPricePaid: 925,
  customer: 'Sally Bob',
  items: [
    {
      sku: 'SHOE-RED-1',
      quantity: 1,
      gramsPerItem: 100,
      price: 20,
    },
  ],
  quotes: [
    {
      carrier: 'UPS',
      priceCents: 925,
    },
    {
      carrier: 'FEDEX',
      priceCents: 1075,
    },
    {
      carrier: 'USPS',
      priceCents: 1100,
    },
  ],
  status: 'RECEIVED',
};

describe('QuoteCarrier.deriver', () => {
  it('returns ORDER ALREADY BOOKED when passed a booked order', () => {
    const result = deriveQuoteCarrierOutcome(
      {
        ...mockOrder,
        status: 'BOOKED',
      },
      ['FEDEX']
    );
    expect(result.outcome).to.eq('ORDER_ALREADY_BOOKED');
  });
  it('returns NO MATCHING QUOTE when a quote does not exist for requested carrier', () => {
    const quotes: Order['quotes'] = [
      {
        carrier: 'FEDEX',
        priceCents: 1000,
      },
      {
        carrier: 'USPS',
        priceCents: 1100,
      },
    ];

    mockOrder.quotes = quotes;

    const result = deriveQuoteCarrierOutcome(
      {
        ...mockOrder,
        quotes,
      },
      ['UPS']
    );

    expect(result).to.deep.eq({
      outcome: 'NO_MATCHING_QUOTE',
      quotes,
    });
  });
  it('returns SUCCESS for making a successful quotes', () => {
    const quotes: Order['quotes'] = [
      {
        carrier: 'UPS',
        priceCents: 1000,
      },
    ];

    mockOrder.quotes = quotes;

    mockOrder.carrierPricePaid = calculateCarrierFees('UPS', mockOrder.items);

    const result = deriveQuoteCarrierOutcome(
      {
        ...mockOrder,
      },
      ['UPS']
    );

    expect(result).to.deep.eq({
      outcome: 'SUCCESS',
      order: {
        ...mockOrder,
        status: 'QUOTED',
        carrierPricePaid: mockOrder.carrierPricePaid,
        carrierBooked: 'UPS',
      },
    });
  });
});
