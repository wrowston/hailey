import { internalMutation } from "./_generated/server";

/**
 * One-shot seed migration. Run with:
 *   npx convex run seedMigration:run
 *
 * Clears all dispatch tables then inserts a realistic data set spanning
 * the current week (past completions + upcoming schedule).
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // ── Wipe existing dispatch data ──────────────────────────────────
    const tables = [
      "scheduledServices",
      "outgoingMessages",
      "agentDecisions",
      "jobs",
      "serviceRequests",
      "simulationEvents",
      "technicians",
      "customers",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const MIN = 60 * 1000;
    const DAY = 24 * HOUR;

    // ── Customers ────────────────────────────────────────────────────

    const margaret = await ctx.db.insert("customers", {
      name: "Margaret Chen",
      phone: "(801) 555-0142",
      email: "margaret.chen@email.com",
      address: "4821 Ridgeview Dr, Lehi, UT 84043",
      vipStatus: true,
      maintenanceMember: true,
      notes: "Long-time VIP customer. Has two Carrier Infinity units.",
      equipmentSummary: "2x Carrier Infinity 24ANB1, installed 2021",
      createdAt: now - 90 * DAY,
    });

    const david = await ctx.db.insert("customers", {
      name: "David Okonkwo",
      phone: "(801) 555-0287",
      email: "david.o@email.com",
      address: "1130 Elm Creek Blvd, Draper, UT 84020",
      vipStatus: false,
      maintenanceMember: true,
      notes: "Annual maintenance plan member since 2023.",
      equipmentSummary: "Trane XR15, 3-ton split system",
      createdAt: now - 60 * DAY,
    });

    const jennifer = await ctx.db.insert("customers", {
      name: "Jennifer Alvarez",
      phone: "(801) 555-0391",
      address: "782 Sunset Canyon Rd, Draper, UT 84020",
      vipStatus: false,
      maintenanceMember: false,
      equipmentSummary: "Lennox XC21, 4-ton, 8 years old",
      createdAt: now - 45 * DAY,
    });

    const robert = await ctx.db.insert("customers", {
      name: "Robert Tanaka",
      phone: "(801) 555-0518",
      address: "2209 Pecan Springs Rd, Salt Lake City, UT 84106",
      vipStatus: false,
      maintenanceMember: false,
      notes: "Elderly resident. Prefers morning appointments.",
      equipmentSummary: "Goodman GSX14, showing age-related wear",
      createdAt: now - 30 * DAY,
    });

    const sarah = await ctx.db.insert("customers", {
      name: "Sarah Mitchell",
      phone: "(801) 555-0674",
      email: "smitchell@mitchellproperties.com",
      address: "5567 State St, Salt Lake City, UT 84107",
      vipStatus: true,
      maintenanceMember: false,
      notes: "Commercial property manager. Manages 3 buildings.",
      equipmentSummary: "Daikin VRV IV, commercial rooftop units",
      createdAt: now - 15 * DAY,
    });

    const carlos = await ctx.db.insert("customers", {
      name: "Carlos Mendez",
      phone: "(801) 555-0823",
      email: "carlos.mendez@gmail.com",
      address: "3410 Traverse Mountain Blvd, Lehi, UT 84043",
      vipStatus: false,
      maintenanceMember: true,
      notes: "Bilingual (English/Spanish). Prefers afternoon slots.",
      equipmentSummary: "Rheem RA16, 2.5-ton, installed 2019",
      createdAt: now - 120 * DAY,
    });

    const lisa = await ctx.db.insert("customers", {
      name: "Lisa Drummond",
      phone: "(801) 555-0945",
      address: "8701 Fox Hollow Dr, Lehi, UT 84043",
      vipStatus: true,
      maintenanceMember: true,
      notes: "VIP — refers many new customers. Owns a 6,000 sqft home.",
      equipmentSummary: "2x Trane XL20i, zoned system with Nexia thermostat",
      createdAt: now - 200 * DAY,
    });

    const kwame = await ctx.db.insert("customers", {
      name: "Kwame Asante",
      phone: "(801) 555-1034",
      email: "kwame@slctech.co",
      address: "1900 S Highland Dr, Suite 200, Salt Lake City, UT 84106",
      vipStatus: false,
      maintenanceMember: false,
      notes: "Tech startup office. 24 employees, open floor plan.",
      equipmentSummary: "York YZF 7.5-ton packaged rooftop unit",
      createdAt: now - 40 * DAY,
    });

    const priya = await ctx.db.insert("customers", {
      name: "Priya Sharma",
      phone: "(801) 555-1167",
      address: "6234 Pioneer Rd, Draper, UT 84020",
      vipStatus: false,
      maintenanceMember: true,
      equipmentSummary: "Carrier Comfort 24ACC6, 3.5-ton",
      createdAt: now - 75 * DAY,
    });

    const tom = await ctx.db.insert("customers", {
      name: "Tom & Rachel Winters",
      phone: "(801) 555-1298",
      email: "winters.family@email.com",
      address: "4102 Thanksgiving Way, Lehi, UT 84043",
      vipStatus: false,
      maintenanceMember: false,
      notes: "New construction home, builder warranty may apply.",
      equipmentSummary: "Lennox SL28XCV, 5-ton, installed 2025",
      createdAt: now - 10 * DAY,
    });

    const grace = await ctx.db.insert("customers", {
      name: "Grace Nwosu",
      phone: "(801) 555-1412",
      address: "320 E 13800 S, Draper, UT 84020",
      vipStatus: false,
      maintenanceMember: false,
      notes: "Duplex — only responsible for unit A.",
      equipmentSummary: "Amana ASX16, 2-ton, 6 years old",
      createdAt: now - 55 * DAY,
    });

    const james = await ctx.db.insert("customers", {
      name: "James Whitfield",
      phone: "(801) 555-1587",
      email: "jwhitfield@whitfieldlaw.com",
      address: "1215 E 200 S, Salt Lake City, UT 84102",
      vipStatus: true,
      maintenanceMember: true,
      notes: "Law office. After-hours access requires advance notice.",
      equipmentSummary: "Mitsubishi City Multi, VRF system, 4 indoor units",
      createdAt: now - 180 * DAY,
    });

    // ── Technicians ──────────────────────────────────────────────────

    const mike = await ctx.db.insert("technicians", {
      name: "Will Rowston",
      email: "will.rowston@haileyhvac.com",
      skills: [
        "diagnostics",
        "emergency repair",
        "compressor replacement",
        "refrigerant recharge",
        "commercial systems",
      ],
      status: "busy",
      territory: "Lehi",
      reliabilityScore: 97,
      createdAt: now - 365 * DAY,
    });

    const techSarah = await ctx.db.insert("technicians", {
      name: "Chance Robertson",
      email: "chance.robertson@haileyhvac.com",
      skills: [
        "residential maintenance",
        "standard repair",
        "thermostat install",
        "duct inspection",
        "filter systems",
      ],
      status: "available",
      territory: "Draper",
      reliabilityScore: 94,
      createdAt: now - 200 * DAY,
    });

    const luis = await ctx.db.insert("technicians", {
      name: "Malik Gore",
      email: "malik.gore@haileyhvac.com",
      skills: [
        "installation",
        "general service",
        "heat pumps",
        "mini-splits",
        "seasonal tune-ups",
      ],
      status: "available",
      territory: "Salt Lake City",
      reliabilityScore: 91,
      createdAt: now - 150 * DAY,
    });

    const angela = await ctx.db.insert("technicians", {
      name: "Angela Washington",
      email: "angela.washington@haileyhvac.com",
      skills: [
        "commercial systems",
        "VRF systems",
        "building automation",
        "refrigerant recharge",
        "compressor replacement",
      ],
      status: "available",
      territory: "Salt Lake City",
      reliabilityScore: 96,
      createdAt: now - 280 * DAY,
    });

    const derek = await ctx.db.insert("technicians", {
      name: "Derek Huang",
      email: "derek.huang@haileyhvac.com",
      skills: [
        "residential maintenance",
        "ductwork",
        "insulation",
        "air quality testing",
        "UV light systems",
      ],
      status: "available",
      territory: "Lehi",
      reliabilityScore: 89,
      createdAt: now - 100 * DAY,
    });

    const nina = await ctx.db.insert("technicians", {
      name: "Nina Kowalski",
      email: "nina.kowalski@haileyhvac.com",
      skills: [
        "diagnostics",
        "electrical troubleshooting",
        "heat pumps",
        "emergency repair",
        "smart thermostat setup",
      ],
      status: "offline",
      territory: "Draper",
      reliabilityScore: 93,
      createdAt: now - 320 * DAY,
    });

    // ── Helper: day-relative timestamps ──────────────────────────────
    // d=0 is today, d=1 is tomorrow, etc.  h is the hour (0-23)
    const at = (d: number, h: number, m = 0) => {
      const base = new Date(now);
      base.setHours(0, 0, 0, 0);
      return base.getTime() + d * DAY + h * HOUR + m * MIN;
    };

    // ── Past completed service requests & jobs ───────────────────────

    const reqPast1 = await ctx.db.insert("serviceRequests", {
      customerId: carlos,
      issueSummary: "Annual maintenance tune-up. System running loud.",
      urgency: "routine",
      urgencyScore: 2,
      likelyJobType: "Seasonal tune-up",
      status: "resolved",
      createdAt: now - 3 * DAY,
    });
    const jobPast1 = await ctx.db.insert("jobs", {
      requestId: reqPast1,
      technicianId: techSarah,
      priority: "routine",
      category: "Seasonal tune-up",
      scheduledStart: at(-2, 9),
      scheduledEnd: at(-2, 10, 30),
      status: "completed",
      createdAt: now - 3 * DAY,
    });

    const reqPast2 = await ctx.db.insert("serviceRequests", {
      customerId: lisa,
      issueSummary:
        "Upstairs zone not cooling. Downstairs fine. Nexia showing zone fault.",
      urgency: "urgent",
      urgencyScore: 7,
      likelyJobType: "Zone system diagnostic",
      status: "resolved",
      createdAt: now - 2 * DAY,
    });
    const jobPast2 = await ctx.db.insert("jobs", {
      requestId: reqPast2,
      technicianId: mike,
      priority: "urgent",
      category: "Zone system diagnostic",
      scheduledStart: at(-1, 8),
      scheduledEnd: at(-1, 10),
      status: "completed",
      notes: "Found stuck zone damper actuator. Replaced on-site by Will.",
      createdAt: now - 2 * DAY,
    });

    const reqPast3 = await ctx.db.insert("serviceRequests", {
      customerId: grace,
      issueSummary: "AC leaking water inside. Puddle forming near air handler.",
      urgency: "urgent",
      urgencyScore: 7,
      likelyJobType: "Drain line / condensate repair",
      status: "resolved",
      createdAt: now - 2 * DAY,
    });
    const jobPast3 = await ctx.db.insert("jobs", {
      requestId: reqPast3,
      technicianId: luis,
      priority: "urgent",
      category: "Drain line / condensate repair",
      scheduledStart: at(-1, 13),
      scheduledEnd: at(-1, 14, 30),
      status: "completed",
      notes: "Clogged condensate drain. Flushed line and installed safety float switch.",
      createdAt: now - 2 * DAY,
    });

    // ── Today: active & in-progress ──────────────────────────────────

    const req1 = await ctx.db.insert("serviceRequests", {
      customerId: margaret,
      issueSummary:
        "AC completely stopped — house at 92°F. No cooling from either unit.",
      notes: "VIP customer, two units affected. Possible electrical issue.",
      urgency: "emergency",
      urgencyScore: 10,
      likelyJobType: "Emergency diagnostic & repair",
      status: "in_progress",
      createdAt: now - 2 * HOUR,
    });
    const job1 = await ctx.db.insert("jobs", {
      requestId: req1,
      technicianId: mike,
      priority: "emergency",
      category: "Emergency diagnostic & repair",
      scheduledStart: now - 90 * MIN,
      scheduledEnd: now + 30 * MIN,
      eta: "On site — diagnosing dual-unit failure",
      status: "in_progress",
      notes: "Will arrived 20 min ago. Checking breaker panel.",
      createdAt: now - 2 * HOUR,
    });
    await ctx.db.patch(mike, { currentJobId: job1 });

    const req2 = await ctx.db.insert("serviceRequests", {
      customerId: david,
      issueSummary:
        "Weak airflow from vents. System running but barely cooling.",
      notes: "Started 3 days ago, getting worse.",
      urgency: "urgent",
      urgencyScore: 7,
      likelyJobType: "Airflow diagnostic",
      status: "scheduled",
      createdAt: now - 6 * HOUR,
    });
    const job2 = await ctx.db.insert("jobs", {
      requestId: req2,
      technicianId: techSarah,
      priority: "urgent",
      category: "Airflow diagnostic",
      scheduledStart: at(0, 14),
      scheduledEnd: at(0, 16),
      eta: "This afternoon",
      status: "assigned",
      createdAt: now - 5 * HOUR,
    });

    const req3 = await ctx.db.insert("serviceRequests", {
      customerId: jennifer,
      issueSummary:
        "Thermostat display blank. System won't turn on at all.",
      urgency: "urgent",
      urgencyScore: 7,
      likelyJobType: "Thermostat replacement",
      status: "scheduled",
      createdAt: now - 8 * HOUR,
    });
    const job3 = await ctx.db.insert("jobs", {
      requestId: req3,
      technicianId: luis,
      priority: "urgent",
      category: "Thermostat replacement",
      scheduledStart: at(0, 11),
      scheduledEnd: at(0, 12, 30),
      eta: "~1 hour",
      status: "assigned",
      createdAt: now - 7 * HOUR,
    });

    const req4 = await ctx.db.insert("serviceRequests", {
      customerId: robert,
      issueSummary:
        "Annual seasonal tune-up. System running fine but due for maintenance.",
      notes: "Prefers morning. Last serviced 11 months ago.",
      urgency: "routine",
      urgencyScore: 2,
      likelyJobType: "Seasonal tune-up",
      status: "scheduled",
      createdAt: now - 24 * HOUR,
    });
    const job4 = await ctx.db.insert("jobs", {
      requestId: req4,
      technicianId: derek,
      priority: "routine",
      category: "Seasonal tune-up",
      scheduledStart: at(0, 9),
      scheduledEnd: at(0, 10, 30),
      status: "assigned",
      notes: "Morning slot per customer preference.",
      createdAt: now - 20 * HOUR,
    });

    const reqKwame = await ctx.db.insert("serviceRequests", {
      customerId: kwame,
      issueSummary:
        "Office AC running non-stop but not reaching set temp. Employees complaining.",
      notes: "Open floor plan, 24 people. High internal heat load from equipment.",
      urgency: "urgent",
      urgencyScore: 7,
      likelyJobType: "Commercial cooling diagnostic",
      status: "scheduled",
      createdAt: now - 4 * HOUR,
    });
    const jobKwame = await ctx.db.insert("jobs", {
      requestId: reqKwame,
      technicianId: angela,
      priority: "urgent",
      category: "Commercial cooling diagnostic",
      scheduledStart: at(0, 15),
      scheduledEnd: at(0, 17),
      eta: "This afternoon",
      status: "assigned",
      createdAt: now - 3 * HOUR,
    });

    // ── Tomorrow ─────────────────────────────────────────────────────

    const reqTom1 = await ctx.db.insert("serviceRequests", {
      customerId: tom,
      issueSummary:
        "New unit making clicking noise on startup. May be warranty issue.",
      urgency: "routine",
      urgencyScore: 3,
      likelyJobType: "Warranty inspection",
      status: "scheduled",
      createdAt: now - 12 * HOUR,
    });
    const jobTom1 = await ctx.db.insert("jobs", {
      requestId: reqTom1,
      technicianId: mike,
      priority: "routine",
      category: "Warranty inspection",
      scheduledStart: at(1, 10),
      scheduledEnd: at(1, 11, 30),
      status: "assigned",
      createdAt: now - 10 * HOUR,
    });

    const reqPriya1 = await ctx.db.insert("serviceRequests", {
      customerId: priya,
      issueSummary: "Annual maintenance. Filter replacement and coil cleaning.",
      urgency: "routine",
      urgencyScore: 1,
      likelyJobType: "Seasonal tune-up",
      status: "scheduled",
      createdAt: now - 48 * HOUR,
    });
    const jobPriya1 = await ctx.db.insert("jobs", {
      requestId: reqPriya1,
      technicianId: techSarah,
      priority: "routine",
      category: "Seasonal tune-up",
      scheduledStart: at(1, 9),
      scheduledEnd: at(1, 10, 30),
      status: "assigned",
      createdAt: now - 36 * HOUR,
    });

    const reqJames1 = await ctx.db.insert("serviceRequests", {
      customerId: james,
      issueSummary:
        "VRF system error code E-04 on indoor unit #3. Intermittent cooling loss.",
      notes: "Law office. Need after-hours key code for access.",
      urgency: "urgent",
      urgencyScore: 8,
      likelyJobType: "VRF diagnostic",
      status: "scheduled",
      createdAt: now - 8 * HOUR,
    });
    const jobJames1 = await ctx.db.insert("jobs", {
      requestId: reqJames1,
      technicianId: angela,
      priority: "urgent",
      category: "VRF diagnostic",
      scheduledStart: at(1, 13),
      scheduledEnd: at(1, 15, 30),
      status: "assigned",
      notes: "After-hours access code: 4821#. Building manager notified.",
      createdAt: now - 6 * HOUR,
    });

    const reqSarah1 = await ctx.db.insert("serviceRequests", {
      customerId: sarah,
      issueSummary:
        "Quarterly preventive maintenance on rooftop units, Building 2.",
      urgency: "routine",
      urgencyScore: 2,
      likelyJobType: "Commercial preventive maintenance",
      status: "scheduled",
      createdAt: now - 72 * HOUR,
    });
    const jobSarah1 = await ctx.db.insert("jobs", {
      requestId: reqSarah1,
      technicianId: angela,
      priority: "routine",
      category: "Commercial preventive maintenance",
      scheduledStart: at(1, 8),
      scheduledEnd: at(1, 11),
      status: "assigned",
      createdAt: now - 60 * HOUR,
    });

    // ── Day after tomorrow ───────────────────────────────────────────

    const reqLisa2 = await ctx.db.insert("serviceRequests", {
      customerId: lisa,
      issueSummary:
        "Follow-up: verify zone damper replacement. Check both zones.",
      urgency: "routine",
      urgencyScore: 3,
      likelyJobType: "Follow-up inspection",
      status: "scheduled",
      createdAt: now - 6 * HOUR,
    });
    const jobLisa2 = await ctx.db.insert("jobs", {
      requestId: reqLisa2,
      technicianId: mike,
      priority: "routine",
      category: "Follow-up inspection",
      scheduledStart: at(2, 9),
      scheduledEnd: at(2, 10),
      status: "assigned",
      createdAt: now - 5 * HOUR,
    });

    const reqCarlos2 = await ctx.db.insert("serviceRequests", {
      customerId: carlos,
      issueSummary:
        "Refrigerant levels felt low during last tune-up. Needs leak check.",
      urgency: "routine",
      urgencyScore: 4,
      likelyJobType: "Refrigerant leak check",
      status: "scheduled",
      createdAt: now - 2 * DAY,
    });
    const jobCarlos2 = await ctx.db.insert("jobs", {
      requestId: reqCarlos2,
      technicianId: luis,
      priority: "routine",
      category: "Refrigerant leak check",
      scheduledStart: at(2, 10),
      scheduledEnd: at(2, 12),
      status: "assigned",
      createdAt: now - 36 * HOUR,
    });

    const reqGrace2 = await ctx.db.insert("serviceRequests", {
      customerId: grace,
      issueSummary: "Install UV light system in air handler for air quality.",
      urgency: "routine",
      urgencyScore: 1,
      likelyJobType: "UV light installation",
      status: "scheduled",
      createdAt: now - 5 * DAY,
    });
    const jobGrace2 = await ctx.db.insert("jobs", {
      requestId: reqGrace2,
      technicianId: derek,
      priority: "routine",
      category: "UV light installation",
      scheduledStart: at(2, 14),
      scheduledEnd: at(2, 15, 30),
      status: "assigned",
      createdAt: now - 4 * DAY,
    });

    // ── Day +3 ───────────────────────────────────────────────────────

    const reqDavid3 = await ctx.db.insert("serviceRequests", {
      customerId: david,
      issueSummary: "Follow-up: ducting inspection after airflow repair.",
      urgency: "routine",
      urgencyScore: 2,
      likelyJobType: "Duct inspection",
      status: "scheduled",
      createdAt: now - 4 * HOUR,
    });
    const jobDavid3 = await ctx.db.insert("jobs", {
      requestId: reqDavid3,
      technicianId: derek,
      priority: "routine",
      category: "Duct inspection",
      scheduledStart: at(3, 9),
      scheduledEnd: at(3, 11),
      status: "assigned",
      createdAt: now - 3 * HOUR,
    });

    const reqJen3 = await ctx.db.insert("serviceRequests", {
      customerId: jennifer,
      issueSummary:
        "Whole-home dehumidifier consultation and quote.",
      urgency: "routine",
      urgencyScore: 1,
      likelyJobType: "Consultation / quote",
      status: "scheduled",
      createdAt: now - 3 * DAY,
    });
    const jobJen3 = await ctx.db.insert("jobs", {
      requestId: reqJen3,
      technicianId: techSarah,
      priority: "routine",
      category: "Consultation / quote",
      scheduledStart: at(3, 13),
      scheduledEnd: at(3, 14),
      status: "assigned",
      createdAt: now - 2 * DAY,
    });

    const reqKwame3 = await ctx.db.insert("serviceRequests", {
      customerId: kwame,
      issueSummary:
        "Install smart thermostat and occupancy sensors for energy savings.",
      notes: "Startup wants to reduce energy bills. Open to Ecobee or Nest.",
      urgency: "routine",
      urgencyScore: 2,
      likelyJobType: "Smart thermostat installation",
      status: "scheduled",
      createdAt: now - 5 * DAY,
    });
    const jobKwame3 = await ctx.db.insert("jobs", {
      requestId: reqKwame3,
      technicianId: nina,
      priority: "routine",
      category: "Smart thermostat installation",
      scheduledStart: at(3, 10),
      scheduledEnd: at(3, 12, 30),
      status: "assigned",
      notes: "Nina back from PTO this day.",
      createdAt: now - 4 * DAY,
    });

    // ── Day +4 ───────────────────────────────────────────────────────

    const reqRobert4 = await ctx.db.insert("serviceRequests", {
      customerId: robert,
      issueSummary:
        "Compressor making grinding noise. May need replacement soon.",
      urgency: "urgent",
      urgencyScore: 6,
      likelyJobType: "Compressor diagnostic",
      status: "scheduled",
      createdAt: now - 12 * HOUR,
    });
    const jobRobert4 = await ctx.db.insert("jobs", {
      requestId: reqRobert4,
      technicianId: mike,
      priority: "urgent",
      category: "Compressor diagnostic",
      scheduledStart: at(4, 8),
      scheduledEnd: at(4, 10, 30),
      status: "assigned",
      notes: "Morning per customer preference. Unit is 10+ years old.",
      createdAt: now - 10 * HOUR,
    });

    const reqJames4 = await ctx.db.insert("serviceRequests", {
      customerId: james,
      issueSummary:
        "Semi-annual preventive maintenance on Mitsubishi VRF system.",
      urgency: "routine",
      urgencyScore: 1,
      likelyJobType: "VRF preventive maintenance",
      status: "scheduled",
      createdAt: now - 7 * DAY,
    });
    const jobJames4 = await ctx.db.insert("jobs", {
      requestId: reqJames4,
      technicianId: angela,
      priority: "routine",
      category: "VRF preventive maintenance",
      scheduledStart: at(4, 13),
      scheduledEnd: at(4, 16),
      status: "assigned",
      notes: "After-hours access code: 4821#",
      createdAt: now - 6 * DAY,
    });

    // ── Unassigned / new requests (for the agent to triage) ──────────

    const reqNew1 = await ctx.db.insert("serviceRequests", {
      customerId: sarah,
      issueSummary:
        "Compressor making loud rattling noise. Intermittent shutdown on Building 1.",
      notes: "Commercial building, affects 12 tenants.",
      urgency: "emergency",
      urgencyScore: 10,
      likelyJobType: "Compressor diagnostic / replacement",
      status: "triaged",
      createdAt: now - 30 * MIN,
    });
    const jobNew1 = await ctx.db.insert("jobs", {
      requestId: reqNew1,
      priority: "emergency",
      category: "Compressor diagnostic / replacement",
      scheduledStart: now + 30 * MIN,
      scheduledEnd: now + 3 * HOUR,
      status: "unassigned",
      notes: "Awaiting technician assignment.",
      createdAt: now - 25 * MIN,
    });

    const reqNew2 = await ctx.db.insert("serviceRequests", {
      customerId: jennifer,
      issueSummary:
        "No heating — furnace ignitor clicking but not lighting.",
      notes: "Temperatures dropping tonight. Family with young children.",
      urgency: "emergency",
      urgencyScore: 9,
      likelyJobType: "Furnace ignitor repair",
      status: "new",
      createdAt: now - 5 * MIN,
    });

    // ── Scheduled Services (calendar view) ───────────────────────────
    // Represents the denormalized view used by the calendar UI

    const scheduledEntries: Array<{
      jobId: typeof job1;
      serviceRequestId: typeof req1;
      customerId: typeof margaret;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      technicianId: typeof mike;
      technicianName: string;
      category: string;
      priority: "emergency" | "urgent" | "routine";
      issueSummary: string;
      scheduledStart: number;
      scheduledEnd: number;
      status: "scheduled" | "completed" | "cancelled";
    }> = [
      // Past — completed
      {
        jobId: jobPast1,
        serviceRequestId: reqPast1,
        customerId: carlos,
        customerName: "Carlos Mendez",
        customerPhone: "(801) 555-0823",
        customerAddress: "3410 Traverse Mountain Blvd, Lehi, UT 84043",
        technicianId: techSarah,
        technicianName: "Chance Robertson",
        category: "Seasonal tune-up",
        priority: "routine",
        issueSummary: "Annual maintenance tune-up. System running loud.",
        scheduledStart: at(-2, 9),
        scheduledEnd: at(-2, 10, 30),
        status: "completed",
      },
      {
        jobId: jobPast2,
        serviceRequestId: reqPast2,
        customerId: lisa,
        customerName: "Lisa Drummond",
        customerPhone: "(801) 555-0945",
        customerAddress: "8701 Fox Hollow Dr, Lehi, UT 84043",
        technicianId: mike,
        technicianName: "Will Rowston",
        category: "Zone system diagnostic",
        priority: "urgent",
        issueSummary: "Upstairs zone not cooling. Nexia showing zone fault.",
        scheduledStart: at(-1, 8),
        scheduledEnd: at(-1, 10),
        status: "completed",
      },
      {
        jobId: jobPast3,
        serviceRequestId: reqPast3,
        customerId: grace,
        customerName: "Grace Nwosu",
        customerPhone: "(801) 555-1412",
        customerAddress: "320 E 13800 S, Draper, UT 84020",
        technicianId: luis,
        technicianName: "Malik Gore",
        category: "Drain line / condensate repair",
        priority: "urgent",
        issueSummary: "AC leaking water inside. Puddle forming near air handler.",
        scheduledStart: at(-1, 13),
        scheduledEnd: at(-1, 14, 30),
        status: "completed",
      },
      // Today
      {
        jobId: job1,
        serviceRequestId: req1,
        customerId: margaret,
        customerName: "Margaret Chen",
        customerPhone: "(801) 555-0142",
        customerAddress: "4821 Ridgeview Dr, Lehi, UT 84043",
        technicianId: mike,
        technicianName: "Will Rowston",
        category: "Emergency diagnostic & repair",
        priority: "emergency",
        issueSummary: "AC completely stopped — house at 92°F.",
        scheduledStart: now - 90 * MIN,
        scheduledEnd: now + 30 * MIN,
        status: "scheduled",
      },
      {
        jobId: job2,
        serviceRequestId: req2,
        customerId: david,
        customerName: "David Okonkwo",
        customerPhone: "(801) 555-0287",
        customerAddress: "1130 Elm Creek Blvd, Draper, UT 84020",
        technicianId: techSarah,
        technicianName: "Chance Robertson",
        category: "Airflow diagnostic",
        priority: "urgent",
        issueSummary: "Weak airflow from vents. System barely cooling.",
        scheduledStart: at(0, 14),
        scheduledEnd: at(0, 16),
        status: "scheduled",
      },
      {
        jobId: job3,
        serviceRequestId: req3,
        customerId: jennifer,
        customerName: "Jennifer Alvarez",
        customerPhone: "(801) 555-0391",
        customerAddress: "782 Sunset Canyon Rd, Draper, UT 84020",
        technicianId: luis,
        technicianName: "Malik Gore",
        category: "Thermostat replacement",
        priority: "urgent",
        issueSummary: "Thermostat display blank. System won't turn on.",
        scheduledStart: at(0, 11),
        scheduledEnd: at(0, 12, 30),
        status: "scheduled",
      },
      {
        jobId: job4,
        serviceRequestId: req4,
        customerId: robert,
        customerName: "Robert Tanaka",
        customerPhone: "(801) 555-0518",
        customerAddress: "2209 Pecan Springs Rd, Salt Lake City, UT 84106",
        technicianId: derek,
        technicianName: "Derek Huang",
        category: "Seasonal tune-up",
        priority: "routine",
        issueSummary: "Annual seasonal tune-up.",
        scheduledStart: at(0, 9),
        scheduledEnd: at(0, 10, 30),
        status: "scheduled",
      },
      {
        jobId: jobKwame,
        serviceRequestId: reqKwame,
        customerId: kwame,
        customerName: "Kwame Asante",
        customerPhone: "(801) 555-1034",
        customerAddress: "1900 S Highland Dr, Suite 200, Salt Lake City, UT 84106",
        technicianId: angela,
        technicianName: "Angela Washington",
        category: "Commercial cooling diagnostic",
        priority: "urgent",
        issueSummary: "Office AC running non-stop but not reaching set temp.",
        scheduledStart: at(0, 15),
        scheduledEnd: at(0, 17),
        status: "scheduled",
      },
      // Tomorrow
      {
        jobId: jobTom1,
        serviceRequestId: reqTom1,
        customerId: tom,
        customerName: "Tom & Rachel Winters",
        customerPhone: "(801) 555-1298",
        customerAddress: "4102 Thanksgiving Way, Lehi, UT 84043",
        technicianId: mike,
        technicianName: "Will Rowston",
        category: "Warranty inspection",
        priority: "routine",
        issueSummary: "New unit making clicking noise on startup.",
        scheduledStart: at(1, 10),
        scheduledEnd: at(1, 11, 30),
        status: "scheduled",
      },
      {
        jobId: jobPriya1,
        serviceRequestId: reqPriya1,
        customerId: priya,
        customerName: "Priya Sharma",
        customerPhone: "(801) 555-1167",
        customerAddress: "6234 Pioneer Rd, Draper, UT 84020",
        technicianId: techSarah,
        technicianName: "Chance Robertson",
        category: "Seasonal tune-up",
        priority: "routine",
        issueSummary: "Annual maintenance. Filter replacement and coil cleaning.",
        scheduledStart: at(1, 9),
        scheduledEnd: at(1, 10, 30),
        status: "scheduled",
      },
      {
        jobId: jobJames1,
        serviceRequestId: reqJames1,
        customerId: james,
        customerName: "James Whitfield",
        customerPhone: "(801) 555-1587",
        customerAddress: "1215 E 200 S, Salt Lake City, UT 84102",
        technicianId: angela,
        technicianName: "Angela Washington",
        category: "VRF diagnostic",
        priority: "urgent",
        issueSummary: "VRF system error code E-04 on indoor unit #3.",
        scheduledStart: at(1, 13),
        scheduledEnd: at(1, 15, 30),
        status: "scheduled",
      },
      {
        jobId: jobSarah1,
        serviceRequestId: reqSarah1,
        customerId: sarah,
        customerName: "Sarah Mitchell",
        customerPhone: "(801) 555-0674",
        customerAddress: "5567 State St, Salt Lake City, UT 84107",
        technicianId: angela,
        technicianName: "Angela Washington",
        category: "Commercial preventive maintenance",
        priority: "routine",
        issueSummary: "Quarterly preventive maintenance on rooftop units.",
        scheduledStart: at(1, 8),
        scheduledEnd: at(1, 11),
        status: "scheduled",
      },
      // Day +2
      {
        jobId: jobLisa2,
        serviceRequestId: reqLisa2,
        customerId: lisa,
        customerName: "Lisa Drummond",
        customerPhone: "(801) 555-0945",
        customerAddress: "8701 Fox Hollow Dr, Lehi, UT 84043",
        technicianId: mike,
        technicianName: "Will Rowston",
        category: "Follow-up inspection",
        priority: "routine",
        issueSummary: "Verify zone damper replacement. Check both zones.",
        scheduledStart: at(2, 9),
        scheduledEnd: at(2, 10),
        status: "scheduled",
      },
      {
        jobId: jobCarlos2,
        serviceRequestId: reqCarlos2,
        customerId: carlos,
        customerName: "Carlos Mendez",
        customerPhone: "(801) 555-0823",
        customerAddress: "3410 Traverse Mountain Blvd, Lehi, UT 84043",
        technicianId: luis,
        technicianName: "Malik Gore",
        category: "Refrigerant leak check",
        priority: "routine",
        issueSummary: "Refrigerant levels felt low. Needs leak check.",
        scheduledStart: at(2, 10),
        scheduledEnd: at(2, 12),
        status: "scheduled",
      },
      {
        jobId: jobGrace2,
        serviceRequestId: reqGrace2,
        customerId: grace,
        customerName: "Grace Nwosu",
        customerPhone: "(801) 555-1412",
        customerAddress: "320 E 13800 S, Draper, UT 84020",
        technicianId: derek,
        technicianName: "Derek Huang",
        category: "UV light installation",
        priority: "routine",
        issueSummary: "Install UV light system for air quality.",
        scheduledStart: at(2, 14),
        scheduledEnd: at(2, 15, 30),
        status: "scheduled",
      },
      // Day +3
      {
        jobId: jobDavid3,
        serviceRequestId: reqDavid3,
        customerId: david,
        customerName: "David Okonkwo",
        customerPhone: "(801) 555-0287",
        customerAddress: "1130 Elm Creek Blvd, Draper, UT 84020",
        technicianId: derek,
        technicianName: "Derek Huang",
        category: "Duct inspection",
        priority: "routine",
        issueSummary: "Follow-up ducting inspection after airflow repair.",
        scheduledStart: at(3, 9),
        scheduledEnd: at(3, 11),
        status: "scheduled",
      },
      {
        jobId: jobJen3,
        serviceRequestId: reqJen3,
        customerId: jennifer,
        customerName: "Jennifer Alvarez",
        customerPhone: "(801) 555-0391",
        customerAddress: "782 Sunset Canyon Rd, Draper, UT 84020",
        technicianId: techSarah,
        technicianName: "Chance Robertson",
        category: "Consultation / quote",
        priority: "routine",
        issueSummary: "Whole-home dehumidifier consultation.",
        scheduledStart: at(3, 13),
        scheduledEnd: at(3, 14),
        status: "scheduled",
      },
      {
        jobId: jobKwame3,
        serviceRequestId: reqKwame3,
        customerId: kwame,
        customerName: "Kwame Asante",
        customerPhone: "(801) 555-1034",
        customerAddress: "1900 S Highland Dr, Suite 200, Salt Lake City, UT 84106",
        technicianId: nina,
        technicianName: "Nina Kowalski",
        category: "Smart thermostat installation",
        priority: "routine",
        issueSummary: "Install smart thermostat and occupancy sensors.",
        scheduledStart: at(3, 10),
        scheduledEnd: at(3, 12, 30),
        status: "scheduled",
      },
      // Day +4
      {
        jobId: jobRobert4,
        serviceRequestId: reqRobert4,
        customerId: robert,
        customerName: "Robert Tanaka",
        customerPhone: "(801) 555-0518",
        customerAddress: "2209 Pecan Springs Rd, Salt Lake City, UT 84106",
        technicianId: mike,
        technicianName: "Will Rowston",
        category: "Compressor diagnostic",
        priority: "urgent",
        issueSummary: "Compressor making grinding noise.",
        scheduledStart: at(4, 8),
        scheduledEnd: at(4, 10, 30),
        status: "scheduled",
      },
      {
        jobId: jobJames4,
        serviceRequestId: reqJames4,
        customerId: james,
        customerName: "James Whitfield",
        customerPhone: "(801) 555-1587",
        customerAddress: "1215 E 200 S, Salt Lake City, UT 84102",
        technicianId: angela,
        technicianName: "Angela Washington",
        category: "VRF preventive maintenance",
        priority: "routine",
        issueSummary: "Semi-annual preventive maintenance on VRF system.",
        scheduledStart: at(4, 13),
        scheduledEnd: at(4, 16),
        status: "scheduled",
      },
    ];

    for (const entry of scheduledEntries) {
      await ctx.db.insert("scheduledServices", {
        ...entry,
        createdAt: now,
      });
    }

    // ── Agent Decisions ──────────────────────────────────────────────

    await ctx.db.insert("agentDecisions", {
      type: "triage",
      relatedRequestId: req1,
      summary: "Triaged as EMERGENCY — VIP customer, total AC failure at 92°F",
      rationale:
        "Indoor temp 92°F with no cooling, VIP + maintenance member. Score 10. Immediate dispatch required.",
      createdAt: now - 2 * HOUR + 1 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "assignment",
      relatedRequestId: req1,
      relatedJobId: job1,
      summary: "Assigned Will Rowston — senior diagnostics, nearest available",
      rationale:
        "Will has compressor/diagnostics skills, 97 reliability, and covers Lehi territory matching customer location.",
      createdAt: now - 2 * HOUR + 2 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "triage",
      relatedRequestId: reqNew1,
      summary:
        "Triaged as EMERGENCY — commercial compressor failure, 12 tenants affected",
      rationale:
        "Compressor shutting down intermittently in commercial building. VIP property manager. Score 10.",
      createdAt: now - 20 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "assignment",
      relatedRequestId: reqKwame,
      relatedJobId: jobKwame,
      summary: "Assigned Angela Washington — commercial systems specialist",
      rationale:
        "Angela has commercial systems and building automation skills. Salt Lake City territory covers Highland Dr location.",
      createdAt: now - 3 * HOUR + 5 * MIN,
    });

    await ctx.db.insert("agentDecisions", {
      type: "resolution",
      relatedRequestId: reqPast2,
      relatedJobId: jobPast2,
      summary: "Resolved — zone damper actuator replaced on-site",
      rationale:
        "Will diagnosed stuck zone damper actuator in upstairs zone. Replacement part in truck stock. Both zones verified working.",
      createdAt: at(-1, 10),
    });

    await ctx.db.insert("agentDecisions", {
      type: "resolution",
      relatedRequestId: reqPast3,
      relatedJobId: jobPast3,
      summary: "Resolved — condensate drain flushed, float switch installed",
      rationale:
        "Malik cleared clogged condensate line and installed safety float switch to prevent future overflow.",
      createdAt: at(-1, 14, 30),
    });

    await ctx.db.insert("agentDecisions", {
      type: "message",
      relatedRequestId: req1,
      relatedJobId: job1,
      summary: "Sent dispatch confirmation to Margaret Chen",
      rationale:
        "VIP customer expects immediate communication. Confirmed Will dispatched and ETA.",
      createdAt: now - 90 * MIN,
    });

    // ── Outgoing Messages ────────────────────────────────────────────

    await ctx.db.insert("outgoingMessages", {
      customerId: margaret,
      relatedJobId: job1,
      messageType: "dispatch_confirmation",
      content:
        "Hi Margaret, this is Hailey HVAC. Tech Will Rowston has been dispatched to 4821 Ridgeview Dr. He specializes in diagnostics and should arrive within 20 minutes.",
      createdAt: now - 100 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: margaret,
      relatedJobId: job1,
      messageType: "eta_update",
      content:
        "Update: Will has arrived and is inspecting both Carrier Infinity units. Estimated diagnosis time: 30 minutes.",
      createdAt: now - 70 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: david,
      relatedJobId: job2,
      messageType: "dispatch_confirmation",
      content:
        "Hi David, technician Chance Robertson is scheduled for this afternoon at 1130 Elm Creek Blvd to diagnose your airflow issue. He'll call when he's on his way.",
      createdAt: now - 4 * HOUR,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: jennifer,
      relatedJobId: job3,
      messageType: "dispatch_confirmation",
      content:
        "Hi Jennifer, Malik Gore is scheduled to arrive at 782 Sunset Canyon Rd around 11 AM to replace your thermostat. We'll text when he's en route.",
      createdAt: now - 6 * HOUR,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: kwame,
      relatedJobId: jobKwame,
      messageType: "dispatch_confirmation",
      content:
        "Hi Kwame, Angela Washington (commercial systems specialist) is scheduled for your office at 3 PM today. She'll diagnose the cooling issue with your rooftop unit.",
      createdAt: now - 2 * HOUR,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: sarah,
      messageType: "eta_update",
      content:
        "Hi Sarah, we've received your emergency request for the compressor issue at Building 1. We're working on assigning a senior technician now.",
      createdAt: now - 18 * MIN,
    });

    await ctx.db.insert("outgoingMessages", {
      customerId: lisa,
      relatedJobId: jobPast2,
      messageType: "follow_up",
      content:
        "Hi Lisa, just confirming the zone damper replacement is working well. We have a follow-up inspection scheduled in two days to verify both zones.",
      createdAt: at(-1, 11),
    });

    // ── Simulation Events ────────────────────────────────────────────

    await ctx.db.insert("simulationEvents", {
      type: "vip_emergency",
      payload: JSON.stringify({
        customerId: margaret,
        description: "VIP Margaret Chen — total AC failure at 92°F",
      }),
      createdAt: now - 2 * HOUR,
    });

    await ctx.db.insert("simulationEvents", {
      type: "new_emergency",
      payload: JSON.stringify({
        customerId: sarah,
        description: "Commercial compressor rattling and shutting down — Building 1",
      }),
      createdAt: now - 30 * MIN,
    });

    await ctx.db.insert("simulationEvents", {
      type: "new_emergency",
      payload: JSON.stringify({
        customerId: jennifer,
        description: "Furnace ignitor failure — temperatures dropping, family with children",
      }),
      createdAt: now - 5 * MIN,
    });

    await ctx.db.insert("simulationEvents", {
      type: "routine_request",
      payload: JSON.stringify({
        customerId: robert,
        description: "Annual seasonal tune-up requested",
      }),
      createdAt: now - 24 * HOUR,
    });

    return {
      customers: 12,
      technicians: 6,
      serviceRequests: 20,
      jobs: 19,
      scheduledServices: scheduledEntries.length,
      agentDecisions: 7,
      outgoingMessages: 7,
      simulationEvents: 4,
    };
  },
});
