import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    vipStatus: v.boolean(),
    maintenanceMember: v.boolean(),
    notes: v.optional(v.string()),
    equipmentSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
