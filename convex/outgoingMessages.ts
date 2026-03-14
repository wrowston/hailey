import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  handler: async (ctx) => {
    return await ctx.db.query("outgoingMessages").order("desc").take(30);
  },
});

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    relatedJobId: v.optional(v.id("jobs")),
    messageType: v.union(
      v.literal("eta_confirmation"),
      v.literal("delay_notice"),
      v.literal("reschedule_apology"),
      v.literal("technician_dispatched"),
      v.literal("followup_summary"),
      v.literal("cancellation")
    ),
    content: v.string(),
    channel: v.union(v.literal("sms"), v.literal("email")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("outgoingMessages", args);
  },
});
