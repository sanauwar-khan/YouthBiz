import DashboardClient from "../DashboardClient";

export const metadata = {
  title: "Inventory Management | YouthBiz",
  description: "Manage your inventory management in your YouthBiz student workspace.",
};

export default function DashboardFeaturePage() {
  return <DashboardClient activePage="inventory" />;
}
