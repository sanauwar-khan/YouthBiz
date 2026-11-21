import { PrdEditorClient } from "../../../../_components/AdminPrdsClient";

export const metadata = { title: "Edit PRD | YouthBiz Admin" };

export default async function EditPrdPage({ params }) {
  const { prdId } = await params;
  return <PrdEditorClient prdId={prdId} />;
}
