import { revalidatePath } from "next/cache";
import "server-only";
import prisma from "../prisma";
import {
  AppNode,
  Enviornment,
  ExecutionEnviornment,
  ExecutionPhaseStatus,
  LogCollector,
  TaskParamType,
  WorkflowExecutionStatus,
} from "../types";
import { ExecutionPhase } from "@prisma/client";
import { TaskRegistry } from "./task/Registry";
import { ExecutorRegistry } from "./executor/Registry";
import { Browser, Page } from "puppeteer";
import { Edge } from "@xyflow/react";
import { createLogCollector } from "../log";

export async function executeWorkflow(executionId: string, nextRunAt?: Date) {
  const execution = await prisma.workflowExecution.findUnique({
    where: {
      id: executionId,
    },
    include: { workflow: true, phases: true },
  });

  if (!execution) {
    throw new Error("Execution not found");
  }

  const edges = JSON.parse(execution.definition).edges as Edge[];

  const enviornment = { phases: {} };
  await initializeWorkflowExecution(
    executionId,
    execution.workflowId,
    nextRunAt
  );
  await initializePhaseStatues(execution);

  let executionFailed = false;
  let creditsConsumed = 0;

  for (const phase of execution.phases) {
    const phaseExecution = await executeWorkflowPhase(
      phase,
      enviornment,
      edges,
      execution.userId
    );
    creditsConsumed += phaseExecution.creditsConsumed;
    if (!phaseExecution.success) {
      executionFailed = true;
      break;
    }
  }

  await finalizeWorkflowExecution(
    executionId,
    execution.workflowId,
    executionFailed,
    creditsConsumed
  );
  await cleanupEnviornment(enviornment);

  revalidatePath(`/worflow/runs`);
}

async function initializeWorkflowExecution(
  executionId: string,
  workflowId: string,
  nextRunAt?: Date
) {
  await prisma.workflowExecution.update({
    where: {
      id: executionId,
    },
    data: {
      startedAt: new Date(),
      status: WorkflowExecutionStatus.RUNNING,
    },
  });
  await prisma.workflow.update({
    where: {
      id: workflowId,
    },
    data: {
      lastRunAt: new Date(),
      lastRunStatus: WorkflowExecutionStatus.RUNNING,
      lastRunId: executionId,
      ...(nextRunAt && { nextRunAt }),
    },
  });
}

async function initializePhaseStatues(execution: any) {
  await prisma.executionPhase.updateMany({
    where: {
      id: {
        in: execution.phases.map((phase: any) => phase.id),
      },
    },
    data: {
      status: ExecutionPhaseStatus.PENDING,
    },
  });
}

async function finalizeWorkflowExecution(
  executionId: string,
  workflowId: string,
  executionFailed: boolean,
  creditsConsumed: number
) {
  const finalStatus = executionFailed
    ? WorkflowExecutionStatus.FAILED
    : WorkflowExecutionStatus.COMPLETED;

  await prisma.workflowExecution.update({
    where: {
      id: executionId,
    },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      creditsConsumed,
    },
  });

  await prisma.workflow
    .update({
      where: {
        id: workflowId,
        lastRunId: executionId,
      },
      data: {
        lastRunStatus: finalStatus,
      },
    })
    .catch((err) => {
      // Ignoring the error
      // This means that we have triggred other runs for this workflow, while an execution was running
    });
}

async function executeWorkflowPhase(
  phase: ExecutionPhase,
  enviornment: Enviornment,
  edges: Edge[],
  userId: string
) {
  const startedAt = new Date();
  const logCollector = createLogCollector();

  const node = JSON.parse(phase.node) as AppNode;
  setupEnviornmentForPhase(node, enviornment, edges);
  // Update the status

  await prisma.executionPhase.update({
    where: {
      id: phase.id,
    },
    data: {
      status: ExecutionPhaseStatus.RUNNING,
      startedAt,
      inputs: JSON.stringify(enviornment.phases[node.id].inputs),
    },
  });

  const creditsRequired = TaskRegistry[node.data.type].credits;

  let success = await decrementCredits(userId, creditsRequired, logCollector);

  const creditsConsumed = success ? creditsRequired : 0;
  if (success) {
    // executing phase only when credits are available and deducted
    success = await executePhase(phase, node, enviornment, logCollector);
  }
  const outputs = enviornment.phases[node.id].outputs;
  await finalizePhase(
    phase.id,
    success,
    outputs,
    creditsConsumed,
    logCollector
  );
  return { success, creditsConsumed };
}

