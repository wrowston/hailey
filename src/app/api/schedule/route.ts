import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra/index";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "check") {
      const {
        name,
        phone_number: phone,
        email,
        address,
        issue,
        notes,
        urgency,
        urgency_score,
        likely_job_type,
        summary,
        urgency_reason,
      } = body.data;

      const combinedNotes = [summary, urgency_reason, notes]
        .filter(Boolean)
        .join("\n\n");

      const workflow = mastra.getWorkflow("intakeSchedulingWorkflow");
      const run = await workflow.createRun();

      const result = await run.start({
        inputData: {
          name,
          phone,
          email,
          address,
          issueSummary: issue,
          notes: combinedNotes || undefined,
          urgency,
          urgencyScore: urgency_score,
          likelyJobType: likely_job_type,
        },
      });

      if (result.status === "suspended") {
        const suspendedPath = result.suspended[0];
        const stepKey = Array.isArray(suspendedPath)
          ? suspendedPath[0]
          : suspendedPath;
        const stepResult =
          result.steps[stepKey as keyof typeof result.steps] as
            | { suspendPayload?: { availableSlots?: unknown[] } }
            | undefined;
        const availableSlots =
          stepResult?.suspendPayload?.availableSlots ?? [];

        return NextResponse.json({
          status: "suspended",
          runId: run.runId,
          availableSlots,
        });
      }

      if (result.status === "success") {
        return NextResponse.json({
          status: "success",
          result: result.result,
        });
      }

      return NextResponse.json(
        {
          status: result.status,
          error: "Workflow did not suspend as expected",
        },
        { status: 500 },
      );
    }

    if (action === "confirm") {
      const { runId, selectedSlot } = body;

      if (!runId || !selectedSlot) {
        return NextResponse.json(
          { error: "runId and selectedSlot are required" },
          { status: 400 },
        );
      }

      const workflow = mastra.getWorkflow("intakeSchedulingWorkflow");
      const run = await workflow.createRun({ runId });

      const result = await run.resume({
        step: "await-confirmation",
        resumeData: { selectedSlot },
      });

      if (result.status === "success") {
        return NextResponse.json({
          status: "success",
          result: result.result,
        });
      }

      return NextResponse.json(
        {
          status: result.status,
          error: "Workflow did not complete successfully",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { error: "Failed to process scheduling request" },
      { status: 500 },
    );
  }
}
