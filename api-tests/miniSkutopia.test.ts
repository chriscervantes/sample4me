import axios from "axios";
import { expect } from "chai";
import {
  calculateCarrierFees,
  generateQuote,
  loadFixture,
  SalesOrder,
} from "./util";
import { ordersRepo } from "../server/src/repos/ordersRepo";
import { Order } from "../server/src/domain/entities";

import { writeFileSync } from "fs";

const apiClient = axios.create({
  baseURL: "http://localhost:8044/",
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  },
});

const ORDERS = loadFixture<{ salesOrders: SalesOrder[] }>(
  "sales-orders.json"
).salesOrders;

describe("A mini SKUTOPIA API", () => {
  it("should successfully receive an order", async () => {
    const result = await apiClient.post("/orders", ORDERS[0]);
    expect(result.status).to.eq(200);
    expect(result.data).to.deep.eq({
      outcome: "SUCCESS",
      order: {
        ...ORDERS[0],
        quotes: [],
        status: "RECEIVED",
      },
    });
  });
  it("should list all orders", async () => {
    const result = await apiClient.get("/orders");
    expect(result.status).to.eq(200);
    expect(result.data).to.deep.eq({
      orders: [{ ...ORDERS[0], status: "RECEIVED", quotes: [] }],
    });
  });
  it("receives more orders", async () => {
    const result1 = apiClient.post("/orders", ORDERS[1]);
    const result2 = apiClient.post("/orders", ORDERS[2]);
    expect((await result1).status).to.eq(200);
    expect((await result2).status).to.eq(200);
  });
  it("should generate a quote for a RECEIVED order", async () => {
    const result = await apiClient.post(`/orders/${ORDERS[0].id}/quotes`, {
      carriers: ["UPS", "USPS", "FEDEX"],
    });

    expect(result.status).to.eq(200);
    expect(result.data).to.deep.eq({
      outcome: "SUCCESS",
      order: {
        ...ORDERS[0],
        status: "QUOTED",
        quotes: [
          generateQuote(ORDERS[0], "UPS"),
          generateQuote(ORDERS[0], "USPS"),
          generateQuote(ORDERS[0], "FEDEX"),
        ],
      },
    });
  });
  it("should return 404 for a non-existent order", async () => {
    const result = await apiClient.post(`/orders/123456/quotes`, {
      carriers: ["UPS", "FEDEX", "USPS"],
    });
    expect(result.status).to.eq(404);
    expect(result.data).to.deep.eq({
      outcome: "ORDER_NOT_FOUND",
    });
  });
  it("should successfully book an order", async () => {
    const result = await apiClient.post(`/orders/${ORDERS[0].id}/bookings`, {
      carrier: "UPS",
    });
    expect(result.status).to.eq(200);
    expect(result.data).to.deep.eq({
      outcome: "SUCCESS",
      order: {
        ...ORDERS[0],
        status: "BOOKED",
        quotes: [
          generateQuote(ORDERS[0], "UPS"),
          generateQuote(ORDERS[0], "USPS"),
          generateQuote(ORDERS[0], "FEDEX"),
        ],
        carrierPricePaid: calculateCarrierFees("UPS", ORDERS[0].items),
        carrierBooked: "UPS",
      },
    });
  });
  it("should return NO MATCHING QUOTE when attempting to book an order without a matching quote", async () => {
    await apiClient.post(`/orders/${ORDERS[1].id}/quotes`, {
      carriers: ["USPS", "FEDEX"],
    });
    const result = await apiClient.post(`/orders/${ORDERS[1].id}/bookings`, {
      carrier: "UPS",
    });
    expect(result.status).to.eq(400);
    expect(result.data).to.deep.eq({
      outcome: "NO_MATCHING_QUOTE",
      quotes: [
        generateQuote(ORDERS[1], "USPS"),
        generateQuote(ORDERS[1], "FEDEX"),
      ],
    });
  });
  it("should return ORDER ALREADY BOOKED when requesting a quote for a BOOKED order", async () => {
    const result = await apiClient.post(`/orders/${ORDERS[0].id}/quotes`, {
      carriers: ["UPS", "FEDEX", "USPS"],
    });

    expect(result.status).to.eq(400);
    expect(result.data.outcome).to.eq("ORDER_ALREADY_BOOKED");
  });
  it("should list more orders", async () => {
    const result = await apiClient.get("/orders");

    // Get the order from database and used it to compare the response from getOrders endpoints, we should get the same amount of records
    const orders = await ordersRepo.getOrders();
    const { orders: orderResultData } = result.data;

    expect(result.status).to.eq(200);

    orders.forEach((order: Order) => {
      const matchOrder = orderResultData.find(
        (orderResult: Order) => orderResult.id === order.id
      );
      expect(matchOrder).to.deep.eq(order);
    });
  });
  it("should list the BOOKED orders", async () => {
    const result = await apiClient.get("/orders?status=BOOKED");
    expect(result.status).to.eq(200);

    const bookedOrders = await (
      await ordersRepo.getOrders()
    ).filter((order) => order.status === "BOOKED");

    const { orders: orderResultData } = result.data;

    bookedOrders.forEach((order: Order) => {
      const matchOrder = orderResultData.find(
        (orderResult: Order) => orderResult.id === order.id
      );
      expect(matchOrder).to.deep.eq(order);
    });
  });
});
