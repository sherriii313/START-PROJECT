import { useState } from "react";
import { Download } from "lucide-react";
import { download, toCsv } from "../lib/format";

const getSvg = (box) => box?.querySelector("svg.recharts-surface");

function svgString(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

export default function ChartMenu({ boxRef, rows, name }) {
  const [open, setOpen] = useState(false);

  const saveSvg = () => { const s = getSvg(boxRef.current); if (s) download(`${name}.svg`, svgString(s), "image/svg+xml"); };
  const savePng = () => {
    const s = getSvg(boxRef.current);
    if (!s) return;
    const { width, height } = s.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = width * 2; c.height = height * 2;
      const ctx = c.getContext("2d");
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--card").trim() || "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => download(`${name}.png`, b));
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString(s));
  };
  const saveCsv = () => download(`${name}.csv`, toCsv(rows || []), "text/csv");
  const run = (fn) => () => { fn(); setOpen(false); };

  return (
    <div className="menu-wrap">
      <button className="btn ghost sm" aria-label="Download chart" onClick={() => setOpen(!open)}><Download size={16} /></button>
      {open && (
        <div className="menu">
          <button onClick={run(saveSvg)}>Download SVG</button>
          <button onClick={run(savePng)}>Download PNG</button>
          <button onClick={run(saveCsv)}>Download CSV</button>
        </div>
      )}
    </div>
  );
}
