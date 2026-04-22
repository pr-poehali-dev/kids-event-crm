import { useState } from "react";
import Icon from "@/components/ui/icon";

type Screen =
  | "dashboard"
  | "my-requests"
  | "new-request"
  | "current-requests"
  | "work-with-orders"
  | "new-order"
  | "change-order"
  | "my-orders"
  | "my-earnings"
  | "working-cities"
  | "publish-cities"
  | "all-requests-by-cities"
  | "city-detail"
  | "balance"
  | "transfer-by-request"
  | "notifications"
  | "settings";

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  type: "new" | "status" | "event";
}

const notifications: Notification[] = [
  { id: 1, text: "Новый запрос в Волгоград на 15.02", time: "5 мин назад", read: false, type: "new" },
  { id: 2, text: "Статус заявки #000045 изменён на «Подтверждено»", time: "1 час назад", read: false, type: "status" },
  { id: 3, text: "Завтра праздник в Казани в 14:00 — Человек-Паук", time: "2 часа назад", read: false, type: "event" },
  { id: 4, text: "Новый запрос в Казань на 18.02", time: "вчера", read: true, type: "new" },
  { id: 5, text: "Выплата 12 500 ₽ зачислена на счёт", time: "вчера", read: true, type: "status" },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [history, setHistory] = useState<Screen[]>([]);
  const [notifList, setNotifList] = useState(notifications);

  const unreadCount = notifList.filter((n) => !n.read).length;

  const navigate = (to: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(to);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setScreen(prev);
      window.scrollTo(0, 0);
    }
  };

  const markAllRead = () => setNotifList((n) => n.map((x) => ({ ...x, read: true })));

  return (
    <div className="min-h-screen bg-gray-50 font-golos">
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        {screen === "dashboard" && <Dashboard navigate={navigate} unreadCount={unreadCount} />}
        {screen === "my-requests" && <MyRequests navigate={navigate} goBack={goBack} />}
        {screen === "new-request" && <NewRequest navigate={navigate} goBack={goBack} />}
        {screen === "current-requests" && <CurrentRequests navigate={navigate} goBack={goBack} />}
        {screen === "work-with-orders" && <WorkWithOrders navigate={navigate} goBack={goBack} />}
        {screen === "new-order" && <NewOrder navigate={navigate} goBack={goBack} />}
        {screen === "change-order" && <ChangeOrder navigate={navigate} goBack={goBack} />}
        {screen === "my-orders" && <MyOrders navigate={navigate} goBack={goBack} />}
        {screen === "my-earnings" && <MyEarnings navigate={navigate} goBack={goBack} />}
        {screen === "working-cities" && <WorkingCities navigate={navigate} goBack={goBack} />}
        {screen === "publish-cities" && <PublishCities navigate={navigate} goBack={goBack} />}
        {screen === "all-requests-by-cities" && <AllRequestsByCities navigate={navigate} goBack={goBack} />}
        {screen === "city-detail" && <CityDetail navigate={navigate} goBack={goBack} />}
        {screen === "balance" && <Balance navigate={navigate} goBack={goBack} />}
        {screen === "transfer-by-request" && <TransferByRequest navigate={navigate} goBack={goBack} />}
        {screen === "notifications" && (
          <Notifications navigate={navigate} goBack={goBack} notifList={notifList} markAllRead={markAllRead} />
        )}
        {screen === "settings" && <Settings navigate={navigate} goBack={goBack} />}
      </div>
    </div>
  );
}

/* ─── SHARED COMPONENTS ─── */

function TopBar({
  title,
  onBack,
  rightElement,
}: {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Icon name="ChevronLeft" size={20} className="text-gray-700" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      {rightElement}
    </div>
  );
}

