// Tiny example of creating an HTTP request with Node's built-in http module.
import http from "node:http";
const url = process.argv[2] || "http://localhost:5000/api/health";
http.get(url, (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => console.log(res.statusCode, body));
}).on("error", (e) => console.error("Request failed:", e.message));
