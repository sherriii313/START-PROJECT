import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BarChart3, CreditCard, FileText, LayoutDashboard, Menu, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { logout } from "../store/authSlice";
import { setMenu } from "../store/uiSlice";
import { Avatar, Toast } from "./ui";

const nav = [
  { title: "Overview", items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  { title: "Management", items: [
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/products", label: "Products", icon: Package },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
  ] },
  { title: "Other", items: [
    { to: "/invoices", label: "Invoices", icon: FileText },
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/settings", label: "Settings", icon: Settings },
  ] },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const menuOpen = useSelector((s) => s.ui.menuOpen);
  const [profile, setProfile] = useState(false);

  useEffect(() => { dispatch(setMenu(false)); setProfile(false); }, [location.pathname, dispatch]);

  const signOut = async () => { await dispatch(logout()); navigate("/login"); };

  return (
    <div className="shell">
      <aside className={menuOpen ? "side open" : "side"}>
        <Link to="/" className="brand">Lumen</Link>
        {nav.map((g) => (
          <div key={g.title} className="navgroup">
            <p className="navtitle">{g.title}</p>
            {g.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className="navlink">
                <i.icon size={18} />{i.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      {menuOpen && <div className="scrim" onClick={() => dispatch(setMenu(false))} />}
      <div className="main">
        <header className="top">
          <button className="btn ghost sm burger" aria-label="Open menu" onClick={() => dispatch(setMenu(true))}><Menu size={18} /></button>
          <div className="menu-wrap">
            <button className="avatar-btn" aria-label="Account menu" onClick={() => setProfile(!profile)}><Avatar name={user?.name} /></button>
            {profile && (
              <div className="menu right">
                <Link to="/settings">Profile</Link>
                <Link to="/settings">Account Settings</Link>
                <button onClick={signOut}>Sign out</button>
              </div>
            )}
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </div>
      <Toast />
    </div>
  );
}
