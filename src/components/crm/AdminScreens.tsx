import { useEffect, useState } from "react";
import { api, fmtMoney, fmtDate } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn, Field, Badge } from "./shared";
import Icon from "@/components/ui/icon";

// ─── Аналитика (главная для админа) ─────────────────────────────────
export function AdminAnalytics({ user }: { user: Record<string, unknown> }) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [cities, setCities] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api("get_analytics", { period }),
      api("get_cities", { is_admin: true }),
    ]).then(([d, c]) => {
      setData(d);
      setCities(c);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  const periods = [
    { key: "today", label: "Сегодня" },
    { key: "week", label: "Неделя" },
    { key: "month", label: "Месяц" },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Аналитика" />
        <div className="px-5 pb-4 flex gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : !data ? null : (
        <div className="px-5 py-4 flex flex-col gap-4 pb-28">
          {/* Сводка */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-orange-50">
              <p className="text-xs text-gray-500">Заявок создано</p>
              <p className="text-3xl font-black text-orange-500 mt-1">{data.orders_count as number}</p>
            </Card>
            <Card className="bg-blue-50">
              <p className="text-xs text-gray-500">Запросов получено</p>
              <p className="text-3xl font-black text-blue-500 mt-1">{data.requests_count as number}</p>
            </Card>
            <Card className="bg-green-50">
              <p className="text-xs text-gray-500">Мероприятий сегодня</p>
              <p className="text-3xl font-black text-green-500 mt-1">{data.today_events as number}</p>
            </Card>
            <Card className="bg-purple-50">
              <p className="text-xs text-gray-500">Завтра</p>
              <p className="text-3xl font-black text-purple-500 mt-1">{data.tomorrow_events as number}</p>
            </Card>
          </div>

          {/* Воронка */}
          <Card>
            <p className="text-sm font-bold text-gray-800 mb-4">Воронка: Запросы → Заявки</p>
            {/* Визуальная воронка */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-700">Всего запросов</span>
                </div>
                <span className="text-lg font-black text-blue-600">{data.requests_count as number}</span>
              </div>
              <div className="flex justify-center">
                <Icon name="ChevronDown" size={16} className="text-gray-300" />
              </div>
              <div className="bg-orange-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-sm text-gray-700">Перешло в заявки</span>
                </div>
                <span className="text-lg font-black text-orange-600">{data.orders_count as number}</span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                style={{ width: `${Math.min(data.conversion as number, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {(data.requests_count as number) > 0 ? "Авторасчёт: заявки / запросы × 100%" : "Нет данных за период"}
              </span>
              <span className="text-base font-black text-orange-500">
                {data.conversion as number}%
              </span>
            </div>
          </Card>

          {/* Города */}
          {cities.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">КПД городов</p>
              <div className="flex flex-col gap-2">
                {cities.slice(0, 10).map((c) => {
                  const pct = c.kpd_pct as number;
                  const ok = pct >= 100;
                  return (
                    <div key={c.id as number} className="bg-white rounded-2xl p-4 shadow-card">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{c.city_name as string}</p>
                          <p className="text-xs text-gray-400">{c.manager_name as string}</p>
                        </div>
                        <span className={`text-lg font-black ${ok ? "text-green-500" : "text-red-500"}`}>
                          {ok ? "+" : ""}{pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Менеджеры */}
          {(data.managers as Array<Record<string, unknown>>).length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">Закрываемость по менеджерам</p>
              <div className="flex flex-col gap-2">
                {(data.managers as Array<Record<string, unknown>>).map((m) => (
                  <Card key={m.id as number}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{m.name as string}</p>
                        <p className="text-xs text-gray-400">Заявок: {m.orders as number}</p>
                      </div>
                      <span className="text-base font-black text-green-500">{fmtMoney(m.commission as number)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Управление менеджерами ──────────────────────────────────────────
export function AdminManagers({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string, extra?: Record<string, unknown>) => void;
}) {
  const [managers, setManagers] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_managers").then(setManagers).catch(() => []).finally(() => setLoading(false));
  }, []);

  const filtered = managers.filter((m) =>
    `${m.first_name} ${m.last_name} ${m.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Менеджеры" />
        <div className="px-5 pb-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="Users" title="Менеджеров нет" sub="Когда менеджеры зарегистрируются, они появятся здесь" />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {filtered.map((m) => (
            <Card
              key={m.id as number}
              onClick={() => onNavigate("admin-manager-detail", { manager: m })}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{m.first_name as string} {m.last_name as string}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.phone as string}</p>
                    <p className="text-xs text-gray-400">Заявок: {m.orders_count as number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${(m.balance as number) < 0 ? "text-red-500" : "text-gray-900"}`}>
                    {fmtMoney(m.balance as number)}
                  </p>
                  <p className="text-xs text-gray-400">Баланс</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Детальная карточка менеджера (для админа) ───────────────────────
export function AdminManagerDetail({
  adminUser,
  manager,
  onBack,
  onNavigate,
}: {
  adminUser: Record<string, unknown>;
  manager: Record<string, unknown>;
  onBack: () => void;
  onNavigate: (s: string, extra?: Record<string, unknown>) => void;
}) {
  const month = new Date().toISOString().slice(0, 7);
  const [plan, setPlan] = useState({ plan: 0, fact: 0, remaining: 0, pct: 0, bonus_pct: 0, cities_deduct_pct: 50 });
  const [planInput, setPlanInput] = useState("");
  const [bonusPct, setBonusPct] = useState("0");
  const [citiesDeductPct, setCitiesDeductPct] = useState("50");
  const [payout, setPayout] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api("get_plan", { manager_id: manager.id, month_year: month }).then((r) => {
      setPlan(r);
      setPlanInput(String(r.plan || ""));
      setBonusPct(String(r.bonus_pct || "0"));
      setCitiesDeductPct(String(r.cities_deduct_pct ?? "50"));
    }).catch(() => {});
  }, [manager.id]);

  const savePlan = async () => {
    setLoading(true);
    try {
      await api("set_plan", {
        manager_id: manager.id, month_year: month,
        plan_amount: parseFloat(planInput) || 0,
        bonus_pct: parseFloat(bonusPct) || 0,
        cities_deduct_pct: parseFloat(citiesDeductPct) ?? 50,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      api("get_plan", { manager_id: manager.id, month_year: month }).then(setPlan).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    const r = await api("calculate_payout", { manager_id: manager.id, month_year: month });
    setPayout(r);
  };

  const approvePayout = async () => {
    if (!payout) return;
    setLoading(true);
    try {
      await api("approve_payout", {
        manager_id: manager.id, month_year: month,
        period_label: new Date().toLocaleString("ru-RU", { month: "long", year: "numeric" }),
        ...payout,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title={`${manager.first_name} ${manager.last_name}`} onBack={onBack} />
      </div>
      <div className="px-5 py-4 flex flex-col gap-4 pb-28">
        {/* Инфо */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
            <div>
              <p className="font-black text-gray-900 text-lg">{manager.first_name as string} {manager.last_name as string}</p>
              <p className="text-sm text-gray-500">{manager.phone as string}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400">Баланс</p>
              <p className={`font-black text-lg ${(manager.balance as number) < 0 ? "text-red-500" : "text-gray-900"}`}>
                {fmtMoney(manager.balance as number)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400">Заявок всего</p>
              <p className="font-black text-lg text-gray-900">{manager.orders_count as number}</p>
            </div>
          </div>
        </Card>

        {/* План */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-4">
            План на {new Date().toLocaleString("ru-RU", { month: "long" })}
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Сумма плана (₽)</label>
              <input
                type="number"
                value={planInput}
                onChange={(e) => setPlanInput(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Мотивация (% премии при выполнении)</label>
              <div className="flex gap-2">
                {["0", "10", "15", "20"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setBonusPct(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      bonusPct === p
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {p === "0" ? "Нет" : `+${p}%`}
                  </button>
                ))}
              </div>
              {bonusPct !== "0" && (
                <p className="text-xs text-orange-500 mt-1">
                  При выполнении плана менеджер получит +{bonusPct}% от суммы предоплат
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Удержание за города из выплаты (%)</label>
              <div className="flex gap-2">
                {["0", "50", "100"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setCitiesDeductPct(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      citiesDeductPct === p
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                100% стоимости городов спишется с баланса при публикации. Из выплаты — ещё {citiesDeductPct}%
              </p>
            </div>

            <OBtn onClick={savePlan} disabled={loading} full>
              {saved ? "✓ Сохранено" : "Сохранить план и мотивацию"}
            </OBtn>
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Факт</span>
            <span className="font-bold text-green-500">{fmtMoney(plan.fact)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${Math.min(plan.pct, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">{plan.pct.toFixed(0)}% выполнения</p>
        </Card>

        {/* Расчёт выплаты */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-3">Расчёт выплаты</p>
          <OBtn onClick={calculate} full variant="outline" size="sm">
            Рассчитать выплату
          </OBtn>
          {payout && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Предоплаты за месяц</span>
                <span className="font-medium">{fmtMoney(payout.commission as number)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`${payout.plan_met ? "text-green-600" : "text-gray-400"}`}>
                  Мотивация {payout.plan_met ? `(+${payout.bonus_pct}%)` : "(план не выполнен)"}
                </span>
                <span className={`font-medium ${payout.plan_met ? "text-green-600" : "text-gray-400"}`}>
                  {payout.plan_met ? `+${fmtMoney(payout.bonus as number)}` : "0 ₽"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Города: стоимость {fmtMoney(payout.cities_total as number)}, удержание {payout.cities_deduct_pct}%
                </span>
                <span className="font-medium text-red-500">−{fmtMoney(payout.cities_deduct as number)}</span>
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">К выплате</span>
                <span className={`text-xl font-black ${(payout.total as number) < 0 ? "text-red-500" : "text-gray-900"}`}>
                  {fmtMoney(payout.total as number)}
                </span>
              </div>
              <OBtn onClick={approvePayout} full disabled={loading} className="mt-2">
                Утвердить выплату
              </OBtn>
            </div>
          )}
        </Card>

        {/* Создать запрос на перевод */}
        <OBtn onClick={() => onNavigate("admin-create-transfer", { manager })} full variant="outline">
          Создать запрос на перевод
        </OBtn>
      </div>
    </div>
  );
}

// ─── Создать запрос на перевод (от админа) ───────────────────────────
export function AdminCreateTransfer({
  adminUser,
  manager,
  onBack,
  onDone,
}: {
  adminUser: Record<string, unknown>;
  manager: Record<string, unknown>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({ order_id: "", amount: "", recipient_phone: "", recipient_bank: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("get_orders", { user_id: manager.id }).then(setOrders).catch(() => []);
  }, [manager.id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await api("create_transfer_request", {
        admin_id: adminUser.id, manager_id: manager.id,
        order_id: form.order_id || null,
        amount: parseFloat(form.amount),
        recipient_phone: form.recipient_phone,
        recipient_bank: form.recipient_bank,
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
      <TopBar title="Запрос на перевод" onBack={onBack} />
      <div className="px-5 py-5 flex flex-col gap-4 flex-1">
        <div className="bg-orange-50 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-orange-600">Менеджер: {manager.first_name as string} {manager.last_name as string}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Заявка (опционально)</label>
          <select
            value={form.order_id}
            onChange={(e) => set("order_id", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">— Выбрать заявку —</option>
            {orders.map((o) => (
              <option key={o.id as number} value={String(o.id)}>
                #{o.id} · {o.city} · {fmtDate(o.event_date as string)}
              </option>
            ))}
          </select>
        </div>

        <Field label="Сумма перевода" type="number" placeholder="1000" value={form.amount} onChange={(v) => set("amount", v)} />
        <Field label="Телефон получателя" placeholder="+7..." value={form.recipient_phone} onChange={(v) => set("recipient_phone", v)} />
        <Field label="Банк получателя" placeholder="Альфа-Банк" value={form.recipient_bank} onChange={(v) => set("recipient_bank", v)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OBtn onClick={submit} full disabled={loading || !form.amount}>
          {loading ? "Отправляем..." : "Отправить запрос"}
        </OBtn>
      </div>
    </div>
  );
}

// ─── Города (для админа) ─────────────────────────────────────────────
export function AdminCitiesScreen({
  user,
}: {
  user: Record<string, unknown>;
}) {
  const [cities, setCities] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState<Record<string, { publish_cost: string; target_kpd: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api("get_cities", { is_admin: true }).then(setCities).catch(() => []);
  }, []);

  const filtered = cities.filter((c) =>
    (c.city_name as string).toLowerCase().includes(search.toLowerCase())
  );

  const getVal = (city: string, key: "publish_cost" | "target_kpd", fallback: number) =>
    edited[city]?.[key] ?? String(fallback);

  const setVal = (city: string, key: "publish_cost" | "target_kpd", val: string) =>
    setEdited((e) => ({ ...e, [city]: { ...e[city], [key]: val } }));

  const save = async (city: string, publish_cost: number, target_kpd: number) => {
    setSaving(city);
    try {
      await api("save_city_config", { city_name: city, publish_cost, target_kpd });
      setSaved(city);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Города" right={<span className="text-xs text-gray-400">{cities.length} городов</span>} />
        <div className="px-5 pb-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск города..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>

      {cities.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">
          Города появятся здесь после того, как менеджеры начнут их публиковать
        </div>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {filtered.map((c) => {
            const cityName = c.city_name as string;
            const cost = parseFloat(getVal(cityName, "publish_cost", c.publish_cost as number));
            const kpd = parseFloat(getVal(cityName, "target_kpd", c.target_kpd as number));
            return (
              <Card key={cityName}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="MapPin" size={16} className="text-orange-500" />
                  <p className="font-bold text-gray-900">{cityName}</p>
                  {(c.kpd_pct as number) >= 100 ? (
                    <span className="ml-auto text-xs font-bold text-green-500">+{(c.kpd_pct as number).toFixed(0)}%</span>
                  ) : (
                    <span className="ml-auto text-xs font-bold text-red-500">{(c.kpd_pct as number).toFixed(0)}%</span>
                  )}
                </div>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Стоимость публикации (₽)</p>
                    <input
                      type="number"
                      value={getVal(cityName, "publish_cost", c.publish_cost as number)}
                      onChange={(e) => setVal(cityName, "publish_cost", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Целевой КПД (×)</p>
                    <input
                      type="number"
                      value={getVal(cityName, "target_kpd", c.target_kpd as number)}
                      onChange={(e) => setVal(cityName, "target_kpd", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>
                <button
                  onClick={() => save(cityName, cost, kpd)}
                  disabled={saving === cityName}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    saved === cityName
                      ? "bg-green-500 text-white"
                      : "bg-orange-500 text-white active:scale-95"
                  }`}
                >
                  {saved === cityName ? "✓ Сохранено" : saving === cityName ? "Сохраняем..." : "Сохранить"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Настройки (для админа) ──────────────────────────────────────────
export function AdminSettingsScreen({
  user,
  onLogout,
}: {
  user: Record<string, unknown>;
  onLogout: () => void;
}) {
  const [notifSettings, setNotifSettings] = useState({
    new_request: true,
    order_created: true,
    transfer_done: true,
    payout_approved: true,
    plan_set: true,
  });

  const toggleNotif = (key: string) =>
    setNotifSettings((s) => ({ ...s, [key]: !s[key as keyof typeof s] }));

  const notifLabels: Record<string, string> = {
    new_request: "Новый запрос",
    order_created: "Новая заявка",
    transfer_done: "Перевод выполнен",
    payout_approved: "Выплата утверждена",
    plan_set: "Назначен план",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Настройки" />
      </div>

      <div className="bg-white px-5 py-6 mb-3 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">👑</div>
        <div>
          <p className="text-xl font-black text-gray-900">Администратор</p>
          <p className="text-sm text-gray-500 mt-0.5">{user.phone as string}</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-28">
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-3">Уведомления</p>
          <div className="flex flex-col gap-3">
            {Object.entries(notifLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <button
                  onClick={() => toggleNotif(key)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    notifSettings[key as keyof typeof notifSettings] ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    notifSettings[key as keyof typeof notifSettings] ? "right-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-gray-800 mb-1">Экспорт данных</p>
          <p className="text-xs text-gray-400 mb-3">Выгрузка всех заявок в CSV</p>
          <OBtn variant="outline" full size="sm">
            Экспорт в Excel / CSV
          </OBtn>
        </Card>

        <button
          onClick={onLogout}
          className="w-full py-4 rounded-2xl border-2 border-red-100 text-red-400 font-semibold text-sm active:bg-red-50 transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

// ─── Все заявки (для админа) ─────────────────────────────────────────
export function AdminAllOrders({
  user,
  onBack,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
}) {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("get_orders", { is_admin: true }).then(setOrders).catch(() => []).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    JSON.stringify(o).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Все заявки" onBack={onBack} right={<span className="text-xs text-gray-400">{orders.length} всего</span>} />
        <div className="px-5 pb-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по городу, менеджеру..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="FileText" title="Заявок нет" />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {filtered.map((o) => (
            <Card key={o.id as number}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{o.id as number}</span>
                    <Badge color="gray">{o.manager_name as string}</Badge>
                  </div>
                  <p className="font-bold text-gray-900">{o.city as string || "—"}</p>
                  <p className="text-sm text-gray-600">{fmtDate(o.event_date as string)} {o.event_time ? String(o.event_time).slice(0, 5) : ""}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{o.hero as string || "—"}</p>
                </div>
                <span className="text-base font-black text-green-500">+{fmtMoney(o.commission as number)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}