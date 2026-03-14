import { mutation } from "./_generated/server";

export const reset = mutation({
  handler: async (ctx) => {
    // Clear all tables
    const tables = [
      "customers",
      "technicians",
      "serviceRequests",
      "jobs",
      "agentDecisions",
      "outgoingMessages",
      "simulationEvents",
    ] as const;

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    // Seed customers
    const martha = await ctx.db.insert("customers", {
      name: "Martha Henderson",
      phone: "(555) 234-5678",
      address: "742 Elm Street, Springfield",
      vipStatus: true,
      maintenanceMember: true,
      notes: "Elderly customer, lives alone. Priority service.",
      equipmentSummary: "Carrier 24ACC636 (2019), 3-ton split system",
    });

    const johnson = await ctx.db.insert("customers", {
      name: "David Johnson",
      phone: "(555) 345-6789",
      address: "189 Oak Avenue, Springfield",
      vipStatus: false,
      maintenanceMember: false,
      notes: "Infant at home (3 months old)",
      equipmentSummary: "Trane XR15 (2021), 2.5-ton heat pump",
    });

    const chen = await ctx.db.insert("customers", {
      name: "Lisa Chen",
      phone: "(555) 456-7890",
      address: "55 Maple Drive, Riverside",
      vipStatus: false,
      maintenanceMember: true,
      equipmentSummary: "Lennox XC21 (2020), 4-ton dual-fuel",
    });

    const ramirez = await ctx.db.insert("customers", {
      name: "Carlos Ramirez",
      phone: "(555) 567-8901",
      address: "321 Pine Road, Oakwood",
      vipStatus: false,
      maintenanceMember: false,
      equipmentSummary: "Rheem RA1636AJ (2018), 3-ton AC",
    });

    const patel = await ctx.db.insert("customers", {
      name: "Priya Patel",
      phone: "(555) 678-9012",
      address: "410 Birch Lane, Springfield",
      vipStatus: true,
      maintenanceMember: true,
      notes: "Commercial property owner, multiple units",
      equipmentSummary: "2x Daikin DX20VC (2022), 5-ton commercial",
    });

    const thompson = await ctx.db.insert("customers", {
      name: "Robert Thompson",
      phone: "(555) 789-0123",
      address: "88 Cedar Court, Riverside",
      vipStatus: false,
      maintenanceMember: false,
      equipmentSummary: "Goodman GSX16 (2017), 2-ton AC",
    });

    // Seed technicians
    const mike = await ctx.db.insert("technicians", {
      name: "Mike Torres",
      skills: [
        "diagnostics",
        "emergency repair",
        "compressor replacement",
        "refrigerant systems",
        "electrical",
      ],
      status: "on_job",
      territory: "Springfield",
      reliabilityScore: 98,
      phone: "(555) 100-0001",
    });

    const sarah = await ctx.db.insert("technicians", {
      name: "Sarah Kim",
      skills: [
        "residential maintenance",
        "tune-ups",
        "thermostat installation",
        "duct inspection",
        "filter systems",
      ],
      status: "en_route",
      territory: "Springfield / Riverside",
      reliabilityScore: 95,
      phone: "(555) 100-0002",
    });

    const luis = await ctx.db.insert("technicians", {
      name: "Luis Fernandez",
      skills: [
        "installations",
        "general service",
        "ductwork",
        "airflow balancing",
        "commercial systems",
      ],
      status: "available",
      territory: "Oakwood / Riverside",
      reliabilityScore: 92,
      phone: "(555) 100-0003",
    });

    const now = Date.now();
    const hour = 60 * 60 * 1000;

    // Seed jobs — active schedule for today
    // Mike: currently on an urgent compressor diagnostic
    const mikeJob = await ctx.db.insert("jobs", {
      technicianId: mike,
      customerId: ramirez,
      customerName: "Carlos Ramirez",
      priority: "urgent",
      category: "Compressor Diagnostic",
      scheduledStart: now - 1.5 * hour,
      scheduledEnd: now + 0.5 * hour,
      eta: now - 1.5 * hour,
      status: "in_progress",
      notes: "Suspected compressor failure, unusual noise and poor cooling",
    });

    // Mike: has a routine tune-up scheduled next
    await ctx.db.insert("jobs", {
      technicianId: mike,
      customerId: chen,
      customerName: "Lisa Chen",
      priority: "routine",
      category: "Seasonal Tune-Up",
      scheduledStart: now + 1 * hour,
      scheduledEnd: now + 2 * hour,
      status: "scheduled",
      notes: "Semi-annual maintenance check, dual-fuel system",
    });

    // Sarah: en route to a thermostat issue
    const sarahJob = await ctx.db.insert("jobs", {
      technicianId: sarah,
      customerId: thompson,
      customerName: "Robert Thompson",
      priority: "urgent",
      category: "Thermostat Malfunction",
      scheduledStart: now - 0.25 * hour,
      scheduledEnd: now + 1 * hour,
      eta: now + 0.25 * hour,
      status: "en_route",
      notes: "Thermostat showing incorrect temp, AC won't cycle properly",
    });

    // Sarah: has a routine maintenance scheduled after
    await ctx.db.insert("jobs", {
      technicianId: sarah,
      customerId: martha,
      customerName: "Martha Henderson",
      priority: "routine",
      category: "Preventive Maintenance",
      scheduledStart: now + 2 * hour,
      scheduledEnd: now + 3 * hour,
      status: "scheduled",
      notes: "VIP maintenance member — annual system check",
    });

    // Luis: completed a job earlier today
    await ctx.db.insert("jobs", {
      technicianId: luis,
      customerId: patel,
      customerName: "Priya Patel",
      priority: "routine",
      category: "Airflow Balancing",
      scheduledStart: now - 4 * hour,
      scheduledEnd: now - 2.5 * hour,
      status: "completed",
      notes: "Balanced airflow across 3 zones in commercial unit",
    });

    // Luis: has a scheduled job coming up
    await ctx.db.insert("jobs", {
      technicianId: luis,
      customerId: johnson,
      customerName: "David Johnson",
      priority: "urgent",
      category: "Weak Airflow Investigation",
      scheduledStart: now + 1.5 * hour,
      scheduledEnd: now + 3 * hour,
      status: "scheduled",
      notes: "Low airflow in nursery, infant at home — expedite if possible",
    });

    // Set current job references
    await ctx.db.patch(mike, { currentJobId: mikeJob });
    await ctx.db.patch(sarah, { currentJobId: sarahJob });
  },
});

export const seedIfEmpty = mutation({
  handler: async (ctx) => {
    const techs = await ctx.db.query("technicians").take(1);
    if (techs.length > 0) return false;

    // Forward to reset which handles full seeding
    // This is a convenience for initial setup; just return a flag
    return true;
  },
});
