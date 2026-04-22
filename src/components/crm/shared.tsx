import Icon from "@/components/ui/icon";

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-20 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <Icon name="ChevronLeft" size={20} className="text-gray-700" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
      </div>
      {right && <div className="flex-shrink-0 ml-2">{right}</div>}
    </div>
  );
}

export function OBtn({
  children,
  onClick,
  full = false,
  variant = "primary",
  size = "md",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}) {
  const base = "font-semibold rounded-2xl transition-all active:scale-95 disabled:opacity-50";
  const sz = size === "sm" ? "py-2.5 px-4 text-sm" : size === "lg" ? "py-5 px-6 text-base" : "py-4 px-5 text-sm";
  const v =
    variant === "primary"
      ? "bg-orange-500 text-white shadow-orange"
      : variant === "outline"
      ? "border-2 border-orange-500 text-orange-500 bg-white"
      : variant === "danger"
      ? "bg-red-50 text-red-500 border border-red-200"
      : "text-gray-600 bg-gray-100";
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${sz} ${v} ${full ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

export function Card({
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
      className={`bg-white rounded-2xl shadow-card p-4 ${onClick ? "cursor-pointer active:opacity-80 transition-opacity" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-2">
        <Icon name={icon} size={28} className="text-orange-400" />
      </div>
      <p className="text-lg font-bold text-gray-700">{title}</p>
      {sub && <p className="text-sm text-gray-400 leading-relaxed">{sub}</p>}
      {action}
    </div>
  );
}

export function Badge({
  children,
  color = "orange",
}: {
  children: React.ReactNode;
  color?: "orange" | "green" | "red" | "gray" | "blue";
}) {
  const c =
    color === "green"
      ? "bg-green-100 text-green-700"
      : color === "red"
      ? "bg-red-100 text-red-600"
      : color === "gray"
      ? "bg-gray-100 text-gray-500"
      : color === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-orange-100 text-orange-600";
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${c}`}>{children}</span>;
}

export function BottomNav({
  active,
  onNavigate,
  role,
}: {
  active: string;
  onNavigate: (s: string) => void;
  role: string;
}) {
  const managerTabs = [
    { key: "dashboard", icon: "LayoutDashboard", label: "Главная" },
    { key: "requests", icon: "MessageSquare", label: "Запросы" },
    { key: "orders", icon: "ClipboardList", label: "Заявки" },
    { key: "balance", icon: "Wallet", label: "Баланс" },
    { key: "settings", icon: "Settings", label: "Профиль" },
  ];
  const adminTabs = [
    { key: "admin-analytics", icon: "BarChart2", label: "Аналитика" },
    { key: "admin-managers", icon: "Users", label: "Менеджеры" },
    { key: "admin-orders", icon: "FileText", label: "Заявки" },
    { key: "admin-cities", icon: "MapPin", label: "Города" },
    { key: "admin-settings", icon: "Settings", label: "Настройки" },
  ];
  const tabs = role === "admin" ? adminTabs : managerTabs;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-md mx-auto flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              active === t.key || active.startsWith(t.key)
                ? "text-orange-500"
                : "text-gray-400"
            }`}
          >
            <Icon name={t.icon} size={22} />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}