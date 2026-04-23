import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getUserRole, listAdminUserAccessItems } from "@/lib/user-access";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listAdminUserAccessItems();

  return NextResponse.json({ users });
}
