import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outgoingMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outgoingMessages")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    relatedJobId: v.optional(v.id("jobs")),
    messageType: v.union(
      v.literal("eta_update"),
      v.literal("delay_notice"),
      v.literal("reschedule"),
      v.literal("dispatch_confirmation"),
      v.literal("follow_up"),
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("outgoingMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
