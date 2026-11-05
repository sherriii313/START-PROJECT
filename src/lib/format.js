export const money = (n, d = 2) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
export const num = (n) => Number(n || 0).toLocaleString("en-US");
export const compact = (n) => `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0).toLowerCase()}`;
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const formatValue = (v, f) =>
  f === "currency" ? money(v, 0) : f === "money" ? money(v) : f === "percent" ? `${v}%` : num(v);
export const stockStatus = (s) => (s <= 0 ? "Out of stock" : s <= 10 ? "Low stock" : "In stock");

export function download(name, content, type = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadInvoice(inv) {
  const html = `<!doctype html><meta charset="utf-8"><title>${inv.code}</title>
<body style="font-family:Arial;max-width:640px;margin:40px auto;color:#111">
<h1>Invoice ${inv.code}</h1><p>Status: <b>${inv.status}</b></p>
<table style="width:100%;border-collapse:collapse" border="1" cellpadding="8">
<tr><td>Customer</td><td>${inv.customer?.name || "—"}</td></tr>
<tr><td>Order</td><td>${inv.order?.code || "—"}</td></tr>
<tr><td>Issued</td><td>${fmtDate(inv.issued)}</td></tr>
<tr><td>Due</td><td>${fmtDate(inv.due)}</td></tr>
<tr><td>Amount</td><td><b>${money(inv.amount)}</b></td></tr></table></body>`;
  download(`${inv.code}.html`, html, "text/html");
}
