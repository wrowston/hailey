import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("technicians").collect();
  },
});

export const get = query({
  args: { id: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("technicians"),
    status: v.union(
      v.literal("available"),
      v.literal("en_route"),
      v.literal("on_job"),
      v.literal("off_duty")
    ),
    currentJobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      currentJobId: args.currentJobId,
    });
  },
});
