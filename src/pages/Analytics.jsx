import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analytics } from "../store/resources";
import { useChartColors } from "../lib/hooks";
import { formatValue, money, num } from "../lib/format";
import { Card, Empty, PageHeader, StatCard } from "../components/ui";
import ChartMenu from "../components/ChartMenu";

export default function Analytics() {
  const dispatch = useDispatch();
  const { data, error } = useSelector((s) => s.analytics);
  const c = useChartColors();
  const revBox = useRef(null);
  useEffect(() => { dispatch(analytics.load()); }, [dispatch]);

  if (!data) return <Empty bad={!!error} text={error || "Loading analytics…"} />;
  const tip = { contentStyle: { background: c.tip, border: `1px solid ${c.grid}` } };
  const pie = ["#1f8a5b", "#f5a524", "#e5484d"];

  return (
    <>
      <PageHeader title="Analytics" crumb="Analytics" />
      <div className="grid4">{data.kpis.map((k) => <StatCard key={k.label} label={k.label} value={formatValue(k.value, k.format)} change={k.change} />)}</div>
      <div className="grid-half">
        <Card title="Revenue Overview" sub="Monthly revenue for the past year" right={<ChartMenu boxRef={revBox} rows={data.revenue} name="revenue" />}>
          <div ref={revBox}><ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.revenue}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="label" stroke={c.text} tickLine={false} /><YAxis stroke={c.text} tickLine={false} axisLine={false} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2196f3" fill="#2196f3" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer></div>
        </Card>
        <Card title="Order Status" sub="Breakdown of all orders">
          <p className="big center">{num(data.orderStatus.total)} <span className="muted">Total Orders</span></p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.orderStatus.items} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                {data.orderStatus.items.map((_, i) => <Cell key={i} fill={pie[i % 3]} />)}
              </Pie>
              <Tooltip {...tip} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid-half">
        <Card title="Customers by Country" sub="Where your customer base is located">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.countries} layout="vertical">
              <CartesianGrid stroke={c.grid} horizontal={false} />
              <XAxis type="number" stroke={c.text} /><YAxis type="category" dataKey="country" stroke={c.text} width={110} />
              <Tooltip {...tip} /><Bar dataKey="count" name="Customers" fill="#5e35b1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Top Products" sub="Best sellers by units this period" right={<Link to="/products">View all</Link>}>
          {data.topProducts.length === 0 ? <Empty text="No sales yet." /> : (
            <div className="tablewrap"><table>
              <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>{data.topProducts.map((p) => <tr key={p.name}><td>{p.name}</td><td>{num(p.units)}</td><td>{money(p.revenue)}</td></tr>)}</tbody>
            </table></div>
          )}
        </Card>
      </div>
    </>
  );
}
