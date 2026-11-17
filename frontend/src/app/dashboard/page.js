import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "My Products | YouthBiz",
  description: "Create and manage products in your YouthBiz student workspace.",
};

export default function DashboardPage() {
  return <DashboardClient activePage="products" />;
}
