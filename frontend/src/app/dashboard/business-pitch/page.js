import DashboardClient from "../DashboardClient";

export const metadata = {
  title: "Business Pitch & Pop-up | YouthBiz",
  description: "Manage your business pitch & pop-up in your YouthBiz student workspace.",
};

export default function DashboardFeaturePage() {
  return <DashboardClient activePage="business-pitch" />;
}
