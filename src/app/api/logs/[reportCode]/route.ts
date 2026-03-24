import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportCode } = await params;

  const log = await prisma.raidLog.findUnique({
    where: { reportCode },
    include: {
      performances: {
        include: {
          character: {
            select: { id: true, name: true, className: true, specName: true, raidRole: true },
          },
        },
        orderBy: [{ encounterName: "asc" }, { dps: "desc" }],
      },
    },
  });

  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  return NextResponse.json(log);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportCode } = await params;
  await prisma.raidLog.delete({ where: { reportCode } });

  return NextResponse.json({ ok: true });
}
