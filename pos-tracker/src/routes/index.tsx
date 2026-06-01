import { createFileRoute } from "@tanstack/react-router";
import { useRestaurant } from "@/lib/restaurant-store";
import { LoginScreen } from "@/components/restaurant/LoginScreen";
import { Dashboard } from "@/components/restaurant/Dashboard";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Table Manager — Restaurant POS" },
      {
        name: "description",
        content:
          "Mobile-friendly restaurant table and bill management app for servers.",
      },
      { property: "og:title", content: "Table Manager — Restaurant POS" },
      {
        property: "og:description",
        content:
          "Mobile-friendly restaurant table and bill management app for servers.",
      },
    ],
  }),
  component: Index,
});

function Inner() {
  const { employeeId } = useRestaurant();
  return employeeId ? <Dashboard /> : <LoginScreen />;
}

function Index() {
  return (
    <Provider store={store}>
      <Toaster richColors duration={5000} position="top-right" />
      <Inner />
    </Provider>
  );
}
