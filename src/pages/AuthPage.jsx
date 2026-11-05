import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register } from "../store/authSlice";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!isLogin && form.password !== form.confirm) return setError("Passwords do not match");
    const action = isLogin
      ? login({ email: form.email, password: form.password })
      : register({ name: form.name, email: form.email, password: form.password });
    dispatch(action).unwrap().then(() => navigate("/", { replace: true })).catch((m) => setError(m));
  };

  return (
    <div className="authwrap">
      <form className="card authcard form" onSubmit={submit}>
        <h1 className="brand">Lumen</h1>
        <h2>{isLogin ? "Sign in to your dashboard" : "Create your account"}</h2>
        {!isLogin && <label>Full name<input name="name" value={form.name} onChange={onChange} required /></label>}
        <label>Email<input type="email" name="email" value={form.email} onChange={onChange} required autoComplete="email" /></label>
        <label>Password<input type="password" name="password" minLength={6} value={form.password} onChange={onChange} required autoComplete={isLogin ? "current-password" : "new-password"} /></label>
        {!isLogin && <label>Confirm password<input type="password" name="confirm" value={form.confirm} onChange={onChange} required /></label>}
        {error && <p className="state bad">{error}</p>}
        <button className="btn" disabled={loading}>{loading ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}</button>
        <p className="muted center">
          {isLogin ? <>No account? <Link to="/register">Sign up</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}
        </p>
      </form>
    </div>
  );
}
