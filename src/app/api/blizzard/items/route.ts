import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchItems } from "@/lib/blizzard";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const items = await searchItems(query);
  return NextResponse.json(items);
}
