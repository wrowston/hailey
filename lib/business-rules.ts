type Priority = "emergency" | "urgent" | "routine";
type TechStatus = "available" | "en_route" | "on_job" | "off_duty";

interface TechnicianData {
  _id: string;
  name: string;
  skills: string[];
  status: TechStatus;
  territory: string;
  currentJobId?: string;
  reliabilityScore: number;
}

interface JobData {
  _id: string;
  technicianId: string;
  priority: Priority;
  status: string;
  category: string;
  customerName: string;
  scheduledStart: number;
  scheduledEnd: number;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  emergency: 3,
  urgent: 2,
  routine: 1,
};

// Skills that map to common HVAC issue keywords
const SKILL_KEYWORDS: Record<string, string[]> = {
  diagnostics: ["diagnostic", "unknown", "noise", "investigate", "check"],
  "emergency repair": [
    "emergency",
    "no cooling",
    "no heating",
    "complete failure",
    "not working",
  ],
  "compressor replacement": ["compressor", "refrigerant", "charge"],
  "refrigerant systems": ["refrigerant", "leak", "charge", "freon"],
  electrical: ["electrical", "wiring", "breaker", "fuse"],
  "residential maintenance": [
    "maintenance",
    "tune-up",
    "seasonal",
    "preventive",
  ],
  "tune-ups": ["tune-up", "tune up", "seasonal", "annual"],
  "thermostat installation": ["thermostat", "smart thermostat", "nest"],
  "duct inspection": ["duct", "ductwork", "leak"],
  "filter systems": ["filter", "air quality"],
  installations: ["install", "new unit", "replacement unit"],
  "general service": ["service", "repair", "fix"],
  ductwork: ["duct", "ductwork"],
  "airflow balancing": ["airflow", "weak airflow", "uneven", "hot spots"],
  "commercial systems": ["commercial", "multiple units", "large"],
};

export function scoreTechnicianFit(
  tech: TechnicianData,
  issueDescription: string,
  customerAddress: string,
  urgency: Priority
): { score: number; breakdown: Record<string, number> } {
  const issue = issueDescription.toLowerCase();

  // Skill match (40%)
  let skillScore = 0;
  for (const skill of tech.skills) {
    const keywords = SKILL_KEYWORDS[skill] ?? [];
    if (keywords.some((kw) => issue.includes(kw))) {
      skillScore += 20;
    }
  }
  skillScore = Math.min(skillScore, 40);

  // Availability (30%)
  let availabilityScore = 0;
  if (tech.status === "available") availabilityScore = 30;
  else if (tech.status === "en_route") availabilityScore = 10;
  else if (tech.status === "on_job") availabilityScore = 5;
  else availabilityScore = 0; // off_duty

  // Territory match (20%)
  const territories = tech.territory.toLowerCase().split(/[\/,]/);
  const addressLower = customerAddress.toLowerCase();
  const territoryScore = territories.some((t) =>
    addressLower.includes(t.trim())
  )
    ? 20
    : 5;

  // Reliability (10%)
  const reliabilityScore = (tech.reliabilityScore / 100) * 10;

  const total = skillScore + availabilityScore + territoryScore + reliabilityScore;

  return {
    score: Math.round(total * 10) / 10,
    breakdown: {
      skill: skillScore,
      availability: availabilityScore,
      territory: territoryScore,
      reliability: reliabilityScore,
    },
  };
}

/**
 * Determines if a new request can bump an existing job.
 * Emergency > Urgent > Routine — a job can only be bumped by a
 * strictly higher priority request.
 */
export function canBumpJob(
  existingJobPriority: Priority,
  newRequestUrgency: Priority
): boolean {
  return PRIORITY_WEIGHT[newRequestUrgency] > PRIORITY_WEIGHT[existingJobPriority];
}

/**
 * Find the best technician and any jobs that should be bumped.
 */
export function rankTechnicians(
  technicians: TechnicianData[],
  jobs: JobData[],
  issueDescription: string,
  customerAddress: string,
  urgency: Priority
): Array<{
  technician: TechnicianData;
  score: number;
  breakdown: Record<string, number>;
  bumpableJobs: JobData[];
}> {
  return technicians
    .filter((t) => t.status !== "off_duty")
    .map((tech) => {
      const fit = scoreTechnicianFit(
        tech,
        issueDescription,
        customerAddress,
        urgency
      );

      // Find jobs that this tech has that could be bumped
      const techJobs = jobs.filter(
        (j) =>
          j.technicianId === tech._id &&
          j.status !== "completed" &&
          j.status !== "cancelled" &&
          j.status !== "bumped"
      );

      const bumpableJobs = techJobs.filter((j) =>
        canBumpJob(j.priority, urgency)
      );

      return {
        technician: tech,
        score: fit.score,
        breakdown: fit.breakdown,
        bumpableJobs,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate a simple ETA in minutes based on territory match.
 */
export function calculateEtaMinutes(
  techTerritory: string,
  customerAddress: string,
  techStatus: TechStatus
): number {
  const territories = techTerritory.toLowerCase().split(/[\/,]/);
  const inTerritory = territories.some((t) =>
    customerAddress.toLowerCase().includes(t.trim())
  );

  let base = inTerritory ? 15 : 35;

  if (techStatus === "available") base += 5;
  else if (techStatus === "en_route") base += 20;
  else if (techStatus === "on_job") base += 30;

  // Add some believable variance
  return base + Math.floor(Math.random() * 10);
}
