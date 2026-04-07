import { redirect } from "next/navigation";

export default async function TeamMemberRedirect(
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params;
  redirect(`/crew/${role}`);
}
