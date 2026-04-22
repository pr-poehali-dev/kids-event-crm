import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn, Field } from "./shared";
import Icon from "@/components/ui/icon";

export const ALL_CITIES = [
  "Абакан","Альметьевск","Ангарск","Архангельск","Астрахань","Барнаул","Батайск",
  "Белгород","Бийск","Благовещенск","Брянск","Великий Новгород","Владивосток",
  "Владикавказ","Владимир","Волгоград","Волгодонск","Волжский","Вологда","Воронеж",
  "Димитровград","Екатеринбург","Златоуст","Иваново","Ижевск","Иркутск","Йошкар-Ола",
  "Казань","Калининград","Калуга","Каменск-Уральский","Кемерово","Киров","Кисловодск",
  "Коломна","Комсомольск-на-Амуре","Королёв","Кострома","Краснодар","Красногорск",
  "Красноярск","Курган","Курск","Липецк","Магнитогорск","Майкоп","Махачкала","Москва",
  "Мурманск","Набережные Челны","Нальчик","Нижневартовск","Нижнекамск","Нижний Новгород",
  "Нижний Тагил","Новокузнецк","Новороссийск","Новосибирск","Новочеркасск","Норильск",
  "Омск","Оренбург","Орёл","Орск","Пенза","Пермь","Петрозаводск","Псков",
  "Ростов-на-Дону","Рубцовск","Рыбинск","Рязань","Самара","Санкт-Петербург","Саранск",
  "Саратов","Севастополь","Симферополь","Смоленск","Сочи","Ставрополь","Старый Оскол",
  "Стерлитамак","Сургут","Сыктывкар","Сызрань","Таганрог","Тамбов","Тверь","Тольятти",
  "Томск","Тула","Тюмень","Улан-Удэ","Ульяновск","Уссурийск","Уфа","Хабаровск",
  "Ханты-Мансийск","Чебоксары","Челябинск","Череповец","Чита","Шахты","Энгельс",
  "Якутск","Ярославль",
];

