import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    vipStatus: v.boolean(),
    notes: v.optional(v.string()),
    equipmentSummary: v.optional(v.string()),
    maintenanceMember: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", args);
  },
});
