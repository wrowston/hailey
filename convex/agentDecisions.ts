import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  handler: async (ctx) => {
    return await ctx.db.query("agentDecisions").order("desc").take(30);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("classification"),
      v.literal("assignment"),
      v.literal("replan"),
      v.literal("disruption"),
      v.literal("communication"),
      v.literal("escalation")
    ),
    relatedRequestId: v.optional(v.id("serviceRequests")),
    relatedJobId: v.optional(v.id("jobs")),
    summary: v.string(),
    rationale: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentDecisions", args);
  },
});
