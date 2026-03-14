import { NextRequest, NextResponse } from "next/server";
import convexClient from "@/lib/convex";
import { api } from "../../../../convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const digits = phone.replace(/\D/g, "");

    // Try exact match first, then fall back to normalized digits comparison
    let customer = await convexClient.query(api.customers.getByPhone, {
      phone,
    });

    if (!customer && digits) {
      customer = await convexClient.query(api.customers.getByPhoneNormalized, {
        digits,
      });
    }

    if (!customer) {
      return NextResponse.json({ found: false, customer: null });
    }

    return NextResponse.json({
      found: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? null,
        address: customer.address,
        vipStatus: customer.vipStatus,
        maintenanceMember: customer.maintenanceMember,
        notes: customer.notes ?? null,
        equipmentSummary: customer.equipmentSummary ?? null,
      },
    });
  } catch (error) {
    console.error("Customer lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up customer" },
      { status: 500 },
    );
  }
}
