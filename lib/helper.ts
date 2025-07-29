import { ExecutionPhase } from "@prisma/client";
import { endOfMonth, intervalToDuration, startOfMonth } from "date-fns";
import { AppNode, Period } from "./types";
import { TaskRegistry } from "./workflow/task/Registry";

export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function datesToDurationString(
  end: Date | null | undefined,
  start: Date | null | undefined
) {
  if (!start || !end) return null;

  const timeElapsed = end.getTime() - start.getTime();
  if (timeElapsed < 1000) {
    return `${timeElapsed} ms`;
  }

  // intervalToDuration does not account for values under one second
  const duration = intervalToDuration({
    start: 0,
    end: timeElapsed,
  });

  return `${duration.hours || 0}h ${duration.minutes || 0}m ${
    duration.seconds || 0
  }s`;
}

type Phase = Pick<ExecutionPhase, "creditsConsumed">;
export function getPhasesTotalCost(phases: Phase[]) {
  return phases.reduce((acc, phase) => acc + (phase.creditsConsumed || 0), 0);
}

export function calculateWorkflowCost(nodes: AppNode[]) {
  return nodes.reduce((acc, node) => {
    return acc + TaskRegistry[node.data.type].credits;
  }, 0);
}

export function getAppUrl(path: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return `${appUrl}/${path}`;
}

export function periodToDateRange(period: Period) {
  const startDate = startOfMonth(new Date(period.year, period.month));
  const endDate = endOfMonth(new Date(period.year, period.month));

  return { startDate, endDate };
}
