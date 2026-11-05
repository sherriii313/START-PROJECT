import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboard } from "../store/resources";
import { useChartColors } from "../lib/hooks";
import { compact, fmtDate, formatValue, money } from "../lib/format";
import { Badge, Card, Change, Empty, StatCard } from "../components/ui";
import ChartMenu from "../components/ChartMenu";

const periods = [["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["year", "This Year"]];
const PeriodSelect = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Period">
    {periods.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { data, error } = useSelector((s) => s.dashboard);
  const [period, setPeriod] = useState("year");
  const [popular, setPopular] = useState("month");
  const [range, setRange] = useState("month");
  const box = useRef(null);
  const c = useChartColors();

  useEffect(() => { dispatch(dashboard.load({ period, popular, range })); }, [period, popular, range]); // eslint-disable-line

  if (!data) return <Empty bad={!!error} text={error || "Loading dashboard…"} />;
  const { stats, earning, chart, popular: pop, recentOrders } = data;

  return (
    <>
      <div className="page-head"><div>
        <h1>Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
        <p className="muted">Here's what's happening with your store today.</p>
      </div></div>

      <div className="grid4">
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={formatValue(s.value, s.format)} change={s.change} />)}
      </div>

      <div className="grid-top">
        <div className="hero purple">
          <div className="row-between">
            <span className="icon">$</span>
            <div className="seg">
              {["month", "year"].map((r) => <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>{r}</button>)}
            </div>
          </div>
          <strong>{money(earning.total)}</strong>
          <p>Total Earning <Change value={earning.change} /></p>
        </div>
        <div className="hero blue">
          <strong>{money(earning.orderTotal, 0)}</strong>
          <p>Total Order</p>
          <div className="spark">
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={earning.orderSeries}><Line type="monotone" dataKey="v" stroke="#fff" strokeWidth={2} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="stack">
          <div className="mini a"><strong>{compact(earning.income)}</strong><span>Total Income</span></div>
          <div className="mini b"><strong>{compact(earning.expense)}</strong><span>Total Expense</span></div>
        </div>
      </div>

      <div className="grid-main">
        <Card title="Revenue Overview" sub="Monthly revenue for the past year"
          right={<div className="row-gap"><PeriodSelect value={period} onChange={setPeriod} /><ChartMenu boxRef={box} rows={chart.data} name="revenue-overview" /></div>}>
          <p className="muted">Total Growth</p>
          <p className="big">{money(chart.total)}</p>
          <div ref={box}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart.data}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" stroke={c.text} tickLine={false} />
                <YAxis stroke={c.text} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: c.tip, border: `1px solid ${c.grid}` }} />
                <Legend />
                {chart.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={c.series[i % 4]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Popular Products" right={<PeriodSelect value={popular} onChange={setPopular} />}>
          {pop.length === 0 && <Empty text="No sales in this period." />}
          {pop.map((p) => (
            <div className="pop" key={p.name}>
              <div><strong>{p.name}</strong><p className={p.trend === "up" ? "ok-t" : "bad-t"}>{p.changePct}% {p.trend === "up" ? "Profit" : "Loss"}</p></div>
              <strong>{money(p.price)}</strong>
            </div>
          ))}
          <Link to="/products" className="viewall">View All</Link>
        </Card>
      </div>

      <Card title="Recent Orders" sub="Latest transactions across your store" right={<Link to="/orders">View all</Link>}>
        {recentOrders.length === 0 ? <Empty text="No orders yet." /> : (
          <div className="tablewrap"><table>
            <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{recentOrders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/orders/${o._id}`}>#{o.code}</Link></td><td>{o.customer?.name}</td><td>{o.product?.name}</td>
                <td>{fmtDate(o.createdAt)}</td><td>{money(o.amount)}</td><td><Badge>{o.status}</Badge></td>
              </tr>))}
            </tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