// ─── Мои запросы (хаб) ─────────────────────────────────────────────
export function RequestsHub({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
}) {
  const [conversion, setConversion] = useState<{ requests: number; orders: number; conversion: number } | null>(null);

  useEffect(() => {
    api("get_manager_conversion", { user_id: user.id })
      .then(setConversion)
      .catch(() => {});
  }, [user.id]);

  const convPct = conversion ? conversion.conversion : null;

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Мои запросы" />
      <div className="px-5 py-6 flex flex-col gap-4 flex-1">
        <button
          onClick={() => onNavigate("requests-cities")}
          className="w-full bg-orange-500 rounded-2xl p-6 flex items-center gap-4 text-left active:scale-95 shadow-orange"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon name="Globe" size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Запросы по городам</p>
            <p className="text-orange-100 text-sm">Все входящие запросы</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate("requests-active")}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-center gap-4 text-left active:scale-95 shadow-card"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Icon name="Clock" size={24} className="text-orange-500" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-lg">Мои активные запросы</p>
            <p className="text-gray-500 text-sm">Запросы, ожидающие ответа</p>
          </div>
        </button>

        <Card className="bg-orange-50 border border-orange-100 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Icon name="TrendingUp" size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Конверсия в заявку</p>
                <p className="text-2xl font-black text-orange-500">
                  {convPct === null ? "—" : `${convPct}%`}
                </p>
              </div>
            </div>
            {conversion && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Запросов: {conversion.requests}</p>
                <p className="text-xs text-gray-400">Заявок: {conversion.orders}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Список городов с запросами ─────────────────────────────────────
export function RequestsCitiesList({
  user,
  onNavigate,
  onBack,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string, extra?: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState<Array<{ city_name: string; unread: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_requests", { user_id: user.id })
      .then((reqs: Array<{ city: string; is_read: boolean }>) => {
        const map: Record<string, number> = {};
        reqs.forEach((req) => {
          if (!map[req.city]) map[req.city] = 0;
          if (!req.is_read) map[req.city]++;
        });
        // Объединяем полный список 96 городов с городами из запросов
        const allNames = Array.from(new Set([...ALL_CITIES, ...Object.keys(map)])).sort((a, b) =>
          a.localeCompare(b, "ru")
        );
        setCities(allNames.map((c) => ({ city_name: c, unread: map[c] || 0 })));
      })
      .catch(() => {
        setCities(ALL_CITIES.map((c) => ({ city_name: c, unread: 0 })));
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const filtered = cities.filter((c) => c.city_name.toLowerCase().includes(search.toLowerCase()));
  const letters = Array.from(new Set(filtered.map((c) => c.city_name[0].toUpperCase()))).sort();

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Все запросы по городам" onBack={onBack} />
      <div className="px-5 py-3">
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

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-1">
          <div className="flex-1 px-5">
            {filtered.map((c) => (
              <button
                key={c.city_name}
                onClick={() => onNavigate("city-requests", { city: c.city_name })}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
              >
                <span className="font-semibold text-gray-900">{c.city_name}</span>
                {c.unread > 0 ? (
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{c.unread}</span>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="Check" size={14} className="text-green-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center py-3 pr-2 gap-0.5">
            {letters.map((l) => (
              <button key={l} className="text-xs font-bold text-orange-500 w-6 h-5 flex items-center justify-center">
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Запросы по конкретному городу ──────────────────────────────────
export function CityRequestsScreen({
  user,
  city,
  onNavigate,
  onBack,
}: {
  user: Record<string, unknown>;
  city: string;
  onNavigate: (s: string, extra?: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [all, setAll] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api("get_requests", { user_id: user.id, city }).then(setAll).catch(() => []).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user.id, city]);

  const markRead = async (id: number) => {
    await api("mark_request_read", { request_id: id });
    load();
  };

  const filtered = all.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );
  const unread = filtered.filter((r) => !r.is_read);
  const read = filtered.filter((r) => r.is_read);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title={city} onBack={onBack} />
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
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 flex-1">
          {unread.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <p className="text-sm font-bold text-gray-700">Непрочитанные</p>
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center ml-1">
                  <span className="text-white text-xs font-bold">{unread.length}</span>
                </div>
              </div>
              {unread.map((r) => (
                <RequestCard key={r.id as number} r={r} onRead={markRead} />
              ))}
            </>
          )}
          {read.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-sm font-bold text-gray-700">Прочитанные</p>
                <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center ml-1">
                  <span className="text-white text-xs font-bold">{read.length}</span>
                </div>
              </div>
              {read.map((r) => (
                <RequestCard key={r.id as number} r={r} dimmed />
              ))}
            </>
          )}
          {all.length === 0 && (
            <EmptyState icon="Inbox" title="Нет запросов" sub="В этом городе пока нет запросов" />
          )}
        </div>
      )}

      <button
        onClick={() => onNavigate("new-request", { city })}
        className="fixed bottom-28 right-5 w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-orange active:scale-95 transition-all"
      >
        <Icon name="Plus" size={26} className="text-white" />
      </button>
    </div>
  );
}

function RequestCard({ r, onRead, dimmed }: { r: Record<string, unknown>; onRead?: (id: number) => void; dimmed?: boolean }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card p-4 ${!r.is_read ? "border-l-4 border-l-orange-400" : ""} ${dimmed ? "opacity-70" : ""}`}
      onClick={() => onRead && !r.is_read && onRead(r.id as number)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-gray-800">{fmtDate(r.event_date as string)} {r.event_time ? String(r.event_time).slice(0, 5) : ""}</p>
          <p className="text-sm text-gray-600 mt-0.5">{r.hero as string || "—"}</p>
          <p className="text-sm text-gray-500">{r.address as string || "—"}</p>
          <div className="flex gap-4 mt-2">
            <p className="text-xs text-gray-400">Менеджер: {r.manager_name as string}</p>
          </div>
        </div>
        {!r.is_read && (
          <div className="w-3 h-3 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Новый запрос (форма) ───────────────────────────────────────────
export function NewRequestForm({
  user,
  defaultCity,
  onBack,
  onDone,
}: {
  user: Record<string, unknown>;
  defaultCity?: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    city: defaultCity || "",
    event_date: "",
    event_time: "",
    program: "",
    hero: "",
    address: "",
    children_count: "",
    children_age: "",
    animator_question: "",
    animators_to_send: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citySearch, setCitySearch] = useState(defaultCity || "");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const citySuggestions = citySearch.length >= 1
    ? ALL_CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 8)
    : [];

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await api("create_request", { user_id: user.id, ...form });
      onDone();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Новый запрос" onBack={onBack} />
      <div className="px-5 py-5 flex flex-col gap-4 flex-1">
        {/* Город с автодополнением */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-medium text-gray-600">Город</label>
          <input
            placeholder="Начните вводить..."
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              set("city", e.target.value);
              setShowCityDropdown(true);
            }}
            onFocus={() => setShowCityDropdown(true)}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
          />
          {showCityDropdown && citySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-card-hover mt-1 overflow-hidden">
              {citySuggestions.map((c) => (
                <button
                  key={c}
                  onMouseDown={() => {
                    setCitySearch(c);
                    set("city", c);
                    setShowCityDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 border-b border-gray-100 last:border-0 font-medium"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Дата" type="date" value={form.event_date} onChange={(v) => set("event_date", v)} />
        <Field label="Время" type="time" value={form.event_time} onChange={(v) => set("event_time", v)} />
        <Field label="Программа" placeholder="Название программы" value={form.program} onChange={(v) => set("program", v)} />
        <Field label="Герой" placeholder="Леди Баг, Человек-Паук..." value={form.hero} onChange={(v) => set("hero", v)} />
        <Field label="Адрес" placeholder="Улица, дом, кв." value={form.address} onChange={(v) => set("address", v)} />
        <Field label="Кол-во детей" type="number" value={form.children_count} onChange={(v) => set("children_count", v)} />
        <Field label="Возраст детей" placeholder="4–8 лет" value={form.children_age} onChange={(v) => set("children_age", v)} />
        <Field label="Вопросы аниматорам" placeholder="Пожелания, особенности..." value={form.animator_question} onChange={(v) => set("animator_question", v)} />
        <Field label="Каким аниматорам отправить" placeholder="Имена через запятую" value={form.animators_to_send} onChange={(v) => set("animators_to_send", v)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OBtn onClick={submit} full disabled={loading || !form.city}>
          {loading ? "Отправляем..." : "Отправить запрос"}
        </OBtn>
      </div>
    </div>
  );
}

// ─── Активные запросы ───────────────────────────────────────────────
export function ActiveRequestsScreen({
  user,
  onNavigate,
  onBack,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
  onBack: () => void;
}) {
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_requests", { user_id: user.id })
      .then((r: Array<Record<string, unknown>>) => setRequests(r.filter((req) => !req.is_read)))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Активные запросы" onBack={onBack} />
      </div>
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="Inbox"
          title="Нет активных запросов"
          sub="Все запросы прочитаны или новых пока нет"
          action={
            <OBtn onClick={() => onNavigate("requests-cities")} size="sm">
              Перейти к городам
            </OBtn>
          }
        />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id as number} className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-l-orange-400">
              <p className="text-base font-bold text-gray-900">{r.city as string}</p>
              <p className="text-sm text-gray-600 mt-0.5">{fmtDate(r.event_date as string)} {r.event_time ? String(r.event_time).slice(0, 5) : ""}</p>
              <p className="text-xs text-gray-400 mt-1">{r.hero as string || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}