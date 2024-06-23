import {
  Carrier,
  ShippingQuote,
  generateQuote,
} from '../../../../../api-tests/util';
import { ordersRepo } from '../../../repos/ordersRepo';
import { CarrierCode, Order } from '../../entities';
import {
  QuoteCarrierResult,
  deriveQuoteCarrierOutcome,
} from './quoteCarrier.deriver';

export const quoteCarrier = async ({
  orderId,
  carriers,
}: {
  orderId: Order['id'];
  carriers: CarrierCode[];
}): Promise<QuoteCarrierResult> => {
  const order = await ordersRepo.getOrder(orderId);

  if (!order) {
    return {
      outcome: 'ORDER_NOT_FOUND',
    };
  }

  const quotes = carriers.map((carrier: Carrier) => {
    return generateQuote(order, carrier);
  });

  order.quotes = quotes;

  const result = deriveQuoteCarrierOutcome(order, carriers);

  if (result.outcome === 'SUCCESS') {
    await ordersRepo.updateOrder({ ...result.order });
  }
  return result;
};

export { QuoteCarrierResult };
