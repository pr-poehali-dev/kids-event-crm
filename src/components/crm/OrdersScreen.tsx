import { useEffect, useState } from "react";
import { api, fmtMoney, fmtDate } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn, Field, Badge } from "./shared";
import Icon from "@/components/ui/icon";
import { ALL_CITIES } from "./RequestsScreen";

// ─── Работа с заявками (хаб) ────────────────────────────────────────
export function OrdersHub({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
}) {
  const [plan, setPlan] = useState({ plan: 0, fact: 0, remaining: 0, pct: 0 });
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    api("get_plan", { manager_id: user.id, month_year: month }).then(setPlan).catch(() => {});
  }, [user.id]);

  const income40 = plan.fact;
  const bonus = plan.pct >= 100 ? Math.round(plan.fact * 0.05) : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Работа с заявками" />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <Card>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
            План / Факт — {new Date().toLocaleString("ru-RU", { month: "long", year: "numeric" })}
          </p>
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">План комиссии</p>
              <p className="text-xl font-black text-gray-900">{fmtMoney(plan.plan)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Уже комиссия</p>
              <p className="text-xl font-black text-green-500">{fmtMoney(plan.fact)}</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min(plan.pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">{plan.pct.toFixed(0)}%</span>
            <span className="text-xs text-gray-400">Осталось: <span className="text-orange-500 font-semibold">{fmtMoney(plan.remaining)}</span></span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-green-50">
            <p className="text-xs text-gray-500">Личный доход (40%)</p>
            <p className="text-xl font-black text-green-600 mt-1">{fmtMoney(income40)}</p>
          </Card>
          <Card className="bg-orange-50">
            <p className="text-xs text-gray-500">+5% за план</p>
            <p className="text-xl font-black text-orange-500 mt-1">{bonus !== null ? fmtMoney(bonus) : "? ₽"}</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Новая заявка", icon: "PlusCircle", key: "new-order", orange: true },
            { label: "Изменить заявку", icon: "Pencil", key: "edit-order", orange: false },
            { label: "Все мои заявки", icon: "FileText", key: "my-orders", orange: false },
            { label: "Отработанные", icon: "CheckCircle", key: "done-orders", orange: false },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => onNavigate(btn.key)}
              className={`${btn.orange ? "bg-orange-500 shadow-orange" : "bg-white border border-gray-200"} rounded-2xl p-4 flex flex-col items-start gap-2 active:scale-95 transition-all shadow-card`}
            >
              <Icon name={btn.icon} size={20} className={btn.orange ? "text-white" : "text-orange-500"} />
              <span className={`text-sm font-semibold leading-tight ${btn.orange ? "text-white" : "text-gray-800"}`}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Новая заявка (28 полей) ─────────────────────────────────────────
export function NewOrderForm({
  user,
  onBack,
  onDone,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    programs: "", program_duration: "", extra_program: "", hero: "",
    event_date: "", event_time: "",
    address_region: "", address_city: "", address_street: "", address_house: "",
    children_count: "", children_age: "", birthday_name: "", birthday_age: "",
    notes: "", birthday_info: "",
    total_cost: "", travel_cost: "", prepayment: "",
    client_phone: "", client_name: "", animator_name: "", animator_title: "",
    commission_pct: "", assistant_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCityDrop, setShowCityDrop] = useState(false);
  const citySuggestions = citySearch.length >= 1
    ? ALL_CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 8)
    : [];

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string) => parseFloat(form[k] || "0") || 0;
  const totalSum = num("total_cost") + num("travel_cost");
  const remainder = num("total_cost") - num("prepayment");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await api("create_order", {
        user_id: user.id, ...form,
        total_sum: totalSum, remainder,
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
      <TopBar title="Новая заявка" onBack={onBack} />
      <div className="px-5 py-5 flex flex-col gap-5 flex-1">

        {/* Блок 1 */}
        <Section title="Основное">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Скрин о предоплате</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-gray-50">
                <Icon name="Upload" size={24} className="text-gray-400" />
                <p className="text-sm text-gray-400">Нажмите для загрузки</p>
              </div>
            </div>
            <Field label="Дата" type="date" value={form.event_date} onChange={(v) => set("event_date", v)} />
            <Field label="Время" type="time" value={form.event_time} onChange={(v) => set("event_time", v)} />
            <Field label="Программа" placeholder="Название программы" value={form.programs} onChange={(v) => set("programs", v)} />
            <Field label="Время программы" placeholder="1.5 часа" value={form.program_duration} onChange={(v) => set("program_duration", v)} />
            <Field label="Доп. программа" placeholder="Мастер-класс..." value={form.extra_program} onChange={(v) => set("extra_program", v)} />
            <Field label="Герой" placeholder="Леди Баг, Эльза..." value={form.hero} onChange={(v) => set("hero", v)} />
          </div>
        </Section>

        {/* Блок 2 */}
        <Section title="Адрес">
          <div className="flex flex-col gap-4">
            <Field label="Область" value={form.address_region} onChange={(v) => set("address_region", v)} />
            {/* Город с автодополнением */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-sm font-medium text-gray-600">Город / нас. пункт</label>
              <input
                placeholder="Начните вводить..."
                value={citySearch || form.address_city}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  set("address_city", e.target.value);
                  setShowCityDrop(true);
                }}
                onFocus={() => setShowCityDrop(true)}
                onBlur={() => setTimeout(() => setShowCityDrop(false), 150)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
              {showCityDrop && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-card-hover mt-1 overflow-hidden">
                  {citySuggestions.map((c) => (
                    <button
                      key={c}
                      onMouseDown={() => {
                        setCitySearch(c);
                        set("address_city", c);
                        setShowCityDrop(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 border-b border-gray-100 last:border-0 font-medium"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Field label="Улица" value={form.address_street} onChange={(v) => set("address_street", v)} />
            <Field label="Дом" value={form.address_house} onChange={(v) => set("address_house", v)} />
          </div>
        </Section>

        {/* Блок 3 */}
        <Section title="Дети и именинник">
          <div className="flex flex-col gap-4">
            <Field label="Кол-во детей" type="number" value={form.children_count} onChange={(v) => set("children_count", v)} />
            <Field label="Возраст детей" placeholder="4–8 лет" value={form.children_age} onChange={(v) => set("children_age", v)} />
            <Field label="Имя именинника" value={form.birthday_name} onChange={(v) => set("birthday_name", v)} />
            <Field label="Возраст именинника" value={form.birthday_age} onChange={(v) => set("birthday_age", v)} />
            <Field label="Информация об имениннике" placeholder="Характер, интересы..." value={form.birthday_info} onChange={(v) => set("birthday_info", v)} />
            <Field label="Примечание" placeholder="Дополнительно..." value={form.notes} onChange={(v) => set("notes", v)} />
          </div>
        </Section>

        {/* Блок 4 */}
        <Section title="Финансы">
          <div className="flex flex-col gap-4">
            <Field label="Стоимость" type="number" placeholder="5000" value={form.total_cost} onChange={(v) => set("total_cost", v)} />
            <Field label="Дорожные" type="number" placeholder="300" value={form.travel_cost} onChange={(v) => set("travel_cost", v)} />
            <div className="flex justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">Всего</span>
              <span className="text-sm font-bold text-gray-900">{fmtMoney(totalSum)}</span>
            </div>
            <Field label="Предоплата (≥ дорожные)" type="number" placeholder="1000" value={form.prepayment} onChange={(v) => set("prepayment", v)} />
            <div className="flex justify-between bg-orange-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">Остаток</span>
              <span className="text-sm font-bold text-orange-600">{fmtMoney(remainder)}</span>
            </div>
            <div className="flex justify-between bg-green-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">На баланс (вся предоплата)</span>
              <span className="text-sm font-bold text-green-600">{fmtMoney(num("prepayment"))}</span>
            </div>
          </div>
        </Section>

        {/* Блок 5 */}
        <Section title="Контакты и аниматор">
          <div className="flex flex-col gap-4">
            <Field label="Телефон клиента" placeholder="+7..." value={form.client_phone} onChange={(v) => set("client_phone", v)} />
            <Field label="Имя клиента" value={form.client_name} onChange={(v) => set("client_name", v)} />
            <Field label="Аниматор" value={form.animator_name} onChange={(v) => set("animator_name", v)} />
            <Field label="Название героя/аниматора" value={form.animator_title} onChange={(v) => set("animator_title", v)} />
            <Field label="Комиссия (₽)" type="number" placeholder="0" value={form.commission_pct} onChange={(v) => set("commission_pct", v)} hint="Введите сумму комиссии в рублях" />
            <Field label="Ассистент по чатам" value={form.assistant_name} onChange={(v) => set("assistant_name", v)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Фото героя/программы</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-gray-50">
                <Icon name="Image" size={24} className="text-gray-400" />
                <p className="text-sm text-gray-400">Загрузить фото</p>
              </div>
            </div>
          </div>
        </Section>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OBtn onClick={submit} full disabled={loading}>
          {loading ? "Сохраняем..." : "Создать заявку"}
        </OBtn>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-orange-500" />
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Мои заявки ──────────────────────────────────────────────────────
export function MyOrdersScreen({
  user,
  onlyDone = false,
  onNavigate,
  onBack,
}: {
  user: Record<string, unknown>;
  onlyDone?: boolean;
  onNavigate: (s: string, extra?: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_orders", { user_id: user.id, only_done: onlyDone })
      .then(setOrders)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [user.id, onlyDone]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title={onlyDone ? "Отработанные заявки" : "Все мои заявки"} onBack={onBack} />
      </div>
      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState icon="FileText" title="Нет заявок" sub="Созданные заявки появятся здесь" />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {orders.map((o) => (
            <Card
              key={o.id as number}
              onClick={() => !onlyDone && onNavigate("order-detail", { order_id: o.id })}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{o.city as string || "—"}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{fmtDate(o.event_date as string)} {o.event_time ? String(o.event_time).slice(0, 5) : ""}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{o.hero as string || "—"}</p>
                  <p className="text-xs text-gray-400">{o.client_name as string || "—"}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-green-500">+{fmtMoney(o.commission as number)}</span>
                  <p className="text-xs text-gray-400 mt-1">комиссия</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Редактирование заявки ────────────────────────────────────────────
export function EditOrderScreen({
  user,
  orderId,
  onBack,
  onDone,
}: {
  user: Record<string, unknown>;
  orderId?: number;
  onBack: () => void;
  onDone: () => void;
}) {
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    api("get_orders", { user_id: user.id }).then((r: Array<Record<string, unknown>>) => {
      const future = r.filter((o) => !o.event_date || new Date(o.event_date as string) >= new Date());
      setOrders(future);
      if (orderId) {
        const o = r.find((x) => x.id === orderId);
        if (o) selectOrder(o);
      }
    }).catch(() => []).finally(() => setLoading(false));
  }, [user.id]);

  const selectOrder = (o: Record<string, unknown>) => {
    setSelected(o);
    setForm({ programs: o.programs as string || "", hero: o.hero as string || "", notes: o.notes as string || "", animator_name: o.animator_name as string || "" });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api("update_order", { user_id: user.id, order_id: selected.id, ...form });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><TopBar title="Изменить заявку" onBack={onBack} /><Spinner /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Изменить заявку" onBack={onBack} />
      </div>
      {!selected ? (
        <div className="px-5 py-4 flex flex-col gap-3">
          {orders.length === 0 ? (
            <EmptyState icon="FileText" title="Нет активных заявок" sub="Все заявки уже отработаны" />
          ) : (
            orders.map((o) => (
              <Card key={o.id as number} onClick={() => selectOrder(o)}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{o.city as string}</p>
                    <p className="text-sm text-gray-600">{fmtDate(o.event_date as string)}</p>
                    <p className="text-xs text-gray-400">{o.hero as string}</p>
                  </div>
                  <Icon name="Pencil" size={18} className="text-orange-500" />
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="px-5 py-5 flex flex-col gap-4 flex-1">
          <div className="bg-orange-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-orange-600">Заявка #{selected.id as number} · {selected.city as string}</p>
            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(selected.event_date as string)}</p>
          </div>
          <Field label="Программа" value={form.programs} onChange={(v) => setForm((f) => ({ ...f, programs: v }))} />
          <Field label="Герой" value={form.hero} onChange={(v) => setForm((f) => ({ ...f, hero: v }))} />
          <Field label="Аниматор" value={form.animator_name} onChange={(v) => setForm((f) => ({ ...f, animator_name: v }))} />
          <Field label="Примечание" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
          <OBtn onClick={save} full disabled={saving}>{saving ? "Сохраняем..." : "Сохранить"}</OBtn>
          <button onClick={() => setSelected(null)} className="text-sm text-gray-400 text-center">Выбрать другую</button>
        </div>
      )}
    </div>
  );
}