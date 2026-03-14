import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("simulationEvents").order("desc").take(20);
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    payload: v.any(),
    processed: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("simulationEvents", args);
  },
});

export const markProcessed = mutation({
  args: { id: v.id("simulationEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true });
  },
});