async function finalizePhase(
  phaseId: string,
  success: boolean,
  outputs: Record<string, string>,
  creditsConsumed: number,
  logCollector: LogCollector
) {
  const finalStatus = success
    ? ExecutionPhaseStatus.COMPLETED
    : ExecutionPhaseStatus.FAILED;

  await prisma.executionPhase.update({
    where: {
      id: phaseId,
    },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      outputs: JSON.stringify(outputs),
      creditsConsumed,
      logs: {
        createMany: {
          data: logCollector.getAll().map((log) => ({
            message: log.message,
            timestamp: log.timeStamp,
            logLevel: log.level,
          })),
        },
      },
    },
  });
}

async function executePhase(
  phase: ExecutionPhase,
  node: AppNode,
  enviornment: Enviornment,
  logCollector: LogCollector
): Promise<boolean> {
  const runFc = ExecutorRegistry[node.data.type];
  if (!runFc) {
    logCollector.error(`Executor not found for ${node.data.type}`);
    return false;
  }

  const executionEnviornment: ExecutionEnviornment<any> =
    createExecutionEnviornment(node, enviornment, logCollector);

  return await runFc(executionEnviornment);
}

function setupEnviornmentForPhase(
  node: AppNode,
  enviornment: Enviornment,
  edges: Edge[]
) {
  enviornment.phases[node.id] = {
    inputs: {},
    outputs: {},
  };
  const inputs = TaskRegistry[node.data.type].inputs;

  for (const input of inputs) {
    if (input.type === TaskParamType.BROWSE_INSTANCE) continue;
    const inputValue = node.data.inputs[input.name];
    if (inputValue) {
      // Input value is defined by user
      enviornment.phases[node.id].inputs[input.name] = inputValue;
      continue;
    }
    // The input value is coming form ouptut of previous node

    const connectedEdge = edges.find(
      (edge) => edge.target === node.id && edge.targetHandle === input.name
    );

    if (!connectedEdge) {
      console.error(
        "Missing edge for input ",
        input.name,
        " node.id: ",
        node.id
      );
    }

    const outputValue =
      enviornment.phases[connectedEdge!.source].outputs[
        connectedEdge!.sourceHandle!
      ];

    enviornment.phases[node.id].inputs[input.name] = outputValue;
  }
}

function createExecutionEnviornment(
  node: AppNode,
  enviornment: Enviornment,
  logCollector: LogCollector
): ExecutionEnviornment<any> {
  return {
    getInput: (name: string) => enviornment.phases[node.id]?.inputs[name],
    setOutput: (name: string, value: string) => {
      enviornment.phases[node.id].outputs[name] = value;
    },
    getBrowser: () => enviornment.browser,
    setBrowser: (browser: Browser) => {
      enviornment.browser = browser;
    },
    setPage: (page: Page) => (enviornment.page = page),
    getPage: () => enviornment.page,
    log: logCollector,
  };
}

async function cleanupEnviornment(enviornment: Enviornment) {
  if (enviornment.browser) {
    await enviornment.browser.close().catch((err) => {
      console.log("Cannot close browser, reason:", err);
    });
  }
}

async function decrementCredits(
  userId: string,
  amount: number,
  logCollector: LogCollector
) {
  try {
    await prisma.userBalance.update({
      where: {
        userId,
        credits: {
          gte: amount,
        },
      },
      data: {
        credits: { decrement: amount },
      },
    });
    return true;
  } catch (error) {
    logCollector.error("Insufficient balance");
    // user does not have sufficient balance
    return false;
  }
}
