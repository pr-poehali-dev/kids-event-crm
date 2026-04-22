const API_URL = "https://functions.poehali.dev/9212dd81-5247-4340-8148-17891b5db62a";

export async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export function getSession() {
  const s = localStorage.getItem("crm_session");
  return s ? JSON.parse(s) : null;
}

export function setSession(data: Record<string, unknown>) {
  localStorage.setItem("crm_session", JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem("crm_session");
}

export function fmtMoney(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "0 ₽";
  return v.toLocaleString("ru-RU") + " ₽";
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("ru-RU");
}
