import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { billing, cancelPlan, changePlan, updateCard } from "../store/resources";
import { download, fmtDate, money } from "../lib/format";
import { useNotify } from "../lib/hooks";
import { Badge, Card, Confirm, Empty, Modal, PageHeader } from "../components/ui";

export default function Billing() {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { data, error } = useSelector((s) => s.billing);
  const [modal, setModal] = useState(null); // "plan" | "card" | "cancel"
  const [plan, setPlan] = useState("");
  const [card, setCard] = useState({ brand: "Visa", number: "", expires: "" });

  useEffect(() => { dispatch(billing.load()); }, [dispatch]);
  if (!data) return <Empty bad={!!error} text={error || "Loading billing…"} />;

  const run = (thunk, msg) => dispatch(thunk).unwrap().then(() => { notify(msg); setModal(null); }).catch((m) => notify(m, "bad"));
  const receipt = (h) => download(`receipt-${h._id}.txt`, `${h.description}\nDate: ${fmtDate(h.date)}\nAmount: ${money(h.amount)}\nStatus: ${h.status}\n`);
  const p = data.plan;

  return (
    <>
      <PageHeader title="Billing" crumb="Billing" />
      <div className="grid-half">
        <Card title="Current plan">
          {p ? (
            <>
              <p className="big">{p.name} <span className="muted">{money(p.price, 0)}/mo</span> <Badge>{p.status === "Active" ? "Active" : "Failed"}</Badge></p>
              <ul className="ticks">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <div className="row-gap">
                <button className="btn" onClick={() => { setPlan(p.name); setModal("plan"); }}>Change plan</button>
                <button className="btn ghost" onClick={() => setModal("cancel")}>Cancel plan</button>
              </div>
            </>
          ) : (
            <><p className="muted">No active plan.</p><button className="btn" onClick={() => setModal("plan")}>Choose a plan</button></>
          )}
        </Card>
        <Card title="Payment method">
          {data.card ? <p className="big">{data.card.brand} •••• {data.card.last4}<span className="muted"> Expires {data.card.expires}</span></p> : <p className="muted">No card on file.</p>}
          <button className="btn ghost" onClick={() => setModal("card")}>Update card</button>
        </Card>
      </div>
      <Card title="Billing history">
        {data.history.length === 0 ? <Empty text="No payments yet." /> : (
          <div className="tablewrap"><table>
            <thead><tr><th>Description</th><th>Date</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>{data.history.map((h) => (
              <tr key={h._id}><td>{h.description}</td><td>{fmtDate(h.date)}</td><td>{money(h.amount)}</td><td><Badge>{h.status}</Badge></td>
                <td><button className="link" onClick={() => receipt(h)}>Download</button></td></tr>))}
            </tbody>
          </table></div>
        )}
      </Card>

      <Modal open={modal === "plan"} title="Change plan" onClose={() => setModal(null)}>
        {data.plans.map((pl) => (
          <label key={pl.name} className="radio">
            <input type="radio" name="plan" checked={plan === pl.name} onChange={() => setPlan(pl.name)} />
            <span><strong>{pl.name}</strong> — {money(pl.price, 0)}/mo<br /><span className="muted">{pl.features.join(" · ")}</span></span>
          </label>
        ))}
        <div className="row-end"><button className="btn ghost" onClick={() => setModal(null)}>Close</button>
          <button className="btn" disabled={!plan} onClick={() => run(changePlan(plan), "Plan updated")}>Save plan</button></div>
      </Modal>

      <Modal open={modal === "card"} title="Update card" onClose={() => setModal(null)}>
        <form className="form" onSubmit={(e) => { e.preventDefault(); run(updateCard({ brand: card.brand, last4: card.number.replace(/\D/g, "").slice(-4), expires: card.expires }), "Card updated"); }}>
          <label>Card brand<select value={card.brand} onChange={(e) => setCard({ ...card, brand: e.target.value })}><option>Visa</option><option>Mastercard</option><option>Amex</option></select></label>
          <label>Card number<input inputMode="numeric" minLength={12} maxLength={19} required value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} /></label>
          <label>Expires (MM/YY)<input pattern="(0[1-9]|1[0-2])/[0-9]{2}" placeholder="12/29" required value={card.expires} onChange={(e) => setCard({ ...card, expires: e.target.value })} /></label>
          <p className="muted">Only the brand, last 4 digits and expiry are stored.</p>
          <div className="row-end"><button type="button" className="btn ghost" onClick={() => setModal(null)}>Close</button><button className="btn">Save card</button></div>
        </form>
      </Modal>

      <Confirm open={modal === "cancel"} title="Cancel your plan?" text="Your plan will be cancelled right away." label="Cancel plan"
        onCancel={() => setModal(null)} onConfirm={() => run(cancelPlan(), "Plan cancelled")} />
    </>
  );
}
