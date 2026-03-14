import { NextRequest, NextResponse } from "next/server";
import convexClient from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeStartParam = searchParams.get("rangeStart");
    const rangeEndParam = searchParams.get("rangeEnd");

    if (rangeStartParam && rangeEndParam) {
      const services = await convexClient.query(
        api.scheduledServices.listInRange,
        {
          rangeStart: Number(rangeStartParam),
          rangeEnd: Number(rangeEndParam),
        },
      );
      return NextResponse.json({ services });
    }

    const services = await convexClient.query(
      api.scheduledServices.listUpcoming,
      {},
    );
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Scheduled services API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled services" },
      { status: 500 },
    );
  }
}
