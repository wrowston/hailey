import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "calls.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        phone_number TEXT,
        email TEXT,
        issue TEXT,
        urgency_score INTEGER,
        urgency_reason TEXT,
        summary TEXT,
        transcript TEXT,
        status TEXT DEFAULT 'in-progress',
        started_at TEXT,
        ended_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export interface CallRecord {
  id: string;
  phone_number: string | null;
  email: string | null;
  issue: string | null;
  urgency_score: number | null;
  urgency_reason: string | null;
  summary: string | null;
  transcript: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export function createCall(id: string): CallRecord {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO calls (id, status, started_at) VALUES (?, 'in-progress', ?)`
  ).run(id, now);
  return getCall(id)!;
}

export function saveCallData(
  id: string,
  data: {
    phone_number?: string;
    email?: string;
    issue?: string;
    urgency_score?: number;
    urgency_reason?: string;
    summary?: string;
    transcript?: string;
  }
): CallRecord | null {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.phone_number !== undefined) {
    fields.push("phone_number = ?");
    values.push(data.phone_number);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.issue !== undefined) {
    fields.push("issue = ?");
    values.push(data.issue);
  }
  if (data.urgency_score !== undefined) {
    fields.push("urgency_score = ?");
    values.push(data.urgency_score);
  }
  if (data.urgency_reason !== undefined) {
    fields.push("urgency_reason = ?");
    values.push(data.urgency_reason);
  }
  if (data.summary !== undefined) {
    fields.push("summary = ?");
    values.push(data.summary);
  }
  if (data.transcript !== undefined) {
    fields.push("transcript = ?");
    values.push(data.transcript);
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE calls SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values,
      id
    );
  }

  return getCall(id);
}

export function endCall(
  id: string,
  data: {
    phone_number?: string;
    email?: string;
    issue?: string;
    urgency_score?: number;
    urgency_reason?: string;
    summary?: string;
    transcript?: string;
  }
): CallRecord | null {
  const db = getDb();
  const now = new Date().toISOString();

  // First save the data
  saveCallData(id, data);

  // Then mark as completed
  db.prepare(`UPDATE calls SET status = 'completed', ended_at = ? WHERE id = ?`).run(
    now,
    id
  );

  return getCall(id);
}

export function getCall(id: string): CallRecord | null {
  const db = getDb();
  return db.prepare("SELECT * FROM calls WHERE id = ?").get(id) as CallRecord | null;
}

export function getAllCalls(): CallRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM calls ORDER BY created_at DESC")
    .all() as CallRecord[];
}

export function getCompletedCalls(): CallRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM calls WHERE status = 'completed' ORDER BY created_at DESC"
    )
    .all() as CallRecord[];
}
