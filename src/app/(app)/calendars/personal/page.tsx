import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";

export default async function PersonalCalendarPage() {
  await requireSession("/login?next=/private-cloud/calendar");
  redirect("/private-cloud/calendar");
}