function OrangeButton({
  children,
  onClick,
  className = "",
  fullWidth = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-orange-500 text-white font-semibold rounded-2xl py-4 px-6 shadow-orange active:scale-95 transition-all ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white rounded-2xl shadow-card p-4 ${onClick ? "cursor-pointer active:shadow-card-hover transition-shadow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function InputField({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all bg-gray-50"
      />
    </div>
  );
}

/* ─── DASHBOARD ─── */

function Dashboard({ navigate, unreadCount }: { navigate: (s: Screen) => void; unreadCount: number }) {
  const tiles = [
    { label: "Мои запросы", icon: "MessageSquare", screen: "my-requests" as Screen, color: "bg-orange-50" },
    { label: "Работа с заявками", icon: "ClipboardList", screen: "work-with-orders" as Screen, color: "bg-blue-50" },
    { label: "Мои заявки", icon: "FileCheck", screen: "my-orders" as Screen, color: "bg-purple-50" },
    { label: "Мой заработок", icon: "Wallet", screen: "my-earnings" as Screen, color: "bg-green-50" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <div className="px-5 pt-12 pb-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">С возвращением, Анна! 👋</h1>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-200">
              <span className="text-xl">👩‍💼</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => navigate("notifications")}
                className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-[10px] font-bold">{unreadCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile, i) => (
            <button
              key={tile.label}
              onClick={() => navigate(tile.screen)}
              className={`${tile.color} rounded-2xl p-5 flex flex-col items-start gap-3 text-left active:scale-95 transition-all shadow-card animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                <Icon name={tile.icon} size={20} className="text-gray-700" />
              </div>
              <span className="text-sm font-semibold text-gray-800 leading-tight">{tile.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("working-cities")}
          className="mt-3 w-full bg-yellow-50 rounded-2xl p-5 flex items-center gap-4 text-left active:scale-95 transition-all shadow-card animate-slide-up"
          style={{ animationDelay: "240ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
            <Icon name="MapPin" size={20} className="text-gray-700" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Рабочие города</span>
        </button>

        <button
          onClick={() => navigate("balance")}
          className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 flex items-center justify-between text-white active:scale-95 transition-all shadow-orange animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <div>
            <p className="text-orange-100 text-sm font-medium">Текущий баланс</p>
            <p className="text-3xl font-bold mt-1">+5 789 ₽</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon name="ArrowRight" size={22} className="text-white" />
          </div>
        </button>

        {unreadCount > 0 && (
          <button
            onClick={() => navigate("notifications")}
            className="mt-3 w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in"
          >
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Icon name="Bell" size={16} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Новые уведомления</p>
              <p className="text-xs text-gray-500">{unreadCount} непрочитанных</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
          </button>
        )}
      </div>

      <div className="px-5 py-6 mt-4 flex justify-center safe-bottom">
        <button
          onClick={() => navigate("settings")}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <Icon name="Settings" size={22} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}

/* ─── MY REQUESTS ─── */

function MyRequests({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Мои запросы" onBack={goBack} />
      <div className="px-5 py-6 flex flex-col gap-4 flex-1">
        <button
          onClick={() => navigate("new-request")}
          className="w-full bg-orange-500 rounded-2xl p-6 flex items-center gap-4 text-left active:scale-95 transition-all shadow-orange"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon name="PlusCircle" size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Новый запрос</p>
            <p className="text-orange-100 text-sm mt-0.5">Создать заявку клиента</p>
          </div>
        </button>

        <button
          onClick={() => navigate("current-requests")}
          className="w-full bg-gray-50 rounded-2xl p-6 flex items-center gap-4 text-left active:scale-95 transition-all shadow-card border border-gray-100"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Icon name="List" size={24} className="text-orange-500" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-lg">Текущие запросы</p>
            <p className="text-gray-500 text-sm mt-0.5">Все активные запросы</p>
          </div>
        </button>

        <div className="mt-auto">
          <Card className="bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Icon name="TrendingUp" size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Конверсия в заявку</p>
                <p className="text-2xl font-bold text-orange-500">25%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── NEW REQUEST ─── */

function NewRequest({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Новый запрос" onBack={goBack} />
      <div className="px-5 py-5 flex flex-col gap-4 flex-1">
        <InputField label="Город" placeholder="Например: Волгоград" />
        <InputField label="Дата" placeholder="дд.мм.гггг" type="date" />
        <InputField label="Время" placeholder="чч:мм" type="time" />
        <InputField label="Программа" placeholder="Название программы" />
        <InputField label="Герой" placeholder="Например: Леди Баг" />
        <InputField label="Адрес" placeholder="Улица, дом, кв." />
        <InputField label="Кол-во детей" placeholder="10" type="number" />
        <InputField label="Возраст детей" placeholder="4–8 лет" />
      </div>
      <div className="px-5 py-5 flex justify-end safe-bottom">
        <OrangeButton onClick={goBack}>Отправить</OrangeButton>
      </div>
    </div>
  );
}

/* ─── CURRENT REQUESTS ─── */

function CurrentRequests({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const items = [
    { city: "Волгоград", dt: "12.02  15:00", hero: "Леди Баг" },
    { city: "Казань", dt: "14.02  12:00", hero: "Человек-Паук" },
    { city: "Самара", dt: "15.02  11:00", hero: "Эльза" },
    { city: "Волгоград", dt: "17.02  18:00", hero: "Тачки" },
    { city: "Екатеринбург", dt: "20.02  14:30", hero: "Минни Маус" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Текущие запросы" onBack={goBack} />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{item.city}</p>
                <p className="text-sm text-gray-600 mt-0.5 font-medium">{item.dt}</p>
                <p className="text-xs text-gray-400 mt-1">{item.hero}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Icon name="ChevronRight" size={18} className="text-orange-500" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── WORK WITH ORDERS ─── */

function WorkWithOrders({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Работа с заявками" onBack={goBack} />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <Card className="bg-white">
          <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">План / Факт — Февраль</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">План комиссии</p>
              <p className="text-xl font-bold text-gray-900">28 000 ₽</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Уже комиссия</p>
              <p className="text-xl font-bold text-green-500">25 000 ₽</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: "89%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            Осталось: <span className="text-orange-500 font-semibold">3 000 ₽</span>
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-green-50">
            <p className="text-xs text-gray-500">Личный доход (40%)</p>
            <p className="text-xl font-bold text-green-600 mt-1">10 000 ₽</p>
          </Card>
          <Card className="bg-orange-50">
            <p className="text-xs text-gray-500">+5% за план</p>
            <p className="text-xl font-bold text-orange-500 mt-1">? ₽</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {[
            { label: "Новая заявка", icon: "PlusCircle", screen: "new-order" as Screen, orange: true },
            { label: "Изменить заявку", icon: "Pencil", screen: "change-order" as Screen, orange: false },
            { label: "Все мои заявки", icon: "FileText", screen: "my-orders" as Screen, orange: false },
            { label: "Отработанные", icon: "CheckCircle", screen: "my-orders" as Screen, orange: false },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.screen)}
              className={`${
                btn.orange ? "bg-orange-500" : "bg-white border border-gray-200"
              } rounded-2xl p-4 flex flex-col items-start gap-2 text-left active:scale-95 transition-all shadow-card`}
            >
              <Icon
                name={btn.icon}
                size={20}
                className={btn.orange ? "text-white" : "text-orange-500"}
              />
              <span className={`text-sm font-semibold leading-tight ${btn.orange ? "text-white" : "text-gray-800"}`}>
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── NEW ORDER ─── */

function NewOrder({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Новая заявка" onBack={goBack} />
      <div className="px-5 py-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Скрин о предоплате</label>
          <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 bg-gray-50">
            <Icon name="Upload" size={28} className="text-gray-400" />
            <p className="text-sm text-gray-500">Нажмите для загрузки</p>
          </div>
        </div>
        <InputField label="Дата" placeholder="дд.мм.гггг" type="date" />
        <InputField label="Время" placeholder="чч:мм" type="time" />
        <InputField label="Программа" placeholder="Название программы" />
        <InputField label="Время программы" placeholder="1.5 часа" />
        <InputField label="Доп. программа" placeholder="Например: мастер-класс" />
        <InputField label="Герой" placeholder="Например: Холодное сердце" />
        <InputField label="Адрес" placeholder="Улица, дом, кв." />
        <InputField label="Кол-во детей" placeholder="10" type="number" />
        <InputField label="Возраст детей" placeholder="4–8 лет" />
        <InputField label="Имя именинника" placeholder="Миша" />
        <InputField label="Возраст именинника" placeholder="7 лет" />
        <InputField label="Примечание" placeholder="Дополнительная информация..." />
      </div>
      <div className="px-5 py-5 flex justify-end safe-bottom">
        <OrangeButton onClick={goBack}>Отправить</OrangeButton>
      </div>
    </div>
  );
}

/* ─── CHANGE ORDER ─── */

function ChangeOrder({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const items = [
    { city: "Казань", dt: "10.02  14:00", hero: "Человек-Паук", address: "ул. Баумана, 5" },
    { city: "Волгоград", dt: "12.02  15:00", hero: "Леди Баг", address: "пр. Ленина, 44" },
    { city: "Самара", dt: "15.02  11:00", hero: "Эльза", address: "ул. Садовая, 12" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Изменить заявку" onBack={goBack} />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">{item.city}</p>
                <p className="text-sm text-gray-600 mt-0.5">{item.dt}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.hero}</p>
                <p className="text-xs text-gray-400">{item.address}</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center active:bg-orange-200 transition-colors">
                <Icon name="Pencil" size={16} className="text-orange-500" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── MY ORDERS ─── */

function MyOrders({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const items = [
    { city: "Казань", dt: "10.02  14:00", hero: "Человек-Паук", address: "ул. Баумана, 5", earn: "+1 200" },
    { city: "Волгоград", dt: "12.02  15:00", hero: "Леди Баг", address: "пр. Ленина, 44", earn: "+900" },
    { city: "Самара", dt: "15.02  11:00", hero: "Эльза", address: "ул. Садовая, 12", earn: "+1 500" },
    { city: "Екатеринбург", dt: "18.02  10:00", hero: "Тачки", address: "ул. Ленина, 7", earn: "+800" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar
          title="Мои заявки"
          onBack={goBack}
          rightElement={<span className="text-sm text-gray-400 font-medium">Оформленные</span>}
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">{item.city}</p>
                <p className="text-sm text-gray-600 mt-0.5">{item.dt}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.hero}</p>
                <p className="text-xs text-gray-400">{item.address}</p>
              </div>
              <span className="text-lg font-bold text-green-500">{item.earn} ₽</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── MY EARNINGS ─── */

function MyEarnings({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const periods = [
    { period: "Декабрь 16.12–31.12", amount: "18 000", bonus: "2 000", cities: "1 500", total: "21 500", date: "05.01.2025" },
    { period: "Декабрь 01.12–15.12", amount: "14 500", bonus: "0", cities: "1 200", total: "15 700", date: "20.12.2024" },
    { period: "Ноябрь 16.11–30.11", amount: "16 000", bonus: "1 500", cities: "900", total: "18 400", date: "05.12.2024" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Мой заработок" onBack={goBack} />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {periods.map((p, i) => (
          <Card key={i} style={{ animationDelay: `${i * 60}ms` }}>
            <p className="text-sm font-semibold text-gray-700 mb-3">{p.period}</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Сумма</span>
                <span className="text-gray-800 font-medium">{p.amount} ₽</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Премия</span>
                <span className="text-gray-800 font-medium">{p.bonus} ₽</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Оплата за города</span>
                <span className="text-gray-800 font-medium">{p.cities} ₽</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-semibold">Итого</span>
                <span className="text-lg font-bold text-gray-900">{p.total} ₽</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Дата выплаты</span>
                <span>{p.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── WORKING CITIES ─── */

function WorkingCities({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const cities = [
    { name: "Казань", pct: "+20%", positive: true },
    { name: "Волгоград", pct: "-15%", positive: false },
    { name: "Самара", pct: "+8%", positive: true },
    { name: "Екатеринбург", pct: "+5%", positive: true },
    { name: "Нижний Новгород", pct: "-3%", positive: false },
    { name: "Уфа", pct: "+12%", positive: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar
          title="Рабочие города"
          onBack={goBack}
          rightElement={<span className="text-xs text-gray-400 font-medium">Выполнение плана</span>}
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        {cities.map((c, i) => (
          <Card key={c.name} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon name="MapPin" size={16} className="text-gray-500" />
                </div>
                <span className="font-semibold text-gray-900">{c.name}</span>
              </div>
              <span className={`text-lg font-bold ${c.positive ? "text-green-500" : "text-red-500"}`}>{c.pct}</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="px-5 pb-8 flex flex-col items-end gap-1 safe-bottom">
        <button
          onClick={() => navigate("publish-cities")}
          className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-orange active:scale-95 transition-all"
        >
          <Icon name="Plus" size={26} className="text-white" />
        </button>
        <span className="text-xs text-gray-500 font-medium">Опубликовать города</span>
      </div>
    </div>
  );
}

/* ─── PUBLISH CITIES ─── */

function PublishCities({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const [cities, setCities] = useState([{ id: 1 }]);

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Опубликовать города" onBack={goBack} />
      <div className="px-5 py-5 flex flex-col gap-6 flex-1">
        {cities.map((c, i) => (
          <div key={c.id} className="flex flex-col gap-4 pb-5 border-b border-gray-100 last:border-0">
            {cities.length > 1 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Город {i + 1}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Название города</label>
              <input
                placeholder="Волгоград"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
              />
              <p className="text-xs text-gray-400">Укажите точное название города</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">Стоимость</label>
              <input
                placeholder="270"
                type="number"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
              />
              <p className="text-xs text-gray-400">Цена за единицу программы в рублях</p>
            </div>
            <button className="flex items-center gap-2 text-orange-500 font-medium text-sm border border-orange-200 rounded-xl px-4 py-3 bg-orange-50 w-fit">
              <Icon name="Paperclip" size={16} className="text-orange-500" />
              Прикрепить скрин
            </button>
          </div>
        ))}

        <button
          onClick={() => setCities((prev) => [...prev, { id: Date.now() }])}
          className="flex items-center gap-2 text-orange-500 font-semibold py-3"
        >
          <Icon name="Plus" size={18} className="text-orange-500" />
          Добавить ещё город
        </button>
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OrangeButton onClick={goBack} fullWidth>
          Опубликовать
        </OrangeButton>
      </div>
    </div>
  );
}

/* ─── ALL REQUESTS BY CITIES ─── */

function AllRequestsByCities({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const [search, setSearch] = useState("");
  const cities = [
    { name: "Волгоград", unread: 7 },
    { name: "Екатеринбург", unread: 0 },
    { name: "Казань", unread: 3 },
    { name: "Нижний Новгород", unread: 0 },
    { name: "Самара", unread: 1 },
    { name: "Уфа", unread: 0 },
  ];
  const letters = ["В", "Е", "К", "Н", "С", "У"];
  const filtered = cities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Все запросы по городам" onBack={goBack} />
        <div className="px-5 pb-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск города..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-1 bg-white">
        <div className="flex-1 px-5 py-2">
          {filtered.map((c, i) => (
            <button
              key={c.name}
              onClick={() => navigate("city-detail")}
              className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
            >
              <span className="font-semibold text-gray-900">{c.name}</span>
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
        <div className="flex flex-col items-center py-4 pr-2 gap-1">
          {letters.map((l) => (
            <button key={l} className="text-xs font-bold text-orange-500 w-6 h-6 flex items-center justify-center">
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CITY DETAIL ─── */

function CityDetail({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const [search, setSearch] = useState("");
  const unread = [
    { dt: "12.02  15:00", hero: "Леди Баг", address: "пр. Ленина, 44", manager: "Анна К.", animator: "Дима С." },
    { dt: "14.02  12:00", hero: "Человек-Паук", address: "ул. Советская, 10", manager: "Анна К.", animator: "Оля М." },
    { dt: "15.02  18:00", hero: "Эльза", address: "ул. Мира, 5", manager: "Анна К.", animator: "—" },
  ];
  const read = [
    { dt: "08.02  14:00", hero: "Тачки", address: "пр. Победы, 9", manager: "Анна К.", animator: "Паша Р." },
    { dt: "05.02  11:00", hero: "Минни Маус", address: "ул. Цветочная, 3", manager: "Анна К.", animator: "Катя Н." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Волгоград" onBack={goBack} />
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

      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <p className="text-sm font-bold text-gray-700">Непрочитанные</p>
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center ml-1">
            <span className="text-white text-xs font-bold">{unread.length}</span>
          </div>
        </div>
        {unread.map((item, i) => (
          <Card key={i} className="border-l-4 border-l-orange-400">
            <p className="text-sm font-bold text-gray-800">{item.dt}</p>
            <p className="text-sm text-gray-600 mt-0.5">{item.hero}</p>
            <p className="text-sm text-gray-600">{item.address}</p>
            <div className="flex gap-4 mt-2">
              <p className="text-xs text-gray-400">Менеджер: {item.manager}</p>
              <p className="text-xs text-gray-400">Аниматор: {item.animator}</p>
            </div>
          </Card>
        ))}

        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <p className="text-sm font-bold text-gray-700">Прочитанные</p>
          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center ml-1">
            <span className="text-white text-xs font-bold">{read.length}</span>
          </div>
        </div>
        {read.map((item, i) => (
          <Card key={i} className="opacity-75">
            <p className="text-sm font-bold text-gray-800">{item.dt}</p>
            <p className="text-sm text-gray-600 mt-0.5">{item.hero}</p>
            <p className="text-sm text-gray-600">{item.address}</p>
            <div className="flex gap-4 mt-2">
              <p className="text-xs text-gray-400">Менеджер: {item.manager}</p>
              <p className="text-xs text-gray-400">Аниматор: {item.animator}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="px-5 pb-8 flex flex-col items-end gap-1 safe-bottom">
        <button
          onClick={() => navigate("new-request")}
          className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-orange active:scale-95 transition-all"
        >
          <Icon name="Plus" size={26} className="text-white" />
        </button>
        <span className="text-xs text-gray-500 font-medium">Новый запрос</span>
      </div>
    </div>
  );
}

/* ─── BALANCE ─── */

function Balance({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Текущий баланс" onBack={goBack} />
      <div className="px-5 py-8 flex flex-col items-center gap-5 flex-1">
        <div className="w-full bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl p-8 flex flex-col items-center shadow-orange">
          <p className="text-orange-100 font-medium mb-2">Доступный баланс</p>
          <p className="text-5xl font-black text-white">+5 789 ₽</p>
          <p className="text-orange-200 text-sm mt-3">Обновлено сегодня</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 text-left active:scale-95 transition-all shadow-card">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold">Перевод аниматору</p>
              <p className="text-gray-400 text-sm mt-0.5">Выбор заявки</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
          </button>

          <button
            onClick={() => navigate("transfer-by-request")}
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 text-left active:scale-95 transition-all shadow-card"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Icon name="ArrowRightLeft" size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold">Перевод по запросу</p>
              <p className="text-gray-400 text-sm mt-0.5">Перевод по реквизитам</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── TRANSFER BY REQUEST ─── */

function TransferByRequest({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyPhone = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Перевод по запросу" onBack={goBack} />
      <div className="px-5 py-6 flex flex-col gap-5 flex-1">
        <button className="w-full bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FileText" size={18} className="text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">Запрос по заявке #000012</span>
          </div>
          <Icon name="ChevronDown" size={16} className="text-orange-400" />
        </button>

        <Card className="bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Сумма к переводу</p>
          <p className="text-4xl font-black text-gray-900">12 500 ₽</p>
        </Card>

        <Card>
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Реквизиты</p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Телефон</p>
              <p className="text-lg font-bold text-gray-900">+7 987 424-56-56</p>
            </div>
            <button
              onClick={copyPhone}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              {copied ? (
                <Icon name="Check" size={16} className="text-green-500" />
              ) : (
                <Icon name="Copy" size={16} className="text-gray-500" />
              )}
            </button>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Банк</p>
            <p className="text-base font-semibold text-gray-900">Альфа-Банк</p>
          </div>
        </Card>
      </div>
      <div className="px-5 py-5 safe-bottom">
        <OrangeButton onClick={goBack} fullWidth>
          Перевести
        </OrangeButton>
      </div>
    </div>
  );
}

/* ─── NOTIFICATIONS ─── */

function Notifications({
  navigate,
  goBack,
  notifList,
  markAllRead,
}: {
  navigate: (s: Screen) => void;
  goBack: () => void;
  notifList: Notification[];
  markAllRead: () => void;
}) {
  const icons: Record<Notification["type"], string> = {
    new: "Bell",
    status: "RefreshCw",
    event: "Calendar",
  };
  const colors: Record<Notification["type"], string> = {
    new: "bg-orange-100 text-orange-500",
    status: "bg-blue-100 text-blue-500",
    event: "bg-purple-100 text-purple-500",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar
          title="Уведомления"
          onBack={goBack}
          rightElement={
            <button onClick={markAllRead} className="text-sm text-orange-500 font-medium">
              Прочитать все
            </button>
          }
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {notifList.map((n, i) => (
          <Card
            key={n.id}
            className={`animate-slide-up ${!n.read ? "border-l-4 border-l-orange-400" : "opacity-70"}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colors[n.type]}`}>
                <Icon name={icons[n.type]} size={16} />
              </div>
              <div className="flex-1">
                <p className={`text-sm leading-snug ${n.read ? "text-gray-500" : "text-gray-900 font-medium"}`}>
                  {n.text}
                </p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── SETTINGS ─── */

function Settings({ navigate, goBack }: { navigate: (s: Screen) => void; goBack: () => void }) {
  const items = [
    { label: "Профиль", sub: "Анна Кузнецова", icon: "User", action: null },
    { label: "Уведомления", sub: "Настройка оповещений", icon: "Bell", action: null },
    { label: "Все запросы по городам", sub: "Управление запросами", icon: "MapPin", action: "all-requests-by-cities" as Screen },
    { label: "Безопасность", sub: "Пароль и доступ", icon: "Shield", action: null },
    { label: "Поддержка", sub: "Связаться с нами", icon: "HelpCircle", action: null },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Настройки" onBack={goBack} />
      </div>
      <div className="bg-white px-5 py-6 mb-3 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
          👩‍💼
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">Анна Кузнецова</p>
          <p className="text-sm text-gray-500 mt-0.5">Менеджер · Волгоград</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => item.action && navigate(item.action)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card active:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Icon name={item.icon} size={18} className="text-orange-500" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-gray-300" />
          </button>
        ))}

        <button className="w-full mt-2 py-4 rounded-2xl border-2 border-red-100 text-red-400 font-semibold text-sm active:bg-red-50 transition-colors">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
