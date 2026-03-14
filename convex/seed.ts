import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Guard: skip if data already exists
    const existing = await ctx.db.query("customers").first();
    if (existing) {
      throw new Error("Seed data already exists. Clear the database first.");
    }

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const MIN = 60 * 1000;

    // ── Customers ──────────────────────────────────────────────────

    const margaret = await ctx.db.insert("customers", {
      name: "Margaret Chen",
      phone: "(512) 555-0142",
      address: "4821 Ridgeview Dr, Austin, TX 78731",
      vipStatus: true,
      maintenanceMember: true,
      notes: "Long-time VIP customer. Has two Carrier Infinity units.",
      equipmentSummary: "2x Carrier Infinity 24ANB1, installed 2021",
      createdAt: now - 90 * 24 * HOUR,
    });

    const david = await ctx.db.insert("customers", {
      name: "David Okonkwo",
      phone: "(512) 555-0287",
      address: "1130 Elm Creek Blvd, Austin, TX 78748",
      vipStatus: false,
      maintenanceMember: true,
      notes: "Annual maintenance plan member since 2023.",
      equipmentSummary: "Trane XR15, 3-ton split system",
      createdAt: now - 60 * 24 * HOUR,
    });

    const jennifer = await ctx.db.insert("customers", {
      name: "Jennifer Alvarez",
      phone: "(512) 555-0391",
      address: "782 Sunset Canyon Rd, Austin, TX 78746",
      vipStatus: false,
      maintenanceMember: false,
      equipmentSummary: "Lennox XC21, 4-ton, 8 years old",
      createdAt: now - 45 * 24 * HOUR,
    });

    const robert = await ctx.db.insert("customers", {
      name: "Robert Tanaka",
      phone: "(512) 555-0518",
      address: "2209 Pecan Springs Rd, Austin, TX 78723",
      vipStatus: false,
      maintenanceMember: false,
      notes: "Elderly resident. Prefers morning appointments.",
      equipmentSummary: "Goodman GSX14, showing age-related wear",
      createdAt: now - 30 * 24 * HOUR,
    });

    const sarah = await ctx.db.insert("customers", {
      name: "Sarah Mitchell",
      phone: "(512) 555-0674",
      address: "5567 Barton Hills Dr, Austin, TX 78704",
      vipStatus: true,
      maintenanceMember: false,
      notes: "Commercial property manager. Manages 3 buildings.",
      equipmentSummary: "Daikin VRV IV, commercial rooftop units",
      createdAt: now - 15 * 24 * HOUR,
    });

    // ── Technicians ────────────────────────────────────────────────

    const mike = await ctx.db.insert("technicians", {
      name: "Mike Reynolds",
      skills: [
        "diagnostics",
        "emergency repair",
        "compressor replacement",
        "refrigerant recharge",
        "commercial systems",
      ],
      status: "busy",
      territory: "North Austin",
      reliabilityScore: 97,
      createdAt: now - 365 * 24 * HOUR,
    });

    const techSarah = await ctx.db.insert("technicians", {
      name: "Sarah Park",
      skills: [
        "residential maintenance",
        "standard repair",
        "thermostat install",
        "duct inspection",
        "filter systems",
      ],
      status: "available",
      territory: "South Austin",
      reliabilityScore: 94,
      createdAt: now - 200 * 24 * HOUR,
    });

    const luis = await ctx.db.insert("technicians", {
      name: "Luis Gutierrez",
      skills: [
        "installation",
        "general service",
        "heat pumps",
        "mini-splits",
        "seasonal tune-ups",
      ],
      status: "delayed",
      territory: "East Austin",
      reliabilityScore: 91,
      createdAt: now - 150 * 24 * HOUR,
    });

    // ── Service Requests ───────────────────────────────────────────

    const req1 = await ctx.db.insert("serviceRequests", {
      customerId: margaret,
      issueSummary:
        "AC completely stopped — house at 92°F. No cooling from either unit.",
      notes: "VIP customer, two units affected. Possible electrical issue.",
      urgency: "emergency",
      urgencyScore: 98,
      likelyJobType: "Emergency diagnostic & repair",
      status: "in_progress",
      createdAt: now - 2 * HOUR,
    });

    const req2 = await ctx.db.insert("serviceRequests", {
      customerId: david,
      issueSummary:
        "Weak airflow from vents. System running but barely cooling.",
      notes: "Started 3 days ago, getting worse.",
      urgency: "urgent",
      urgencyScore: 72,
      likelyJobType: "Airflow diagnostic",
      status: "scheduled",
      createdAt: now - 6 * HOUR,
    });

    const req3 = await ctx.db.insert("serviceRequests", {
      customerId: jennifer,
      issueSummary:
        "Thermostat display blank. System won't turn on at all.",
      urgency: "urgent",
      urgencyScore: 65,
      likelyJobType: "Thermostat replacement",
      status: "scheduled",
      createdAt: now - 8 * HOUR,
    });

    const req4 = await ctx.db.insert("serviceRequests", {
      customerId: robert,
      issueSummary:
        "Annual seasonal tune-up. System running fine but due for maintenance.",
      notes: "Prefers morning. Last serviced 11 months ago.",
      urgency: "routine",
      urgencyScore: 20,
      likelyJobType: "Seasonal tune-up",
      status: "scheduled",
      createdAt: now - 24 * HOUR,
    });

    const req5 = await ctx.db.insert("serviceRequests", {
      customerId: sarah,
      issueSummary:
        "Compressor making loud rattling noise. Intermittent shutdown.",
      notes: "Commercial building, affects 12 tenants.",
      urgency: "emergency",
      urgencyScore: 95,
      likelyJobType: "Compressor diagnostic / replacement",
      status: "triaged",
      createdAt: now - 30 * MIN,
    });

    const req6 = await ctx.db.insert("serviceRequests", {
      customerId: david,
      issueSummary: "Follow-up: ducting inspection after airflow repair.",
      urgency: "routine",
      urgencyScore: 15,
      likelyJobType: "Duct inspection",
      status: "new",
      createdAt: now - 10 * MIN,
    });

    const req7 = await ctx.db.insert("serviceRequests", {
      customerId: jennifer,
      issueSummary:
        "No heating — furnace ignitor clicking but not lighting.",
      notes: "Temperatures dropping tonight. Family with young children.",
      urgency: "emergency",
      urgencyScore: 90,
      likelyJobType: "Furnace ignitor repair",
      status: "new",
      createdAt: now - 5 * MIN,
    });

    // ── Jobs ───────────────────────────────────────────────────────

    const job1 = await ctx.db.insert("jobs", {
      requestId: req1,
      technicianId: mike,
      priority: "emergency",
      category: "Emergency diagnostic & repair",
      scheduledStart: now - 90 * MIN,
      scheduledEnd: now + 30 * MIN,
      eta: "On site — diagnosing dual-unit failure",
      status: "in_progress",
      notes: "Mike en route, arrived 20 min ago. Checking breaker panel.",
      createdAt: now - 2 * HOUR,
    });

    // Update Mike's currentJobId
    await ctx.db.patch(mike, { currentJobId: job1 });

    const job2 = await ctx.db.insert("jobs", {
      requestId: req2,
      technicianId: techSarah,
      priority: "urgent",
      category: "Airflow diagnostic",
      scheduledStart: now + 1 * HOUR,
      scheduledEnd: now + 3 * HOUR,
      eta: "~1 hour",
      status: "assigned",
      createdAt: now - 5 * HOUR,
    });

    const job3 = await ctx.db.insert("jobs", {
      requestId: req3,
      technicianId: luis,
      priority: "urgent",
      category: "Thermostat replacement",
      scheduledStart: now - 30 * MIN,
      scheduledEnd: now + 90 * MIN,
      eta: "Delayed — stuck in traffic on I-35",
      status: "delayed",
      notes: "Luis called in: major accident on I-35, ETA pushed 45 min.",
      createdAt: now - 7 * HOUR,
    });

    // Update Luis's currentJobId
    await ctx.db.patch(luis, { currentJobId: job3 });

    const job4 = await ctx.db.insert("jobs", {
      requestId: req4,
      priority: "routine",
      category: "Seasonal tune-up",
      scheduledStart: now + 4 * HOUR,
      scheduledEnd: now + 5.5 * HOUR,
      status: "assigned",
      technicianId: techSarah,
      notes: "Bumpable if emergency comes in.",
      createdAt: now - 20 * HOUR,
    });

    const job5 = await ctx.db.insert("jobs", {
      requestId: req5,
      priority: "emergency",
      category: "Compressor diagnostic / replacement",
      scheduledStart: now + 30 * MIN,
      scheduledEnd: now + 3 * HOUR,
      status: "unassigned",
      notes: "Awaiting technician — may bump routine job4.",
      createdAt: now - 25 * MIN,
    });

    // ── Agent Decisions ────────────────────────────────────────────

    await ctx.db.insert("agentDecisions", {
      type: "triage",
      relatedRequestId: req1,
      summary: "Triaged as EMERGENCY — VIP customer, total AC failure at 92°F",
      rationale:
        "Indoor temp 92°F with no cooling, VIP + maintenance member. Score 98. Immediate dispatch required.",
      createdAt: now - 2 * HOUR + 1 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "assignment",
      relatedRequestId: req1,
      relatedJobId: job1,
      summary: "Assigned Mike Reynolds — senior diagnostics, nearest available",
      rationale:
        "Mike has compressor/diagnostics skills, 97 reliability, and covers North Austin territory matching customer location.",
      createdAt: now - 2 * HOUR + 2 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "triage",
      relatedRequestId: req5,
      summary:
        "Triaged as EMERGENCY — commercial compressor failure, 12 tenants affected",
      rationale:
        "Compressor shutting down intermittently in commercial building. VIP property manager. Score 95.",
      createdAt: now - 20 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "delay",
      relatedRequestId: req3,
      relatedJobId: job3,
      summary: "Luis delayed 45 min — I-35 traffic accident",
      rationale:
        "Luis reported major accident on I-35. Rerouting not viable. Customer notified of new ETA.",
      createdAt: now - 15 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "reassignment",
      relatedRequestId: req5,
      relatedJobId: job5,
      summary:
        "Considering bumping routine tune-up (job4) to free Sarah for emergency compressor job",
      rationale:
        "Job5 is unassigned emergency. Sarah has job2 (urgent, 1hr out) and job4 (routine, 4hr out). Routine job4 is bumpable. Evaluating timeline.",
      createdAt: now - 10 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "message",
      relatedRequestId: req1,
      relatedJobId: job1,
      summary: "Sent dispatch confirmation to Margaret Chen",
      rationale:
        "VIP customer expects immediate communication. Confirmed Mike on-site and working.",
      createdAt: now - 90 * MIN,
    });

    // ── Outgoing Messages ──────────────────────────────────────────

    await ctx.db.insert("outgoingMessages", {
      customerId: margaret,
      relatedJobId: job1,
      messageType: "dispatch_confirmation",
      content:
        "Hi Margaret, this is Hailey HVAC. Tech Mike Reynolds has been dispatched and is en route to 4821 Ridgeview Dr. He specializes in diagnostics and should arrive within 20 minutes. We'll keep you updated.",
      createdAt: now - 100 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: margaret,
      relatedJobId: job1,
      messageType: "eta_update",
      content:
        "Update: Mike has arrived and is inspecting both Carrier Infinity units. He's checking the breaker panel first. Estimated diagnosis time: 30 minutes.",
      createdAt: now - 70 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: jennifer,
      relatedJobId: job3,
      messageType: "delay_notice",
      content:
        "Hi Jennifer, we apologize for the delay. Your technician Luis is stuck in traffic due to an accident on I-35. New estimated arrival: 45 minutes from now. We appreciate your patience.",
      createdAt: now - 14 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: david,
      relatedJobId: job2,
      messageType: "dispatch_confirmation",
      content:
        "Hi David, technician Sarah Park is scheduled to arrive at 1130 Elm Creek Blvd in about 1 hour to diagnose your airflow issue. She'll call when she's on her way.",
      createdAt: now - 4 * HOUR,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: sarah,
      messageType: "eta_update",
      content:
        "Hi Sarah, we've received your emergency request for the compressor issue at 5567 Barton Hills Dr. We're working on assigning a senior technician now and will confirm shortly.",
      createdAt: now - 18 * MIN,
    });

    return {
      customers: 5,
      technicians: 3,
      serviceRequests: 7,
      jobs: 5,
      agentDecisions: 6,
      outgoingMessages: 5,
    };
  },
});
