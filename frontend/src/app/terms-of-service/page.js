import LegalNotice from "../_components/LegalNotice";

export const metadata = {
  title: "Terms of Service | YouthBiz",
  description: "Terms information for YouthBiz students and families.",
};

export default function TermsOfServicePage() {
  return (
    <LegalNotice
      title="Terms of Service"
      description="YouthBiz helps students explore entrepreneurship through practical, age-appropriate activities."
    />
  );
}