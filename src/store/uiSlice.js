import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "ui",
  initialState: { theme: localStorage.getItem("theme") || "dark", toast: null, menuOpen: false },
  reducers: {
    setTheme: (s, a) => { s.theme = a.payload; },
    notify: (s, a) => { s.toast = { ...a.payload, id: Date.now() }; },
    clearToast: (s) => { s.toast = null; },
    setMenu: (s, a) => { s.menuOpen = a.payload; },
  },
});
export const { setTheme, notify, clearToast, setMenu } = slice.actions;
export default slice.reducer;
