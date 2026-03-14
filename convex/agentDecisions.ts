import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentDecisions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listByRequest = query({
  args: { requestId: v.id("serviceRequests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentDecisions")
      .withIndex("by_request", (q) =>
        q.eq("relatedRequestId", args.requestId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("triage"),
      v.literal("assignment"),
      v.literal("reassignment"),
      v.literal("delay"),
      v.literal("message"),
      v.literal("simulation"),
      v.literal("resolution"),
    ),
    relatedRequestId: v.optional(v.id("serviceRequests")),
    relatedJobId: v.optional(v.id("jobs")),
    summary: v.string(),
    rationale: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentDecisions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
