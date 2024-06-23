import { z } from 'zod-http-schemas';
import { withAsyncErrorHandling } from './withAsyncErrorHandling';
import { carrierCodeSchema } from '../domain/entities';
import { Carrier, ShippingQuote, generateQuote } from '../../../api-tests/util';
import { ordersRepo } from '../repos/ordersRepo';
import { BookCarrierResult } from '../domain/operations/bookCarrier';
import { deriveBookCarrierOutcome } from '../domain/operations/bookCarrier/bookCarrier.deriver';
import { quoteCarrier } from '../domain/operations/quoteCarrier/quoteCarrier.controller';

const carrierQoutesRequestSchema = z.object({
  carrier: carrierCodeSchema,
});

const urlParamsSchema = z.object({
  id: z.string().nonempty(),
});

type Request = {
  id: string;
};

export const handlePostQoutes = withAsyncErrorHandling(async (req, res) => {
  console.log('start req {0} || carriers {1}', req.params, req.body);

  const bodyParseResult = carrierQoutesRequestSchema.safeParse(req.body);

  //   console.log('body request', JSON.stringify(bodyParseResult));
  //   if (!bodyParseResult.success) {
  //     res.status(400).json({
  //       error: 'INVALID_REQUEST_BODY',
  //       validationError: bodyParseResult.error,
  //     });
  //     return;
  //   }

  //   console.log('1');
  //   const requestValidation = urlParamsSchema.safeParse(req.params);

  //   if (!requestValidation.success) {
  //     res.status(400).json({
  //       error: 'INVALID_URL_PARAMETER',
  //       validationError: requestValidation.error,
  //     });
  //     return;
  //   }
  //   console.log('2');

  const orderId = req.params.id;
  const { carriers } = req.body;

  console.log('orderId {0} || carriers {1}', orderId, carriers);
  //   const order = await ordersRepo.getOrder(orderId);

  //   if (!order) {
  //     res.status(404).json({
  //       outcome: 'ORDER_NOT_FOUND',
  //     });
  //     return;
  //   }

  //   const qoutes: ShippingQuote[] = carriers.map((carrier: Carrier) => {
  //     // const result = deriveBookCarrierOutcome(order, carrier);
  //     return generateQuote(order, carrier);
  //   });

  //   order.status = 'QUOTED';
  //   order.quotes = qoutes;
  //   console.log('orderWithQuotes', JSON.stringify(order));

  //   const orderResponse = {
  //     outcome: 'SUCCESS',
  //     order,
  //   };

  const result = await quoteCarrier({ orderId, carriers });
  const outcomeStatusCodeMap: Record<BookCarrierResult['outcome'], number> = {
    SUCCESS: 200,
    ORDER_ALREADY_BOOKED: 400,
    ORDER_NOT_FOUND: 404,
    NO_MATCHING_QUOTE: 400,
    INVALID_ORDER_STATUS: 400,
  };

  res.status(outcomeStatusCodeMap[result.outcome]).json(result);
});
