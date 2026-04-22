import { useEffect, useState } from "react";
import { api, fmtMoney } from "@/lib/api";
import { TopBar, Card, Spinner, EmptyState, OBtn } from "./shared";
import Icon from "@/components/ui/icon";

// ─── Баланс ──────────────────────────────────────────────────────────
export function BalanceScreen({
  user,
  onNavigate,
}: {
  user: Record<string, unknown>;
  onNavigate: (s: string) => void;
}) {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("get_balance", { user_id: user.id }),
      api("get_transactions", { user_id: user.id }),
    ]).then(([b, t]) => {
      setBalance(b.balance);
      setTxs(t);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  const txIcon: Record<string, string> = {
    order_commission: "TrendingUp",
    city_publish: "MapPin",
    transfer: "ArrowUpRight",
  };
  const txColor: Record<string, string> = {
    order_commission: "text-green-500",
    city_publish: "text-red-500",
    transfer: "text-red-500",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Текущий баланс" />
      <div className="px-5 py-6 flex flex-col gap-5 flex-1">
        <div className={`w-full rounded-3xl p-8 flex flex-col items-center shadow-orange ${balance < 0 ? "bg-gradient-to-br from-red-500 to-red-400" : "bg-gradient-to-br from-orange-500 to-orange-400"}`}>
          <p className={`font-medium mb-2 ${balance < 0 ? "text-red-100" : "text-orange-100"}`}>Доступный баланс</p>
          <p className="text-5xl font-black text-white">{fmtMoney(balance)}</p>
          <p className={`text-sm mt-3 ${balance < 0 ? "text-red-200" : "text-orange-200"}`}>Обновлено сейчас</p>
        </div>

        <button
          onClick={() => onNavigate("transfer-request")}
          className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 text-left active:scale-95 shadow-card"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Icon name="ArrowRightLeft" size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">Перевод по запросу</p>
            <p className="text-gray-400 text-sm mt-0.5">Выполнить перевод администратора</p>
          </div>
          <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
        </button>

        {loading ? (
          <Spinner />
        ) : txs.length === 0 ? (
          <EmptyState icon="Receipt" title="Нет транзакций" sub="История операций появится здесь" />
        ) : (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">История операций</p>
            <div className="flex flex-col gap-2">
              {txs.map((tx) => (
                <div key={tx.id as number} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon name={txIcon[tx.type as string] || "Circle"} size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{tx.description as string || tx.type as string}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at as string).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <span className={`text-sm font-bold ${txColor[tx.type as string] || (tx.amount as number > 0 ? "text-green-500" : "text-red-500")}`}>
                    {tx.amount as number > 0 ? "+" : ""}{fmtMoney(tx.amount as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="h-24" />
    </div>
  );
}

// ─── Перевод по запросу ──────────────────────────────────────────────
export function TransferRequestScreen({
  user,
  onBack,
  onDone,
}: {
  user: Record<string, unknown>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [transfers, setTransfers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [doing, setDoing] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api("get_transfer_requests", { manager_id: user.id, status: "pending" })
      .then(setTransfers)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [user.id]);

  const doTransfer = async (tr: Record<string, unknown>) => {
    setDoing(tr.id as number);
    try {
      await api("complete_transfer", { transfer_id: tr.id, user_id: user.id });
      onDone();
    } finally {
      setDoing(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <TopBar title="Перевод по запросу" onBack={onBack} />
      {loading ? (
        <Spinner />
      ) : transfers.length === 0 ? (
        <EmptyState icon="ArrowRightLeft" title="Нет запросов на перевод" sub="Когда администратор создаст запрос, он появится здесь" />
      ) : (
        <div className="px-5 py-5 flex flex-col gap-5 flex-1">
          {transfers.map((tr) => (
            <div key={tr.id as number} className="flex flex-col gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-2">
                <Icon name="FileText" size={18} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-600">
                  Запрос по заявке #{tr.order_id as number || tr.id as number}
                </span>
              </div>

              <Card className="bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Сумма к переводу</p>
                <p className="text-4xl font-black text-gray-900">{fmtMoney(tr.amount as number)}</p>
              </Card>

              <Card>
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Реквизиты получателя</p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Телефон</p>
                    <p className="text-xl font-black text-gray-900">{tr.recipient_phone as string || "—"}</p>
                  </div>
                  <button
                    onClick={() => copy(tr.recipient_phone as string || "")}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
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
                  <p className="text-base font-semibold text-gray-900">{tr.recipient_bank as string || "—"}</p>
                </div>
              </Card>

              <OBtn
                onClick={() => doTransfer(tr)}
                full
                disabled={doing === (tr.id as number)}
              >
                {doing === (tr.id as number) ? "Выполняем..." : "Перевести"}
              </OBtn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
