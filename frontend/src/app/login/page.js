import { Suspense } from "react";
import AuthPage from "../_components/AuthPage";

export const metadata = {
  title: "Log in | YouthBiz",
  description: "Log in to your YouthBiz student account.",
};

async function LoginPageContent({ searchParams }) {
  const params = await searchParams;
  return <AuthPage mode="login" registrationSuccess={params.registered === "1"} />;
}

export default function LoginPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}