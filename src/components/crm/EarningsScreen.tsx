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
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    Promise.all([
      api("get_payouts", { manager_id: user.id }),
      api("get_plan", { manager_id: user.id, month_year: month }),
    ])
      .then(([p, pl]) => {
        setPayouts(p);
        setPlan(pl);
      })
      .catch(() => {})
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

  const bonusPct = plan ? (plan.bonus_pct as number) : 0;
  const planAmt = plan ? (plan.plan as number) : 0;
  const fact = plan ? (plan.fact as number) : 0;
  const planPct = plan ? (plan.pct as number) : 0;
  const planMet = planAmt > 0 && fact >= planAmt;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white">
        <TopBar title="Мой заработок" onBack={onBack} />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3 pb-28">

          {/* Мотивация — текущий месяц */}
          {planAmt > 0 && (
            <Card className={planMet ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-100"}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">
                  Мотивация — {new Date().toLocaleString("ru-RU", { month: "long" })}
                </p>
                {bonusPct > 0 ? (
                  <span className={`text-sm font-black px-3 py-1 rounded-full ${planMet ? "bg-green-500 text-white" : "bg-orange-200 text-orange-700"}`}>
                    +{bonusPct}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Без премии</span>
                )}
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Факт / план</span>
                <span className="font-bold text-gray-900">
                  {fmtMoney(fact)} / {fmtMoney(planAmt)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${planMet ? "bg-green-500" : "bg-orange-500"}`}
                  style={{ width: `${Math.min(planPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">{planPct.toFixed(0)}% выполнения</span>
                {planMet ? (
                  <span className="text-xs font-bold text-green-600">
                    ✓ Премия +{fmtMoney(fact * bonusPct / 100)} начислена!
                  </span>
                ) : bonusPct > 0 ? (
                  <span className="text-xs text-orange-600">
                    Осталось {fmtMoney(planAmt - fact)} до премии
                  </span>
                ) : null}
              </div>
            </Card>
          )}

          {/* История выплат */}
          {payouts.length === 0 ? (
            <EmptyState
              icon="Wallet"
              title="Пока нет начислений"
              sub="Выплаты по периодам появятся здесь после утверждения администратором"
            />
          ) : (
            payouts.map((p) => (
              <Card key={p.id as number}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-gray-800">{p.period as string}</p>
                  <Badge color={statusColor[p.status as string] || "orange"}>
                    {statusLabel[p.status as string] || p.status as string}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Row label="Предоплаты" value={fmtMoney(p.commission as number)} />
                  {(p.bonus as number) > 0 ? (
                    <Row label={`Мотивация (+${p.bonus_pct ?? "?"}%)`} value={`+${fmtMoney(p.bonus as number)}`} accent="green" />
                  ) : (
                    <Row label="Мотивация" value="план не выполнен" accent="gray" />
                  )}
                  {(p.cities as number) > 0 && (
                    <Row label="Удержание за города" value={`−${fmtMoney(p.cities as number)}`} accent="red" />
                  )}
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-700">К выплате</span>
                    <span className={`text-xl font-black ${(p.total as number) < 0 ? "text-red-500" : "text-gray-900"}`}>
                      {fmtMoney(p.total as number)}
                    </span>
                  </div>
                  {p.paid_at && (
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Дата выплаты</span>
                      <span>{new Date(p.paid_at as string).toLocaleDateString("ru-RU")}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "green" | "red" | "gray" }) {
  const color = accent === "green" ? "text-green-600" : accent === "red" ? "text-red-500" : accent === "gray" ? "text-gray-400" : "text-gray-800";
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}
