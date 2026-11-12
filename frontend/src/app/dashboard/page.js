import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Student Dashboard | YouthBiz",
  description: "Your YouthBiz student workspace.",
};

const dashboardItems = [
  {
    number: "01",
    icon: "✳",
    className: "idea-icon",
    title: "Business ideas",
    description: "Shape your idea and plan what to make next.",
  },
  {
    number: "02",
    icon: "◒",
    className: "make-icon",
    title: "Money basics",
    description: "Learn to track costs, sales, and profit.",
  },
  {
    number: "03",
    icon: "↗",
    className: "grow-icon",
    title: "Your next steps",
    description: "Build confidence by putting your plans into action.",
  },
];

export default function DashboardPage() {
  return <DashboardClient />;
}