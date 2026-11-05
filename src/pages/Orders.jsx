import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { customers, orders, products } from "../store/resources";
import { fmtDate, money } from "../lib/format";
import { Badge } from "../components/ui";
import ListPage from "../components/ListPage";
import ResourceForm from "../components/ResourceForm";
import ResourceView from "../components/ResourceView";

const statuses = ["Complete", "Pending", "Cancel"];
const payments = ["Card", "UPI", "COD"];

export const OrderList = () => (
  <ListPage crud={orders} title="List" crumb="OrderList" base="/orders" statuses={statuses}
    columns={[
      { label: "Order", render: (r) => <Link to={`/orders/${r._id}`}>#{r.code}</Link> },
      { label: "Customer", render: (r) => r.customer?.name },
      { label: "Branch", render: (r) => r.branch },
      { label: "Payment", render: (r) => r.payment },
      { label: "Qty", render: (r) => r.qty },
      { label: "Date", render: (r) => fmtDate(r.createdAt) },
      { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
    ]} />
);

export function OrderForm() {
  const dispatch = useDispatch();
  const cs = useSelector((s) => s.customers.items);
  const ps = useSelector((s) => s.products.items);
  useEffect(() => { dispatch(customers.fetchAll({ limit: 200 })); dispatch(products.fetchAll({ limit: 200 })); }, [dispatch]);
  const opt = (arr, f) => arr.map((x) => ({ value: x._id, label: f(x) }));
  return (
    <ResourceForm crud={orders} base="/orders" label="Order"
      fields={[
        { name: "customer", label: "Customer", type: "select", required: true, options: opt(cs, (c) => `${c.name} (${c.code})`) },
        { name: "product", label: "Product", type: "select", required: true, options: opt(ps, (p) => `${p.name} — ${money(p.price)}`) },
        { name: "qty", label: "Quantity", type: "number", min: 1, required: true, default: 1 },
        { name: "branch", label: "Branch", required: true },
        { name: "payment", label: "Payment", type: "select", required: true, options: payments.map((p) => ({ value: p, label: p })) },
        { name: "status", label: "Status", type: "select", required: true, default: "Pending", options: statuses.map((p) => ({ value: p, label: p })) },
      ]}
      toForm={(o) => ({ customer: o.customer?._id || "", product: o.product?._id || "", qty: o.qty, branch: o.branch, payment: o.payment, status: o.status })}
      toPayload={(f) => ({ ...f, qty: Number(f.qty) })} />
  );
}

export const OrderView = () => (
  <ResourceView crud={orders} base="/orders" label="Order"
    rows={(o) => [["Order", `#${o.code}`], ["Customer", o.customer?.name], ["Product", o.product?.name], ["Branch", o.branch],
      ["Payment", o.payment], ["Quantity", o.qty], ["Amount", money(o.amount)], ["Date", fmtDate(o.createdAt)], ["Status", <Badge>{o.status}</Badge>]]} />
);
