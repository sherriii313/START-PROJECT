import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce, useNotify } from "../lib/hooks";
import { Card, Confirm, Empty, PageHeader, Pagination } from "./ui";

// Generic server-paginated table page with search, status filter, and delete confirmation.
export default function ListPage({ crud, title, crumb, base, columns, statuses, top, headerExtra, actions, addLabel = "Add new", hideAdd }) {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { items, total, loading, error } = useSelector((s) => s[crud.name]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [del, setDel] = useState(null);
  const q = useDebounce(search);

  const load = () => dispatch(crud.fetchAll({ page, limit, search: q || undefined, status: status || undefined }));
  useEffect(() => { load(); }, [page, limit, q, status]); // eslint-disable-line
  useEffect(() => { setPage(1); }, [q, status, limit]);

  const confirmDelete = () =>
    dispatch(crud.remove(del._id)).unwrap()
      .then(() => { notify("Deleted"); load(); })
      .catch((m) => notify(m, "bad"))
      .finally(() => setDel(null));

  return (
    <>
      <PageHeader title={title} crumb={crumb}>
        {headerExtra}
        {!hideAdd && <Link to={`${base}/create`} className="btn">{addLabel}</Link>}
      </PageHeader>
      {top}
      <Card>
        <div className="filters">
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          {statuses && (
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>
        {error && <Empty bad text={error} />}
        {loading && items.length === 0 && <Empty text="Loading…" />}
        {!loading && !error && items.length === 0 && <Empty text="Nothing here yet." />}
        {items.length > 0 && (
          <div className="tablewrap">
            <table>
              <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Action</th></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    {columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                    <td className="acts">
                      {actions ? actions(r, { askDelete: setDel }) : (
                        <>
                          <Link to={`${base}/${r._id}`}>View</Link>
                          <Link to={`${base}/${r._id}/edit`}>Edit</Link>
                          <button className="link bad" onClick={() => setDel(r)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} limit={limit} total={total} onPage={setPage} onLimit={setLimit} />
      </Card>
      <Confirm open={!!del} title="Delete this record?" text="This cannot be undone." onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </>
  );
}
