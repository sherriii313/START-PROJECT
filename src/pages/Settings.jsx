import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateProfile } from "../store/authSlice";
import { setTheme } from "../store/uiSlice";
import { useNotify } from "../lib/hooks";
import { Avatar, Card, PageHeader } from "../components/ui";

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.ui.theme);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => { if (user) setForm({ name: user.name, email: user.email, password: "" }); }, [user]);

  const save = (e) => {
    e.preventDefault();
    dispatch(updateProfile({ name: form.name, email: form.email, password: form.password || undefined })).unwrap()
      .then(() => notify("Profile saved")).catch((m) => notify(m, "bad"));
  };
  const flip = () => { const t = theme === "dark" ? "light" : "dark"; localStorage.setItem("theme", t); dispatch(setTheme(t)); };
  const signOut = async () => { await dispatch(logout()); navigate("/login"); };

  return (
    <>
      <PageHeader title="Settings" crumb="Settings" />
      <Card title="Profile">
        <div className="person big-person"><Avatar name={user?.name} /><div><strong>{user?.name}</strong><p className="muted">Store owner</p></div></div>
        <form className="form grid2" onSubmit={save}>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="wide">New password (leave blank to keep current)<input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" /></label>
          <div className="wide row-end"><button className="btn">Save changes</button></div>
        </form>
      </Card>
      <Card title="Preferences">
        <div className="row-between"><div><strong>Theme</strong><p className="muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p></div>
          <button className="btn ghost" onClick={flip}>Switch to {theme === "dark" ? "light" : "dark"}</button></div>
      </Card>
      <Card title="Account">
        <div className="row-between"><p className="muted">Sign out of Lumen on this device.</p><button className="btn danger" onClick={signOut}>Log out</button></div>
      </Card>
    </>
  );
}
