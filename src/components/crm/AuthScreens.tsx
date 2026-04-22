import { useState } from "react";
import { api, setSession } from "@/lib/api";
import { Field, OBtn } from "./shared";
import Icon from "@/components/ui/icon";

export function AuthScreen({ onAuth }: { onAuth: (user: Record<string, unknown>) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  if (mode === "register") return <RegisterScreen onBack={() => setMode("login")} onAuth={onAuth} />;
  return <LoginScreen onRegister={() => setMode("register")} onAuth={onAuth} />;
}

function LoginScreen({
  onRegister,
  onAuth,
}: {
  onRegister: () => void;
  onAuth: (u: Record<string, unknown>) => void;
}) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");

  const requestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api("request_otp", { phone });
      setDevOtp(res.dev_otp || "");
      setStep("otp");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api("verify_otp", { phone, code: otp });
      setSession(res);
      onAuth(res);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white animate-fade-in">
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="mb-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mb-6 shadow-orange">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Вход</h1>
          <p className="text-gray-500 mt-2">Event CRM для детских праздников</p>
        </div>

        <div className="flex flex-col gap-4">
          {step === "phone" ? (
            <>
              <Field
                label="Телефон"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={setPhone}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <OBtn onClick={requestOtp} full disabled={loading || phone.length < 10}>
                {loading ? "Отправляем..." : "Получить код"}
              </OBtn>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Field label="Код из SMS" placeholder="000000" value={otp} onChange={setOtp} type="tel" />
                {devOtp && (
                  <p className="text-xs text-orange-500 bg-orange-50 rounded-lg px-3 py-2 font-medium">
                    Тестовый код: <strong>{devOtp}</strong>
                  </p>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <OBtn onClick={verifyOtp} full disabled={loading || otp.length < 4}>
                {loading ? "Проверяем..." : "Войти"}
              </OBtn>
              <button onClick={() => setStep("phone")} className="text-sm text-gray-400 text-center">
                Изменить номер
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-12 text-center">
        <p className="text-gray-500 text-sm">
          Нет аккаунта?{" "}
          <button onClick={onRegister} className="text-orange-500 font-semibold">
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({
  onBack,
  onAuth,
}: {
  onBack: () => void;
  onAuth: (u: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", messenger: "whatsapp" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const register = async () => {
    setError("");
    setLoading(true);
    try {
      await api("register", form);
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 gap-4 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mb-2">✅</div>
        <h2 className="text-2xl font-black text-gray-900">Аккаунт создан!</h2>
        <p className="text-gray-500 text-center">Войдите по вашему номеру телефона</p>
        <OBtn onClick={onBack} full>Войти</OBtn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white animate-fade-in">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon name="ChevronLeft" size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Регистрация</h1>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Field label="Имя" placeholder="Анна" value={form.first_name} onChange={(v) => set("first_name", v)} />
        <Field label="Фамилия" placeholder="Кузнецова" value={form.last_name} onChange={(v) => set("last_name", v)} />
        <Field label="Телефон" placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(v) => set("phone", v)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Мессенджер</label>
          <div className="flex gap-2">
            {[
              { v: "whatsapp", label: "WhatsApp" },
              { v: "telegram", label: "Telegram" },
              { v: "other", label: "Другой" },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => set("messenger", m.v)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                  form.messenger === m.v
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="px-5 py-5 safe-bottom">
        <OBtn
          onClick={register}
          full
          disabled={loading || !form.first_name || !form.last_name || !form.phone}
        >
          {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
        </OBtn>
      </div>
    </div>
  );
}
