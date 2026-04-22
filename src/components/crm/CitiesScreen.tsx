import { useEffect, useState } from "react";
import { api, fmtMoney } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn, Field } from "./shared";
import Icon from "@/components/ui/icon";

// ─── Рабочие города ──────────────────────────────────────────────────
export function CitiesScreen({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
}) {
  const [cities, setCities] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_cities", { user_id: user.id })
      .then(setCities)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar
          title="Рабочие города"
          right={<span className="text-xs text-gray-400">Норма города</span>}
        />
      </div>
      {loading ? (
        <Spinner />
      ) : cities.length === 0 ? (
        <EmptyState
          icon="MapPin"
          title="Нет рабочих городов"
          sub="Опубликуйте города, чтобы начать принимать заявки. Стоимость публикации спишется с вашего баланса."
        />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 flex-1 pb-24">
          {cities.map((c) => {
            const pct = c.kpd_pct as number;
            const positive = pct >= 100;
            return (
              <Card key={c.id as number}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon name="MapPin" size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.city_name as string}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Публикация: {fmtMoney(c.publish_cost as number)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${positive ? "text-green-500" : "text-red-500"}`}>
                      {positive ? "+" : ""}{pct.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-400">КПД</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${positive ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <button
        onClick={() => onNavigate("publish-cities")}
        className="fixed bottom-28 right-5 w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-orange active:scale-95 transition-all"
      >
        <Icon name="Plus" size={26} className="text-white" />
      </button>
    </div>
  );
}

// ─── Опубликовать города ─────────────────────────────────────────────
export function PublishCitiesScreen({
  user,
  onBack,
  onDone,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [cities, setCities] = useState([{ id: 1, city_name: "", publish_cost: "270" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const add = () => setCities((c) => [...c, { id: Date.now(), city_name: "", publish_cost: "270" }]);
  const update = (id: number, k: string, v: string) =>
    setCities((c) => c.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const total = cities.reduce((s, c) => s + (parseFloat(c.publish_cost) || 0), 0);

  const submit = async () => {
    const valid = cities.filter((c) => c.city_name.trim());
    if (!valid.length) { setError("Укажите хотя бы один город"); return; }
    setLoading(true);
    try {
      await api("publish_cities", {
        user_id: user.id,
        cities: valid.map((c) => ({ city_name: c.city_name, publish_cost: parseFloat(c.publish_cost) || 270 })),
      });
      onDone();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Опубликовать города" onBack={onBack} />
      <div className="px-5 py-5 flex flex-col gap-5 flex-1">
        {cities.map((c, i) => (
          <div key={c.id} className="flex flex-col gap-3 pb-5 border-b border-gray-100 last:border-0">
            {cities.length > 1 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Город {i + 1}</p>
            )}
            <Field
              label="Название города"
              placeholder="Волгоград"
              value={c.city_name}
              onChange={(v) => update(c.id, "city_name", v)}
              hint="Укажите точное название"
            />
            <Field
              label="Стоимость публикации"
              type="number"
              placeholder="270"
              value={c.publish_cost}
              onChange={(v) => update(c.id, "publish_cost", v)}
              hint="В рублях"
            />
            <button className="flex items-center gap-2 text-orange-500 font-medium text-sm border border-orange-200 rounded-xl px-4 py-3 bg-orange-50 w-fit">
              <Icon name="Paperclip" size={16} className="text-orange-500" />
              Прикрепить скрин
            </button>
          </div>
        ))}

        <button onClick={add} className="flex items-center gap-2 text-orange-500 font-semibold py-3">
          <Icon name="Plus" size={18} className="text-orange-500" />
          Добавить ещё город
        </button>

        <div className="bg-orange-50 rounded-xl px-4 py-3 flex justify-between">
          <span className="text-sm text-gray-600">Итого спишется</span>
          <span className="text-sm font-black text-orange-600">{total.toLocaleString("ru-RU")} ₽</span>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OBtn onClick={submit} full disabled={loading}>
          {loading ? "Публикуем..." : "Опубликовать"}
        </OBtn>
      </div>
    </div>
  );
}
