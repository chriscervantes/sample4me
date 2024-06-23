import { checkNoMatching } from '../../../../../api-tests/util';
import { CarrierCode, Order } from '../../entities';

type Success = {
  outcome: 'SUCCESS';
  order: Order;
};
type NoMatchingQuote = {
  outcome: 'NO_MATCHING_QUOTE';
  quotes: Order['quotes'];
};
type InvalidOrderStatus = {
  outcome: 'INVALID_ORDER_STATUS';
  expected: 'QUOTED';
  actual: Order['status'];
};
type OrderNotFound = {
  outcome: 'ORDER_NOT_FOUND';
};
type OrderAlreadyBooked = {
  outcome: 'ORDER_ALREADY_BOOKED';
  order: Order;
};

export type QuoteCarrierResult =
  | Success
  | NoMatchingQuote
  | OrderAlreadyBooked
  | OrderNotFound;

export const deriveQuoteCarrierOutcome = (
  order: Order,
  carriers: CarrierCode[]
): QuoteCarrierResult => {
  if (order.status === 'BOOKED') {
    return {
      order,
      outcome: 'ORDER_ALREADY_BOOKED',
    };
  }

  // const matchQuotes = carriers
  //   .map((carrier) => {
  //     return order.quotes.find((quote) => quote.carrier === carrier);
  //   })
  //   .filter((order) => order);

  if (!checkNoMatching(order, carriers)) {
    return {
      outcome: 'NO_MATCHING_QUOTE',
      quotes: order.quotes,
    };
  }

  return {
    outcome: 'SUCCESS',
    order: {
      ...order,
      status: 'QUOTED',
    },
  };
};
