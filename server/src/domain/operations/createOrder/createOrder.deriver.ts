import { Order, OrderInput } from '../../entities';

type Success = {
  outcome: 'SUCCESS';
  order: Order;
};
type OrderAlreadyExists = {
  outcome: 'ORDER_ALREADY_EXISTS';
  order: Order;
};
type OrderHasNoLineItems = {
  outcome: 'ORDER_HAS_NO_LINE_ITEMS';
};

export type CreateOrderResult =
  | Success
  | OrderAlreadyExists
  | OrderHasNoLineItems;

  enum OutcomeResponse  {
    alreadyExists = 'ORDER_ALREADY_EXISTS',
    noLimits = 'ORDER_HAS_NO_LINE_ITEMS',
    success = 'SUCCESS'
  }

export const deriveCreateOrderOutcome = (
  orderInput: OrderInput,
  existingOrder?: Order
): CreateOrderResult => {
  if (existingOrder) {
    return {
      outcome: OutcomeResponse.alreadyExists,
      order: existingOrder,
    };
  }
  if (orderInput.items.length === 0) {
    return {
      outcome: OutcomeResponse.noLimits,
    };
  }

  return {
    outcome: OutcomeResponse.success,
    order: {
      ...orderInput,
      status: 'RECEIVED',
      quotes: [],
    },
  };
};
