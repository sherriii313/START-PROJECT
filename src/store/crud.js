import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { errMsg } from "../lib/api";

// Builds a slice + thunks (Redux Toolkit + createAsyncThunk) for one REST resource.
export function makeCrud(name, path) {
  const call = (fn) => async (arg, { rejectWithValue }) => {
    try { return await fn(arg); } catch (e) { return rejectWithValue(errMsg(e)); }
  };
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, call(async (params) => (await api.get(path, { params })).data));
  const fetchOne = createAsyncThunk(`${name}/fetchOne`, call(async (id) => (await api.get(`${path}/${id}`)).data));
  const create = createAsyncThunk(`${name}/create`, call(async (data) => (await api.post(path, data)).data));
  const update = createAsyncThunk(`${name}/update`, call(async ({ id, data }) => (await api.put(`${path}/${id}`, data)).data));
  const remove = createAsyncThunk(`${name}/remove`, call(async (id) => { await api.delete(`${path}/${id}`); return id; }));

  const slice = createSlice({
    name,
    initialState: { items: [], total: 0, current: null, loading: false, saving: false, error: "" },
    reducers: { clearCurrent: (s) => { s.current = null; } },
    extraReducers: (b) => {
      b.addCase(fetchAll.pending, (s) => { s.loading = true; s.error = ""; })
        .addCase(fetchAll.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.items; s.total = a.payload.total; })
        .addCase(fetchAll.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Could not load data"; })
        .addCase(fetchOne.pending, (s) => { s.current = null; s.loading = true; })
        .addCase(fetchOne.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
        .addCase(fetchOne.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Not found"; })
        .addCase(create.pending, (s) => { s.saving = true; })
        .addCase(create.fulfilled, (s) => { s.saving = false; })
        .addCase(create.rejected, (s) => { s.saving = false; })
        .addCase(update.pending, (s) => { s.saving = true; })
        .addCase(update.fulfilled, (s, a) => {
          s.saving = false;
          s.current = a.payload;
          s.items = s.items.map((i) => (i._id === a.payload._id ? a.payload : i));
        })
        .addCase(update.rejected, (s) => { s.saving = false; })
        .addCase(remove.fulfilled, (s, a) => { s.items = s.items.filter((i) => i._id !== a.payload); });
    },
  });
  return { name, fetchAll, fetchOne, create, update, remove, actions: slice.actions, reducer: slice.reducer };
}

// Read-only data endpoints (dashboard, analytics, summaries).
export function makeData(name, path) {
  const load = createAsyncThunk(`${name}/load`, async (params, { rejectWithValue }) => {
    try { return (await api.get(path, { params })).data; } catch (e) { return rejectWithValue(errMsg(e)); }
  });
  const slice = createSlice({
    name,
    initialState: { data: null, loading: false, error: "" },
    reducers: {},
    extraReducers: (b) => {
      b.addCase(load.pending, (s) => { s.loading = true; s.error = ""; })
        .addCase(load.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
        .addCase(load.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Could not load data"; });
    },
  });
  return { load, reducer: slice.reducer };
}
