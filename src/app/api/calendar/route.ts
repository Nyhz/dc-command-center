import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM format

  let where = {};
  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where = { startTime: { gte: start, lt: end } };
  }

  const events = await prisma.raidEvent.findMany({
    where,
    include: {
      attendances: {
        include: {
          character: { select: { id: true, name: true, className: true, raidRole: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, raidName, difficulty, startTime, endTime } = body;

  if (!title || !raidName || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.raidEvent.create({
    data: {
      title,
      description,
      raidName,
      difficulty: difficulty ?? "Heroic",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdById: session.user.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
