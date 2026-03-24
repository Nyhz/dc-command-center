import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.raidLog.findMany({
    include: {
      raidEvent: { select: { id: true, title: true } },
      _count: { select: { performances: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  let { reportCode } = body;

  if (!reportCode) {
    return NextResponse.json({ error: "Missing reportCode" }, { status: 400 });
  }

  // Extract code from full URL if provided
  const match = reportCode.match(/reports\/([a-zA-Z0-9]+)/);
  if (match) {
    reportCode = match[1];
  }

  // Check if already linked
  const existing = await prisma.raidLog.findUnique({ where: { reportCode } });
  if (existing) {
    return NextResponse.json({ error: "Report already linked", log: existing }, { status: 409 });
  }

  const log = await prisma.raidLog.create({
    data: {
      reportCode,
      raidEventId: body.raidEventId ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
