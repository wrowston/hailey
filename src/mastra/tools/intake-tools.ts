import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import convexClient from "../../lib/convex";
import { api } from "../../../convex/_generated/api";

const BUSINESS_HQ = {
  lat: 40.3916,
  lng: -111.8508,
  address: "1650 Digital Dr, Lehi, UT 84043",
};

const SERVICE_RADIUS_MILES = 50;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const lookupCustomerTool = createTool({
  id: "lookup-customer",
  description:
    "Look up an existing customer by their phone number. Use this early in the conversation to check if the caller is a returning customer.",
  inputSchema: z.object({
    phone: z.string().describe("The customer's phone number"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    customer: z
      .object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        address: z.string(),
        vipStatus: z.boolean(),
        maintenanceMember: z.boolean(),
        notes: z.string().optional(),
        equipmentSummary: z.string().optional(),
      })
      .nullable(),
  }),
  execute: async ({ phone }) => {
    const customer = await convexClient.query(api.customers.getByPhone, {
      phone,
    });
    if (!customer) {
      return { found: false, customer: null };
    }
    return {
      found: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? undefined,
        address: customer.address,
        vipStatus: customer.vipStatus,
        maintenanceMember: customer.maintenanceMember,
        notes: customer.notes ?? undefined,
        equipmentSummary: customer.equipmentSummary ?? undefined,
      },
    };
  },
});

export const checkServiceAreaTool = createTool({
  id: "check-service-area",
  description:
    "Check if a customer's address is within the 50-mile service area. Call this once the customer provides their address.",
  inputSchema: z.object({
    address: z.string().describe("The customer's full street address"),
  }),
  outputSchema: z.object({
    withinServiceArea: z.boolean(),
    distanceMiles: z.number(),
    formattedAddress: z.string(),
  }),
  execute: async ({ address }) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MrWrenchIntakeAgent/1.0" },
    });
    const results = await res.json();

    if (!results || results.length === 0) {
      return {
        withinServiceArea: false,
        distanceMiles: -1,
        formattedAddress: address,
      };
    }

    const { lat, lon, display_name } = results[0];
    const distance = haversineDistance(
      BUSINESS_HQ.lat,
      BUSINESS_HQ.lng,
      parseFloat(lat),
      parseFloat(lon),
    );

    return {
      withinServiceArea: distance <= SERVICE_RADIUS_MILES,
      distanceMiles: Math.round(distance * 10) / 10,
      formattedAddress: display_name || address,
    };
  },
});

export const saveIntakeTool = createTool({
  id: "save-intake",
  description:
    "Save the intake data to the system. Creates or updates the customer record and creates a new service request. Only call this after all information has been collected and the address is confirmed within the service area.",
  inputSchema: z.object({
    existingCustomerId: z
      .string()
      .optional()
      .describe(
        "If the customer already exists, pass their ID to update instead of creating a new record",
      ),
    name: z.string().describe("Customer's full name"),
    phone: z.string().describe("Customer's phone number"),
    email: z.string().optional().describe("Customer's email address"),
    address: z.string().describe("Customer's street address"),
    issueSummary: z
      .string()
      .describe("Clear 2-3 sentence description of the customer's issue"),
    notes: z
      .string()
      .optional()
      .describe("Any additional notes about the call or issue"),
    urgency: z
      .enum(["emergency", "urgent", "routine"])
      .describe("Urgency classification"),
    urgencyScore: z
      .number()
      .min(1)
      .max(10)
      .describe("Urgency score from 1 (lowest) to 10 (highest)"),
    likelyJobType: z
      .string()
      .describe(
        "Likely job category, e.g. plumbing, HVAC, drain, water heater, etc.",
      ),
  }),
  outputSchema: z.object({
    customerId: z.string(),
    serviceRequestId: z.string(),
    isReturningCustomer: z.boolean(),
  }),
  execute: async (input) => {
    let customerId: string;
    let isReturningCustomer = false;

    if (input.existingCustomerId) {
      await convexClient.mutation(api.customers.update, {
        id: input.existingCustomerId as never,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
      });
      customerId = input.existingCustomerId;
      isReturningCustomer = true;
    } else {
      customerId = await convexClient.mutation(api.customers.create, {
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        vipStatus: false,
        maintenanceMember: false,
        notes: input.notes,
      });
    }

    const serviceRequestId = await convexClient.mutation(
      api.serviceRequests.create,
      {
        customerId: customerId as never,
        issueSummary: input.issueSummary,
        notes: input.notes,
        urgency: input.urgency,
        urgencyScore: input.urgencyScore,
        likelyJobType: input.likelyJobType,
      },
    );

    return {
      customerId,
      serviceRequestId,
      isReturningCustomer,
    };
  },
});
