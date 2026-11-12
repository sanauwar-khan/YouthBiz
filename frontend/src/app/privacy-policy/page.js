import LegalNotice from "../_components/LegalNotice";

export const metadata = {
  title: "Privacy Policy | YouthBiz",
  description: "YouthBiz privacy information for students and families.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalNotice
      title="Privacy Policy"
      description="We believe young people and their families should know how information is handled."
    />
  );
}