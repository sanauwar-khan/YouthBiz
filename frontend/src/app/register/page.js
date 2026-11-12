import AuthPage from "../_components/AuthPage";

export const metadata = {
  title: "Join YouthBiz | Student registration",
  description: "Create a YouthBiz student account and start building your business idea.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}