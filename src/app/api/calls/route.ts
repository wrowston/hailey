import { NextRequest, NextResponse } from "next/server";
import {
  lookupCustomerTool,
  saveIntakeTool,
} from "@/mastra/tools/intake-tools";
import convexClient from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

export async function GET() {
  try {
    const serviceRequests = await convexClient.query(
      api.serviceRequests.list,
      {},
    );

    const calls = await Promise.all(
      serviceRequests.map(async (sr) => {
        const customer = await convexClient.query(api.customers.getById, {
          id: sr.customerId,
        });
        return {
          id: sr._id,
          name: customer?.name ?? null,
          phone_number: customer?.phone ?? null,
          email: customer?.email ?? null,
          address: customer?.address ?? null,
          issue: sr.issueSummary,
          urgency: sr.urgency,
          urgency_score: sr.urgencyScore,
          likely_job_type: sr.likelyJobType,
          notes: sr.notes ?? null,
          status: sr.status,
          created_at: sr.createdAt,
        };
      }),
    );

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === "create") {
      return NextResponse.json({ ok: true });
    }

    if (action === "end") {
      const phone = data.phone_number;
      let existingCustomerId: string | undefined;

      if (phone) {
        const lookupResult = await lookupCustomerTool.execute!({
          phone,
        }, {} as any);
        if (lookupResult && "found" in lookupResult && lookupResult.found && lookupResult.customer) {
          existingCustomerId = lookupResult.customer.id;
        }
      }

      const notes = [data.summary, data.urgency_reason]
        .filter(Boolean)
        .join("\n\n");

      const result = await saveIntakeTool.execute!({
        existingCustomerId,
        name: data.name,
        phone: data.phone_number,
        email: data.email,
        address: data.address,
        issueSummary: data.issue,
        notes: notes || undefined,
        urgency: data.urgency,
        urgencyScore: data.urgency_score,
        likelyJobType: data.likely_job_type,
      }, {} as any);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with call:", error);
    return NextResponse.json(
      { error: "Failed to process call" },
      { status: 500 },
    );
  }
}
