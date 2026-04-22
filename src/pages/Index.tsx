import { useState, useEffect } from "react";
import { getSession } from "@/lib/api";
import { AuthScreen } from "@/components/crm/AuthScreens";
import { BottomNav } from "@/components/crm/shared";
import { ManagerDashboard } from "@/components/crm/ManagerDashboard";
import {
  RequestsHub, RequestsCitiesList, CityRequestsScreen,
  NewRequestForm, ActiveRequestsScreen,
} from "@/components/crm/RequestsScreen";
import {
  OrdersHub, NewOrderForm, MyOrdersScreen, EditOrderScreen,
} from "@/components/crm/OrdersScreen";
import { CitiesScreen, PublishCitiesScreen } from "@/components/crm/CitiesScreen";
import { BalanceScreen, TransferRequestScreen } from "@/components/crm/BalanceScreen";
import { EarningsScreen } from "@/components/crm/EarningsScreen";
import { NotificationsScreen } from "@/components/crm/NotificationsScreen";
import { SettingsScreen } from "@/components/crm/SettingsScreen";
import {
  AdminAnalytics, AdminManagers, AdminManagerDetail,
  AdminCreateTransfer, AdminAllOrders,
} from "@/components/crm/AdminScreens";

type Screen = string;

export default function Index() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [history, setHistory] = useState<Screen[]>([]);
  const [extra, setExtra] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setScreen(session.role === "admin" ? "admin-analytics" : "dashboard");
    }
  }, []);

  const navigate = (to: Screen, ex?: Record<string, unknown>) => {
    setHistory((h) => [...h, screen]);
    setExtra(ex || {});
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

  const onAuth = (u: Record<string, unknown>) => {
    setUser(u);
    setScreen(u.role === "admin" ? "admin-analytics" : "dashboard");
  };

  const onLogout = () => {
    setUser(null);
    setScreen("dashboard");
    setHistory([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto">
          <AuthScreen onAuth={onAuth} />
        </div>
      </div>
    );
  }

  const noNavScreens = [
    "new-request", "new-order", "publish-cities",
    "edit-order", "transfer-request", "city-requests",
    "requests-cities", "requests-active",
    "admin-manager-detail", "admin-create-transfer",
    "admin-orders",
  ];
  const showNav = !noNavScreens.includes(screen);

  const role = user.role as string;

  const navActive = (s: Screen) => {
    if (s.startsWith("admin-analytics")) return "admin-analytics";
    if (s.startsWith("admin-manager")) return "admin-managers";
    if (s.startsWith("admin-orders") || s.startsWith("admin-create-transfer")) return "admin-orders";
    if (s === "dashboard") return "dashboard";
    if (["requests", "requests-cities", "requests-active", "city-requests", "new-request"].includes(s)) return "requests";
    if (["orders", "new-order", "my-orders", "done-orders", "edit-order"].includes(s)) return "orders";
    if (["balance", "transfer-request"].includes(s)) return "balance";
    return s;
  };

  const renderScreen = () => {
    if (screen === "dashboard")
      return <ManagerDashboard user={user} onNavigate={navigate} />;

    if (screen === "requests")
      return <RequestsHub user={user} onNavigate={navigate} />;

    if (screen === "requests-cities")
      return <RequestsCitiesList user={user} onNavigate={navigate} onBack={goBack} />;

    if (screen === "city-requests")
      return <CityRequestsScreen user={user} city={extra.city as string || ""} onNavigate={navigate} onBack={goBack} />;

    if (screen === "new-request")
      return <NewRequestForm user={user} defaultCity={extra.city as string} onBack={goBack} onDone={goBack} />;

    if (screen === "requests-active")
      return <ActiveRequestsScreen user={user} onNavigate={navigate} onBack={goBack} />;

    if (screen === "orders")
      return <OrdersHub user={user} onNavigate={navigate} />;

    if (screen === "new-order")
      return <NewOrderForm user={user} onBack={goBack} onDone={() => navigate("orders")} />;

    if (screen === "my-orders")
      return <MyOrdersScreen user={user} onNavigate={navigate} onBack={goBack} />;

    if (screen === "done-orders")
      return <MyOrdersScreen user={user} onlyDone onNavigate={navigate} onBack={goBack} />;

    if (screen === "edit-order")
      return <EditOrderScreen user={user} onBack={goBack} onDone={() => navigate("orders")} />;

    if (screen === "cities")
      return <CitiesScreen user={user} onNavigate={navigate} />;

    if (screen === "publish-cities")
      return <PublishCitiesScreen user={user} onBack={goBack} onDone={() => navigate("cities")} />;

    if (screen === "balance")
      return <BalanceScreen user={user} onNavigate={navigate} />;

    if (screen === "transfer-request")
      return <TransferRequestScreen user={user} onBack={goBack} onDone={() => navigate("balance")} />;

    if (screen === "earnings")
      return <EarningsScreen user={user} onBack={goBack} />;

    if (screen === "notifications")
      return <NotificationsScreen user={user} onBack={goBack} />;

    if (screen === "settings")
      return <SettingsScreen user={user} onLogout={onLogout} />;

    if (screen === "admin-analytics")
      return <AdminAnalytics user={user} />;

    if (screen === "admin-managers")
      return <AdminManagers user={user} onNavigate={navigate} />;

    if (screen === "admin-manager-detail")
      return (
        <AdminManagerDetail
          adminUser={user}
          manager={extra.manager as Record<string, unknown>}
          onBack={goBack}
          onNavigate={navigate}
        />
      );

    if (screen === "admin-create-transfer")
      return (
        <AdminCreateTransfer
          adminUser={user}
          manager={extra.manager as Record<string, unknown>}
          onBack={goBack}
          onDone={() => navigate("admin-managers")}
        />
      );

    if (screen === "admin-orders")
      return <AdminAllOrders user={user} onBack={goBack} />;

    return <div className="p-8 text-gray-400 text-center">Экран: {screen}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-golos">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {renderScreen()}
        {showNav && (
          <BottomNav
            active={navActive(screen)}
            onNavigate={navigate}
            role={role}
          />
        )}
      </div>
    </div>
  );
}
