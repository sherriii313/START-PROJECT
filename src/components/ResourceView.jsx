import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, PageHeader } from "./ui";

export default function ResourceView({ crud, base, label, rows, extra }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, error } = useSelector((s) => s[crud.name]);

  useEffect(() => {
    dispatch(crud.fetchOne(id));
    return () => { dispatch(crud.actions.clearCurrent()); };
  }, [id]); // eslint-disable-line

  if (error && !current) return <Empty bad text={error} />;
  if (!current) return <Empty text="Loading…" />;

  return (
    <>
      <PageHeader title={`${label} details`} crumb={label}>
        {extra && extra(current)}
        <Link to={`${base}/${id}/edit`} className="btn">Edit</Link>
      </PageHeader>
      <Card>
        <dl className="details">
          {rows(current).map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v ?? "—"}</dd></div>))}
        </dl>
      </Card>
    </>
  );
}
