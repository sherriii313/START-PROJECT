import axios from "axios";

// withCredentials sends the httpOnly JWT cookie issued by the backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export const errMsg = (e, fallback = "Something went wrong") => e?.response?.data?.message || fallback;
export default api;
