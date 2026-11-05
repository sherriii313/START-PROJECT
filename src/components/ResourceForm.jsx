import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../lib/api";
import { useNotify } from "../lib/hooks";
import { Card, Empty, PageHeader } from "./ui";

function Input({ f, value, onChange, onFile, busy }) {
  const common = { id: f.name, name: f.name, required: f.required, value: value ?? "", onChange: (e) => onChange(f.name, e.target.value) };
  if (f.type === "select")
    return (
      <select {...common}>
        <option value="">Select…</option>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  if (f.type === "textarea") return <textarea rows={3} {...common} />;
  if (f.type === "image")
    return (
      <div>
        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onFile(f.name, e.target.files[0])} />
        {busy && <p className="muted">Uploading…</p>}
        {value && <img className="preview" src={value} alt="Preview" />}
      </div>
    );
  return <input type={f.type || "text"} step={f.type === "number" ? "any" : undefined} min={f.min} {...common} />;
}

// One form for create + edit of any resource. `fields` describes the inputs.
export default function ResourceForm({ crud, base, label, fields, toForm, toPayload }) {
  const { id } = useParams();
  const edit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const { current, saving, loading } = useSelector((s) => s[crud.name]);
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.default ?? ""])));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (edit) dispatch(crud.fetchOne(id));
    return () => { dispatch(crud.actions.clearCurrent()); };
  }, [id]); // eslint-disable-line
  useEffect(() => { if (edit && current) setForm(toForm ? toForm(current) : { ...current }); }, [current]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (name, file) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await api.post("/upload", body);
      set(name, res.data.url);
    } catch (e) { notify(errMsg(e, "Upload failed"), "bad"); }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    const data = toPayload ? toPayload(form) : form;
    const action = edit ? crud.update({ id, data }) : crud.create(data);
    dispatch(action).unwrap()
      .then(() => { notify(edit ? `${label} updated` : `${label} created`); navigate(base); })
      .catch((m) => notify(m, "bad"));
  };

  if (edit && loading && !current) return <Empty text="Loading…" />;

  return (
    <>
      <PageHeader title={edit ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`} crumb={label} />
      <Card>
        <form className="form grid2" onSubmit={submit}>
          {fields.map((f) => (
            <label key={f.name} className={f.wide ? "wide" : ""}>{f.label}
              <Input f={f} value={form[f.name]} onChange={set} onFile={upload} busy={uploading} />
            </label>
          ))}
          <div className="wide row-end">
            <button type="button" className="btn ghost" onClick={() => navigate(base)}>Cancel</button>
            <button className="btn" disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Card>
    </>
  );
}
