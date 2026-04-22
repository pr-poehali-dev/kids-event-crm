import { useState } from "react";
import { api, clearSession } from "@/lib/api";
import { TopBar, Field, OBtn, Card } from "./shared";
import Icon from "@/components/ui/icon";

export function SettingsScreen({
  user,
  onLogout,
}: {
  user: Record<string, unknown>;
  onLogout: () => void;
}) {
  const [form, setForm] = useState({
    first_name: String(user.first_name || ""),
    last_name: String(user.last_name || ""),
    messenger: String(user.messenger || "whatsapp"),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api("update_profile", { user_id: user.id, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearSession();
    onLogout();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Настройки" />
      </div>

      <div className="bg-white px-5 py-6 mb-3 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl flex-shrink-0">
          {user.role === "admin" ? "👑" : "👤"}
        </div>
        <div>
          <p className="text-xl font-black text-gray-900">{user.first_name} {user.last_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {user.role === "admin" ? "Администратор" : "Менеджер"} · {user.phone as string}
          </p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        <Field label="Имя" value={form.first_name} onChange={(v) => set("first_name", v)} />
        <Field label="Фамилия" value={form.last_name} onChange={(v) => set("last_name", v)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Мессенджер</label>
          <div className="flex gap-2">
            {[{ v: "whatsapp", l: "WhatsApp" }, { v: "telegram", l: "Telegram" }, { v: "other", l: "Другой" }].map((m) => (
              <button
                key={m.v}
                onClick={() => set("messenger", m.v)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                  form.messenger === m.v ? "bg-orange-500 text-white border-orange-500" : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {m.l}
              </button>
            ))}
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <Icon name="CheckCircle" size={16} className="text-green-500" />
            <span className="text-sm text-green-600 font-medium">Сохранено!</span>
          </div>
        )}

        <OBtn onClick={save} full disabled={saving}>
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </OBtn>

        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl border-2 border-red-100 text-red-400 font-semibold text-sm active:bg-red-50 transition-colors mt-2"
        >
          Выйти из аккаунта
        </button>
      </div>
      <div className="h-28" />
    </div>
  );
}
