import { Router } from "express";
import { HttpError, escapeRe, pick, wrap } from "../lib/http.js";
import { nextCode } from "../models/index.js";

// Generic REST CRUD router for a Mongoose model (list with search/filter/sort/pagination, get, create, update, delete).
export default function crud(Model, o) {
  const { fields, search = [], searchRefs = [], populate = [], filters = [], sorts = {}, key, prefix, start, beforeList, create, update, remove } = o;
  const r = Router();

  r.get("/", wrap(async (req, res) => {
    await beforeList?.();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 10));
    const filter = {};
    filters.forEach((f) => { if (req.query[f]) filter[f] = String(req.query[f]); });
    const q = req.query.search && String(req.query.search).trim();
    if (q) {
      const re = { $regex: escapeRe(q), $options: "i" };
      const or = search.map((f) => ({ [f]: re }));
      for (const ref of searchRefs) {
        const ids = await ref.Model.find({ $or: ref.fields.map((f) => ({ [f]: re })) }).distinct("_id");
        or.push({ [ref.field]: { $in: ids } });
      }
      filter.$or = or;
    }
    const sort = sorts[req.query.sort] || { createdAt: -1 };
    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ items, total });
  }));

  r.get("/:id", wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id).populate(populate).lean();
    if (!doc) throw new HttpError(404, "Not found");
    res.json(doc);
  }));

  r.post("/", wrap(async (req, res) => {
    const data = create ? await create(req.body) : pick(req.body, fields);
    if (key) data.code = await nextCode(key, prefix, start);
    const doc = await Model.create(data);
    res.status(201).json(await Model.findById(doc._id).populate(populate).lean());
  }));

  r.put("/:id", wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, "Not found");
    doc.set(update ? await update(doc, req.body) : pick(req.body, fields));
    await doc.save();
    res.json(await Model.findById(doc._id).populate(populate).lean());
  }));

  r.delete("/:id", wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, "Not found");
    await remove?.(doc);
    await doc.deleteOne();
    res.json({ ok: true });
  }));
  return r;
}
