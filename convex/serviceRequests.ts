import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("serviceRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("serviceRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
    return all.filter(
      (r) => r.status !== "resolved" && r.status !== "cancelled",
    );
  },
});

export const getById = query({
  args: { id: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    issueSummary: v.string(),
    notes: v.optional(v.string()),
    urgency: v.union(
      v.literal("emergency"),
      v.literal("urgent"),
      v.literal("routine"),
    ),
    urgencyScore: v.number(),
    likelyJobType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("serviceRequests", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("serviceRequests"),
    status: v.union(
      v.literal("new"),
      v.literal("triaged"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
