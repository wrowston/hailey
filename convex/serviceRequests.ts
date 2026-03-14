import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  handler: async (ctx) => {
    return await ctx.db.query("serviceRequests").order("desc").take(20);
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("new"),
      v.literal("classified"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("serviceRequests")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerAddress: v.string(),
    issueSummary: v.string(),
    notes: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("serviceRequests", {
      ...args,
      status: "new",
    });
  },
});

export const classify = mutation({
  args: {
    id: v.id("serviceRequests"),
    urgency: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine")
    ),
    urgencyScore: v.number(),
    likelyJobType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      urgency: args.urgency,
      urgencyScore: args.urgencyScore,
      likelyJobType: args.likelyJobType,
      status: "classified",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("serviceRequests"),
    status: v.union(
      v.literal("new"),
      v.literal("classified"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
