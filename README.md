# Lumen – Admin Dashboard (React + Redux Toolkit)

Pages: Sign in / Sign up, Dashboard, Orders, Products, Customers, Analytics, Invoices, Billing, Settings (with light/dark theme).
All data comes from the backend – nothing is hard-coded. State: Redux Toolkit + `createAsyncThunk`.

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev
```

## API contract (backend must implement; cookie JWT, CORS with credentials)
- Auth: `POST /auth/register|login|logout`, `GET /auth/me`, `PUT /auth/me {name,email,password?}` → `{user}`
- CRUD (`orders, products, customers, invoices`): `GET /x?page&limit&search&status|category&sort` → `{items,total}`, `GET/PUT/DELETE /x/:id`, `POST /x`
  - order: `{code, customer{_id,name}, product{_id,name}, branch, payment, qty, amount, status, createdAt}`; POST/PUT body `{customer, product, qty, branch, payment, status}` (amount computed server-side)
  - product: `{name, description, category, price, stock, rating, reviews, image}`; customer: `{code,name,email,phone,country,status}`
  - invoice: `{code, customer{_id,name}, order{_id,code}|null, issued, due, amount, status}`
- `POST /upload` (multipart field `image`) → `{url}` (Multer + Cloudinary)
- `GET /dashboard?period&popular&range` → `{stats[{label,value,change,format}], earning{total,change,orderTotal,orderSeries[{v}],income,expense}, chart{total,series[{key,label}],data[{label,...}]}, popular[{name,price,changePct,trend}], recentOrders[]}`
- `GET /analytics` → `{kpis[], revenue[{label,revenue}], orderStatus{total,items[{name,value}]}, countries[{country,count}], topProducts[{name,units,revenue}]}`
- `GET /invoices/summary` → `{cards[{label,value,change,format}]}`
- Billing: `GET /billing` → `{plan{name,price,status,features[]}|null, plans[], card{brand,last4,expires}|null, history[]}`, `PUT /billing/plan {plan}`, `POST /billing/cancel`, `PUT /billing/card {brand,last4,expires}`
