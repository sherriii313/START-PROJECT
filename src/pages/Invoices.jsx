import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { customers, invoiceSummary, invoices, orders } from "../store/resources";
import { downloadInvoice, formatValue, fmtDate, money, toInputDate } from "../lib/format";
import { useNotify } from "../lib/hooks";
import { Badge, StatCard } from "../components/ui";
import ListPage from "../components/ListPage";
import ResourceForm from "../components/ResourceForm";
import ResourceView from "../components/ResourceView";

const statuses = ["Pending", "Overdue", "Paid", "Draft"];

export function InvoiceList() {
  const dispatch = useDispatch();
  const notify = useNotify();
  const summary = useSelector((s) => s.invoiceSummary.data);
  const items = useSelector((s) => s.invoices.items);
  useEffect(() => { dispatch(invoiceSummary.load()); }, [items, dispatch]); // refresh cards whenever the list changes

  const markPaid = (r) =>
    dispatch(invoices.update({ id: r._id, data: { status: "Paid" } })).unwrap()
      .then(() => notify(`${r.code} marked as paid`)).catch((m) => notify(m, "bad"));

  return (
    <ListPage crud={invoices} title="Invoices" crumb="Invoices" base="/invoices" statuses={statuses} addLabel="New invoice"
      top={<div className="grid4">{summary?.cards.map((c) => <StatCard key={c.label} label={c.label} value={formatValue(c.value, c.format)} change={c.change} />)}</div>}
      columns={[
        { label: "Invoice", render: (r) => <Link to={`/invoices/${r._id}`}>#{r.code}</Link> },
        { label: "Customer", render: (r) => r.customer?.name },
        { label: "Order", render: (r) => (r.order ? `#${r.order.code}` : "—") },
        { label: "Issued", render: (r) => fmtDate(r.issued) },
        { label: "Due", render: (r) => fmtDate(r.due) },
        { label: "Amount", render: (r) => money(r.amount) },
        { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
      ]}
      actions={(r, { askDelete }) => (
        <>
          <Link to={`/invoices/${r._id}`}>View</Link>
          <button className="link" onClick={() => downloadInvoice(r)}>Download</button>
          {r.status !== "Paid" && <button className="link" onClick={() => markPaid(r)}>Mark as paid</button>}
          <button className="link bad" onClick={() => askDelete(r)}>Delete</button>
        </>
      )} />
  );
}

export function InvoiceForm() {
  const dispatch = useDispatch();
  const cs = useSelector((s) => s.customers.items);
  const os = useSelector((s) => s.orders.items);
  useEffect(() => { dispatch(customers.fetchAll({ limit: 200 })); dispatch(orders.fetchAll({ limit: 200 })); }, [dispatch]);
  return (
    <ResourceForm crud={invoices} base="/invoices" label="Invoice"
      fields={[
        { name: "customer", label: "Customer", type: "select", required: true, options: cs.map((c) => ({ value: c._id, label: c.name })) },
        { name: "order", label: "Order (optional)", type: "select", options: os.map((o) => ({ value: o._id, label: `#${o.code}` })) },
        { name: "issued", label: "Issued", type: "date", required: true, default: toInputDate(new Date()) },
        { name: "due", label: "Due", type: "date", required: true },
        { name: "amount", label: "Amount (USD)", type: "number", min: 0, required: true },
        { name: "status", label: "Status", type: "select", required: true, default: "Pending", options: statuses.map((s) => ({ value: s, label: s })) },
      ]}
      toForm={(i) => ({ customer: i.customer?._id || "", order: i.order?._id || "", issued: toInputDate(i.issued), due: toInputDate(i.due), amount: i.amount, status: i.status })}
      toPayload={(f) => ({ ...f, order: f.order || null, amount: Number(f.amount) })} />
  );
}

export const InvoiceView = () => (
  <ResourceView crud={invoices} base="/invoices" label="Invoice"
    extra={(i) => <button className="btn ghost" onClick={() => downloadInvoice(i)}>Download</button>}
    rows={(i) => [["Invoice", `#${i.code}`], ["Customer", i.customer?.name], ["Order", i.order ? `#${i.order.code}` : "—"],
      ["Issued", fmtDate(i.issued)], ["Due", fmtDate(i.due)], ["Amount", money(i.amount)], ["Status", <Badge>{i.status}</Badge>]]} />
);
