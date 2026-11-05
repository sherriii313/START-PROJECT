import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { errMsg } from "../lib/api";

const wrap = (type, fn, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try { return await fn(arg); } catch (e) { return rejectWithValue(errMsg(e, fallback)); }
  });

export const loadMe = createAsyncThunk("auth/me", async () => (await api.get("/admin/auth/me")).data.user);
export const login = wrap("auth/login", async (b) => (await api.post("/admin/auth/login", b)).data.user, "Wrong email or password");
export const register = wrap("auth/register", async (b) => (await api.post("/admin/auth/register", b)).data.user, "Could not create the account");
export const updateProfile = wrap("auth/update", async (b) => (await api.put("/admin/auth/me", b)).data.user, "Could not save changes");
export const logout = createAsyncThunk("auth/logout", async () => { await api.post("/admin/auth/logout").catch(() => {}); });

const slice = createSlice({
  name: "auth",
  initialState: { user: null, ready: false, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadMe.fulfilled, (s, a) => { s.user = a.payload; s.ready = true; })
      .addCase(loadMe.rejected, (s) => { s.user = null; s.ready = true; })
      .addCase(login.pending, (s) => { s.loading = true; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
      .addCase(login.rejected, (s) => { s.loading = false; })
      .addCase(register.pending, (s) => { s.loading = true; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
      .addCase(register.rejected, (s) => { s.loading = false; })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(logout.fulfilled, (s) => { s.user = null; });
  },
});
export default slice.reducer;
