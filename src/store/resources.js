import { createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../lib/api";
import { makeCrud, makeData } from "./crud";

export const orders = makeCrud("orders", "/orders");
export const products = makeCrud("products", "/products");
export const customers = makeCrud("customers", "/customers");
export const invoices = makeCrud("invoices", "/invoices");

export const dashboard = makeData("dashboard", "/dashboard");
export const analytics = makeData("analytics", "/analytics");
export const invoiceSummary = makeData("invoiceSummary", "/invoices/summary");
export const billing = makeData("billing", "/billing");

const mutate = (type, fn) =>
  createAsyncThunk(type, async (arg, { dispatch, rejectWithValue }) => {
    try { await fn(arg); await dispatch(billing.load()); } catch (e) { return rejectWithValue(errMsg(e)); }
  });
export const changePlan = mutate("billing/plan", (plan) => api.put("/billing/plan", { plan }));
export const cancelPlan = mutate("billing/cancel", () => api.post("/billing/cancel"));
export const updateCard = mutate("billing/card", (card) => api.put("/billing/card", card));
