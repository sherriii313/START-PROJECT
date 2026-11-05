import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { clearToast } from "../store/uiSlice";

export function PageHeader({ title, crumb, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p className="muted"><Link to="/">/</Link> {crumb}</p>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

const tone = {
  Complete: "ok", Paid: "ok", Active: "ok", "In stock": "ok",
  Pending: "warn", "Low stock": "warn",
  Cancel: "bad", Overdue: "bad", Failed: "bad", Inactive: "bad", "Out of stock": "bad",
  Draft: "mute",
};
export const Badge = ({ children }) => <span className={`badge ${tone[children] || "mute"}`}>{children}</span>;
export const Avatar = ({ name }) => <span className="avatar">{(name || "?")[0].toUpperCase()}</span>;
export const Empty = ({ text, bad }) => <p className={`state ${bad ? "bad" : ""}`}>{text}</p>;

export function Card({ title, sub, right, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="card-head">
          <div>{title && <h3>{title}</h3>}{sub && <p className="muted">{sub}</p>}</div>
          <div>{right}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function Change({ value }) {
  const up = Number(value) >= 0;
  return (
    <span className={up ? "chg up" : "chg down"}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(value)}%
      <span className="muted"> vs last month</span>
    </span>
  );
}

export function StatCard({ label, value, change }) {
  return (
    <div className="card stat">
      <p className="muted">{label}</p>
      <strong>{value}</strong>
      {change !== undefined && <Change value={change} />}
    </div>
  );
}

export function Pagination({ page, limit, total, onPage, onLimit, sizes = [10, 25, 50] }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="pager">
      <label>Rows per page
        <select value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
          {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <span>{from}-{to} of {total}</span>
      <button className="btn ghost sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
      <button className="btn ghost sm" disabled={to >= total} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, text, label = "Delete", busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="muted">{text}</p>
      <div className="row-end">
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn danger" disabled={busy} onClick={onConfirm}>{label}</button>
      </div>
    </Modal>
  );
}

export function Toast() {
  const toast = useSelector((s) => s.ui.toast);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(t);
  }, [toast, dispatch]);
  if (!toast) return null;
  return <div className={`toast ${toast.type}`} role="status">{toast.text}</div>;
}
