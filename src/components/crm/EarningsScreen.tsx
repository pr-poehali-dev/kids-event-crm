import { useEffect, useState } from "react";
import { api, fmtMoney } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, Badge } from "./shared";
import Icon from "@/components/ui/icon";

export function EarningsScreen({
  user,
  onBack,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
}) {
  const [payouts, setPayouts] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get_payouts", { manager_id: user.id })
      .then(setPayouts)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [user.id]);

  const statusLabel: Record<string, string> = {
    pending: "Ожидает",
    approved: "Утверждена",
    paid: "Выплачена",
  };
  const statusColor: Record<string, "orange" | "blue" | "green"> = {
    pending: "orange",
    approved: "blue",
    paid: "green",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Мой заработок" onBack={onBack} />
      </div>
      {loading ? (
        <Spinner />
      ) : payouts.length === 0 ? (
        <EmptyState
          icon="Wallet"
          title="Пока нет начислений"
          sub="Здесь будут отображаться ваши выплаты по периодам"
        />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">
          {payouts.map((p) => (
            <Card key={p.id as number}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-bold text-gray-800">{p.period as string}</p>
                <Badge color={statusColor[p.status as string] || "orange"}>
                  {statusLabel[p.status as string] || p.status as string}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <Row label="Комиссия (40%)" value={fmtMoney(p.commission as number)} />
                <Row label="Премия (+5% за план)" value={fmtMoney(p.bonus as number)} />
                <Row label="Оплата за города" value={fmtMoney(p.cities as number)} />
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-700">Итого</span>
                  <span className="text-xl font-black text-gray-900">{fmtMoney(p.total as number)}</span>
                </div>
                {p.paid_at && (
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Дата выплаты</span>
                    <span>{new Date(p.paid_at as string).toLocaleDateString("ru-RU")}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
