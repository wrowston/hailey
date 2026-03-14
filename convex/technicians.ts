import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("technicians").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    skills: v.array(v.string()),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("delayed"),
      v.literal("offline"),
    ),
    territory: v.string(),
    reliabilityScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("technicians", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("technicians"),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("delayed"),
      v.literal("offline"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const assignCurrentJob = mutation({
  args: {
    id: v.id("technicians"),
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      currentJobId: args.jobId,
      status: "busy",
    });
  },
});

export const clearCurrentJob = mutation({
  args: { id: v.id("technicians") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      currentJobId: undefined,
      status: "available",
    });
  },
});
