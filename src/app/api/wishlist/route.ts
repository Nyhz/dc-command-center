import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    include: {
      character: {
        select: { id: true, name: true, className: true, raidRole: true, userId: true },
      },
    },
    orderBy: [{ sourceRaid: "asc" }, { sourceBoss: "asc" }, { priority: "asc" }],
  });

  return NextResponse.json(items);
}
