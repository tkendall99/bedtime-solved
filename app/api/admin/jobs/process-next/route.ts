/**
 * POST /api/admin/jobs/process-next
 *
 * Admin endpoint to manually trigger processing of the next queued job.
 * Processes one job per request.
 *
 * Response:
 * - 200: Job processed (success or failure captured in response)
 * - 204: No jobs pending
 * - 500: Internal error
 *
 * TODO: Add admin authentication before production use.
 */

import { NextRequest, NextResponse } from "next/server";
import { processNextJob, ProcessResult } from "@/server/jobs/processNextJob";

export async function POST(request: NextRequest): Promise<NextResponse<ProcessResult>> {
  console.log("[API] POST /api/admin/jobs/process-next");

  try {
    const result = await processNextJob();

    if (!result.processed) {
      // No jobs to process
      return NextResponse.json(result, { status: 204 });
    }

    if (result.error) {
      // Job was processed but failed
      console.error(`[API] Job processing failed: ${result.error}`);
      return NextResponse.json(result, { status: 200 });
    }

    // Job processed successfully
    console.log(`[API] Job processed successfully for book ${result.bookId}`);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[API] Error in process-next endpoint:", error);
    return NextResponse.json(
      {
        processed: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Disable body parsing for this route (not needed for POST with no body)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
