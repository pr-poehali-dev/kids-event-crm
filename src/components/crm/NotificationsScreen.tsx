import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn } from "./shared";
import Icon from "@/components/ui/icon";

export function NotificationsScreen({
  user,
  onBack,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
}) {
  const [notifs, setNotifs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api("get_notifications", { user_id: user.id })
      .then(setNotifs)
      .catch(() => [])
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user.id]);

  const markAll = async () => {
    await api("mark_notifications_read", { user_id: user.id });
    load();
  };

  const icons: Record<string, string> = {
    new_request: "Bell",
    order_created: "FileCheck",
    transfer_request: "ArrowRightLeft",
    transfer_done: "CheckCircle",
    payout_approved: "Wallet",
    plan_set: "Target",
    reminder: "Clock",
    review: "Star",
  };
  const colors: Record<string, string> = {
    new_request: "bg-orange-100 text-orange-500",
    order_created: "bg-green-100 text-green-500",
    transfer_request: "bg-blue-100 text-blue-500",
    transfer_done: "bg-green-100 text-green-500",
    payout_approved: "bg-purple-100 text-purple-500",
    plan_set: "bg-yellow-100 text-yellow-600",
    reminder: "bg-gray-100 text-gray-500",
    review: "bg-pink-100 text-pink-500",
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar
          title="Уведомления"
          onBack={onBack}
          right={
            unreadCount > 0 ? (
              <button onClick={markAll} className="text-sm text-orange-500 font-semibold">
                Прочитать все
              </button>
            ) : undefined
          }
        />
      </div>
      {loading ? (
        <Spinner />
      ) : notifs.length === 0 ? (
        <EmptyState icon="Bell" title="Нет уведомлений" sub="Здесь будут отображаться важные события" />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {notifs.map((n, i) => (
            <Card
              key={n.id as number}
              className={`animate-slide-up ${!n.is_read ? "border-l-4 border-l-orange-400" : "opacity-70"}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colors[n.type as string] || "bg-gray-100 text-gray-500"}`}>
                  <Icon name={icons[n.type as string] || "Bell"} size={16} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                    {n.title as string}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.body as string}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(n.created_at as string).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
