import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadMe } from "./store/authSlice";
import Layout from "./components/Layout";
import { Empty } from "./components/ui";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { OrderForm, OrderList, OrderView } from "./pages/Orders";
import { ProductForm, ProductList, ProductView } from "./pages/Products";
import { CustomerForm, CustomerList, CustomerView } from "./pages/Customers";
import { InvoiceForm, InvoiceList, InvoiceView } from "./pages/Invoices";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

function Guard({ children, guest }) {
  const { user, ready } = useSelector((s) => s.auth);
  if (!ready) return <Empty text="Loading…" />;
  if (guest) return user ? <Navigate to="/" replace /> : children;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  useEffect(() => { dispatch(loadMe()); }, [dispatch]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<Guard guest><AuthPage mode="login" /></Guard>} />
      <Route path="/register" element={<Guard guest><AuthPage mode="register" /></Guard>} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/create" element={<OrderForm />} />
        <Route path="orders/:id" element={<OrderView />} />
        <Route path="orders/:id/edit" element={<OrderForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductView />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/create" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerView />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/create" element={<InvoiceForm />} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
