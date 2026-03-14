import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("simulationEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("new_emergency"),
      v.literal("traffic_delay"),
      v.literal("part_unavailable"),
      v.literal("customer_cancellation"),
      v.literal("vip_emergency"),
      v.literal("routine_request"),
      v.literal("overtime_risk"),
    ),
    payload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simulationEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
