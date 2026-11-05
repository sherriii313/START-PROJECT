import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { products } from "../store/resources";
import { money, stockStatus } from "../lib/format";
import { useDebounce, useNotify } from "../lib/hooks";
import { Badge, Confirm, Empty, PageHeader, Pagination } from "../components/ui";
import ResourceForm from "../components/ResourceForm";
import ResourceView from "../components/ResourceView";

export const categories = ["Electronics", "Accessories", "Furniture"];
const sorts = [["newest", "Sort: Newest"], ["price_asc", "Price: Low to high"], ["price_desc", "Price: High to low"]];

export function ProductList() {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { items, total, loading, error } = useSelector((s) => s.products);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [del, setDel] = useState(null);
  const q = useDebounce(search);

  const load = () => dispatch(products.fetchAll({ page, limit, category: category || undefined, sort, search: q || undefined }));
  useEffect(() => { load(); }, [page, limit, category, sort, q]); // eslint-disable-line
  useEffect(() => { setPage(1); }, [category, sort, q, limit]);

  const confirmDelete = () =>
    dispatch(products.remove(del._id)).unwrap()
      .then(() => { notify("Product deleted"); load(); })
      .catch((m) => notify(m, "bad"))
      .finally(() => setDel(null));

  return (
    <>
      <PageHeader title="Products" crumb="ProductsList"><Link to="/products/create" className="btn">Add product</Link></PageHeader>
      <div className="filters">
        <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          {sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error && <Empty bad text={error} />}
      {loading && items.length === 0 && <Empty text="Loading…" />}
      {!loading && !error && items.length === 0 && <Empty text="No products found." />}
      <div className="pgrid">
        {items.map((p) => (
          <article className="card pcard" key={p._id}>
            <Link to={`/products/${p._id}`} className="pimg">{p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span>No image</span>}</Link>
            <h3>{p.name}</h3>
            <p className="muted">{p.description}</p>
            <p className="muted">★ {p.rating} ({p.reviews}+)</p>
            <div className="row-between"><strong>{money(p.price)}</strong><Badge>{stockStatus(p.stock)}</Badge></div>
            <div className="acts"><Link to={`/products/${p._id}/edit`}>Edit</Link><button className="link bad" onClick={() => setDel(p)}>Delete</button></div>
          </article>
        ))}
      </div>
      <Pagination page={page} limit={limit} total={total} onPage={setPage} onLimit={setLimit} sizes={[12, 24, 48]} />
      <Confirm open={!!del} title="Delete product?" text={`"${del?.name}" will be removed permanently.`} onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </>
  );
}

export const ProductForm = () => (
  <ResourceForm crud={products} base="/products" label="Product"
    fields={[
      { name: "name", label: "Name", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: categories.map((c) => ({ value: c, label: c })) },
      { name: "price", label: "Price (USD)", type: "number", min: 0, required: true },
      { name: "stock", label: "Stock", type: "number", min: 0, required: true, default: 0 },
      { name: "rating", label: "Rating (0–5)", type: "number", min: 0, default: 0 },
      { name: "reviews", label: "Reviews", type: "number", min: 0, default: 0 },
      { name: "description", label: "Description", type: "textarea", required: true, wide: true },
      { name: "image", label: "Image", type: "image", wide: true },
    ]}
    toPayload={(f) => ({ ...f, price: Number(f.price), stock: Number(f.stock), rating: Number(f.rating), reviews: Number(f.reviews) })} />
);

export const ProductView = () => (
  <ResourceView crud={products} base="/products" label="Product"
    rows={(p) => [["Name", p.name], ["Category", p.category], ["Price", money(p.price)], ["Stock", `${p.stock} (${stockStatus(p.stock)})`],
      ["Rating", `${p.rating} (${p.reviews}+)`], ["Description", p.description], ["Image", p.image ? <img className="preview" src={p.image} alt={p.name} /> : "—"]]} />
);
