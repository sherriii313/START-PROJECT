import { Link } from "react-router-dom";
import { customers } from "../store/resources";
import api from "../lib/api";
import { download, toCsv } from "../lib/format";
import { useNotify } from "../lib/hooks";
import { Avatar, Badge } from "../components/ui";
import ListPage from "../components/ListPage";
import ResourceForm from "../components/ResourceForm";
import ResourceView from "../components/ResourceView";

const statuses = ["Active", "Inactive"];

export function CustomerList() {
  const notify = useNotify();
  const exportCsv = async () => {
    try {
      const { data } = await api.get("/customers", { params: { limit: 1000 } });
      download("customers.csv", toCsv(data.items.map((c) => ({ id: c.code, name: c.name, email: c.email, phone: c.phone, country: c.country, status: c.status }))), "text/csv");
    } catch { notify("Could not export customers", "bad"); }
  };
  return (
    <ListPage crud={customers} title="List" crumb="CustomerList" base="/customers" statuses={statuses} addLabel="Add New"
      headerExtra={<button className="btn ghost" onClick={exportCsv}>Download</button>}
      columns={[
        { label: "Customer Name", render: (r) => (
          <div className="person"><Avatar name={r.name} /><div><Link to={`/customers/${r._id}`}>{r.name}</Link><p className="muted">#{r.code}</p></div></div>) },
        { label: "Email", render: (r) => r.email },
        { label: "Phone", render: (r) => r.phone },
        { label: "Country", render: (r) => r.country },
        { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
      ]} />
  );
}

export const CustomerForm = () => (
  <ResourceForm crud={customers} base="/customers" label="Customer"
    fields={[
      { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", required: true },
      { name: "country", label: "Country", required: true },
      { name: "status", label: "Status", type: "select", required: true, default: "Active", options: statuses.map((s) => ({ value: s, label: s })) },
    ]} />
);

export const CustomerView = () => (
  <ResourceView crud={customers} base="/customers" label="Customer"
    rows={(c) => [["Customer ID", `#${c.code}`], ["Name", c.name], ["Email", c.email], ["Phone", c.phone], ["Country", c.country], ["Status", <Badge>{c.status}</Badge>]]} />
);
