import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import ui from "./uiSlice";
import * as r from "./resources";

export const store = configureStore({
  reducer: {
    auth, ui,
    orders: r.orders.reducer,
    products: r.products.reducer,
    customers: r.customers.reducer,
    invoices: r.invoices.reducer,
    dashboard: r.dashboard.reducer,
    analytics: r.analytics.reducer,
    invoiceSummary: r.invoiceSummary.reducer,
    billing: r.billing.reducer,
  },
});
