import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyBillboardPost } from "@/db/schema";
import { getSession } from "@/lib/auth-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const postId = params.id;

  const [deleted] = await db
    .delete(familyBillboardPost)
    .where(eq(familyBillboardPost.id, postId))
    .returning({ id: familyBillboardPost.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Post not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
