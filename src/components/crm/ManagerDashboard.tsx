import { useEffect, useState } from "react";
import { api, fmtMoney } from "@/lib/api";
import { TopBar, Card, Spinner, OBtn } from "./shared";
import Icon from "@/components/ui/icon";

export function ManagerDashboard({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
}) {
  const [balance, setBalance] = useState<number>(user.balance as number || 0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api("get_balance", { user_id: user.id }).then((r) => setBalance(r.balance)).catch(() => {});
    api("get_notifications", { user_id: user.id })
      .then((r: Array<{ is_read: boolean }>) => setUnread(r.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, [user.id]);

  const tiles = [
    { label: "Мои запросы", icon: "MessageSquare", key: "requests", color: "bg-orange-50" },
    { label: "Работа с заявками", icon: "ClipboardList", key: "orders", color: "bg-blue-50" },
    { label: "Мои заявки", icon: "FileCheck", key: "my-orders", color: "bg-purple-50" },
    { label: "Мой заработок", icon: "Wallet", key: "earnings", color: "bg-green-50" },
    { label: "Рабочие города", icon: "MapPin", key: "cities", color: "bg-yellow-50" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Добро пожаловать</p>
            <h1 className="text-2xl font-black text-gray-900 mt-0.5">{user.first_name} {user.last_name} 👋</h1>
          </div>
          <button
            onClick={() => onNavigate("notifications")}
            className="relative w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center"
          >
            <Icon name="Bell" size={22} className="text-orange-500" />
            {unread > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unread}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {tiles.slice(0, 4).map((t, i) => (
            <button
              key={t.key}
              onClick={() => onNavigate(t.key)}
              className={`${t.color} rounded-2xl p-5 flex flex-col items-start gap-3 text-left active:scale-95 transition-all shadow-card animate-slide-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                <Icon name={t.icon} size={20} className="text-gray-700" />
              </div>
              <span className="text-sm font-semibold text-gray-800 leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate("cities")}
          className="w-full bg-yellow-50 rounded-2xl p-5 flex items-center gap-4 text-left active:scale-95 transition-all shadow-card animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
            <Icon name="MapPin" size={20} className="text-gray-700" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Рабочие города</span>
          <Icon name="ChevronRight" size={16} className="text-gray-400 ml-auto" />
        </button>

        <button
          onClick={() => onNavigate("balance")}
          className={`w-full rounded-2xl p-5 flex items-center justify-between text-white active:scale-95 transition-all shadow-orange animate-slide-up ${
            balance < 0 ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-orange-500 to-orange-400"
          }`}
          style={{ animationDelay: "250ms" }}
        >
          <div>
            <p className={`text-sm font-medium ${balance < 0 ? "text-red-100" : "text-orange-100"}`}>Текущий баланс</p>
            <p className="text-3xl font-black mt-1">{fmtMoney(balance)}</p>
          </div>
          <Icon name="ArrowRight" size={22} className="text-white/80" />
        </button>
      </div>

      <div className="h-24" />
    </div>
  );
}
