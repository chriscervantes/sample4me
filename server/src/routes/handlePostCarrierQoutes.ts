import { z } from 'zod-http-schemas';
import { withAsyncErrorHandling } from './withAsyncErrorHandling';
import { carrierCodeSchema } from '../domain/entities';
import { BookCarrierResult } from '../domain/operations/bookCarrier';
import { quoteCarrier } from '../domain/operations/quoteCarrier/quoteCarrier.controller';

const carrierQuotesRequestSchema = z.object({
  carriers: z.array(carrierCodeSchema),
});

const urlParamsSchema = z.object({
  id: z.string().nonempty(),
});

type Request = {
  id: string;
};

export const handlePostCarrierQuotes = withAsyncErrorHandling(
  async (req, res) => {
    const validateBodyRequest = carrierQuotesRequestSchema.safeParse(req.body);

    console.log('body request', JSON.stringify(validateBodyRequest));
    if (!validateBodyRequest.success) {
      res.status(400).json({
        error: 'INVALID_REQUEST_BODY',
        validationError: validateBodyRequest.error,
      });
      return;
    }

    const validateRequestParam = urlParamsSchema.safeParse(req.params);
    if (!validateRequestParam.success) {
      res.status(400).json({
        error: 'INVALID_URL_PARAMETER',
        validationError: validateRequestParam.error,
      });
      return;
    }

    const orderId = validateRequestParam.data.id;
    const { carriers } = validateBodyRequest.data;

    const result = await quoteCarrier({ orderId, carriers });
    const outcomeStatusCodeMap: Record<BookCarrierResult['outcome'], number> = {
      SUCCESS: 200,
      ORDER_ALREADY_BOOKED: 400,
      ORDER_NOT_FOUND: 404,
      NO_MATCHING_QUOTE: 400,
      INVALID_ORDER_STATUS: 400,
    };

    res.status(outcomeStatusCodeMap[result.outcome]).json(result);
  }
);
