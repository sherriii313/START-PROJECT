import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notify } from "../store/uiSlice";

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useNotify() {
  const dispatch = useDispatch();
  return (text, type = "ok") => dispatch(notify({ text, type }));
}

export function useChartColors() {
  const theme = useSelector((s) => s.ui.theme);
  return theme === "dark"
    ? { text: "#9aa6c7", grid: "#2e3a63", tip: "#111936", series: ["#2196f3", "#90caf9", "#5e35b1", "#b39ddb"] }
    : { text: "#5b6577", grid: "#e3e8ef", tip: "#ffffff", series: ["#2196f3", "#90caf9", "#5e35b1", "#b39ddb"] };
}
