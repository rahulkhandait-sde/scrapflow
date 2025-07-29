"use server";

import { calculateWorkflowCost } from "@/lib/helper";
import prisma from "@/lib/prisma";
import { AppNode, TaskType, WorkflowStatus } from "@/lib/types";
import { createFlowNode } from "@/lib/workflow/CreateFlowNode";
import { flowToExecutionPlan } from "@/lib/workflow/executionPlan";
import {
  createWorkflowShema,
  createWorkflowShemaType,
  duplicateWorkflowSchemaType,
} from "@/schema/workflows";
import { auth } from "@clerk/nextjs/server";
import { Edge } from "@xyflow/react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import parser from "cron-parser";

export async function getWorkflowsForUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }
  return prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createWorkflow(form: createWorkflowShemaType) {
  const { success, data } = createWorkflowShema.safeParse(form);

  if (!success) {
    throw new Error("Invalid form data");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const initWorkflow: { nodes: AppNode[]; edges: Edge[] } = {
    nodes: [],
    edges: [],
  };
  initWorkflow.nodes.push(createFlowNode(TaskType.LAUNCH_BROWSER));
  const result = await prisma.workflow.create({
    data: {
      userId,
      status: WorkflowStatus.DRAFT,
      definition: JSON.stringify(initWorkflow),
      ...data,
    },
  });
  if (!result) {
    throw new Error("Failed to create workflow");
  }

  redirect(`/workflow/editor/${result.id}`);
}

export async function deleteWorkflow(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  await prisma.workflow.delete({
    where: {
      userId,
      id: workflowId,
    },
  });

  revalidatePath("/workflows");
}

export async function updateWorkFlow({
  id,
  definition,
}: {
  id: string;
  definition: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (workflow.status !== WorkflowStatus.DRAFT) {
    throw new Error("Workflow is not draft");
  }

  await prisma.workflow.update({
    data: {
      definition,
    },
    where: {
      id,
      userId,
    },
  });
  revalidatePath("/workflows");
}

export async function getWorkflowExecutionWithPhases(executionId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return prisma.workflowExecution.findUnique({
    where: { id: executionId, userId },
    include: {
      phases: {
        orderBy: {
          number: "asc",
        },
      },
    },
  });
}

export async function getWorkflowPhaseDetails(phaseId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return prisma.executionPhase.findUnique({
    where: {
      id: phaseId,
      execution: {
        userId,
      },
    },
    include: {
      logs: {
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });
}

export async function getWorkflowExecutions(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return await prisma.workflowExecution.findMany({
    where: {
      workflowId,
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function publishWorkflow({
  id,
  flowDefinition,
}: {
  id: string;
  flowDefinition: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      id,
      userId,
    },
  });
  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (workflow.status !== WorkflowStatus.DRAFT) {
    throw new Error("Workflow is not draft");
  }

  const flow = JSON.parse(flowDefinition);

  const result = flowToExecutionPlan(flow.nodes, flow.edges);

  if (result.error) {
    throw new Error("Flow definition not valid");
  }

  if (!result.executionPlan) {
    throw new Error("Something went wrong, No eexecution plan generated");
  }

  const creditsCost = calculateWorkflowCost(flow.nodes);

  await prisma.workflow.update({
    where: {
      id,
      userId,
    },
    data: {
      definition: flowDefinition,
      executionPlan: JSON.stringify(result.executionPlan),
      creditsCost,
      status: WorkflowStatus.PUBLISHED,
    },
  });
  revalidatePath(`/worflow/editor/${id}`);
}

export async function unPublishWorkflow(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }
  const workflow = await prisma.workflow.findUnique({
    where: {
      id,
      userId,
    },
  });
  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (workflow.status !== WorkflowStatus.PUBLISHED) {
    throw new Error("Workflow is not published");
  }

  await prisma.workflow.update({
    where: {
      id,
      userId,
    },
    data: {
      status: WorkflowStatus.DRAFT,
      executionPlan: null,
      creditsCost: 0,
    },
  });
  revalidatePath(`/worflow/editor/${id}`);
}

export async function updateWorkFlowCron({
  id,
  cron,
}: {
  id: string;
  cron: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  try {
    const interval = parser.parseExpression(cron, { utc: true });
    await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        cron,
        nextRunAt: interval.next().toDate(),
      },
    });
  } catch (error: any) {
    console.error(error.message);
    throw new Error("Invalid cron expression");
  }
  revalidatePath("/workflows");
}

export async function removeWorkflowSchedule(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }
  await prisma.workflow.update({
    where: {
      id,
      userId,
    },
    data: {
      cron: null,
      nextRunAt: null,
    },
  });
  revalidatePath("/workflows");
}

export async function duplicateWorkflow(form: duplicateWorkflowSchemaType) {
  const { success, data } = createWorkflowShema.safeParse(form);
  if (!success) {
    throw new Error("Invalid form data");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const sourceWorkflow = await prisma.workflow.findUnique({
    where: {
      userId,
      id: form.workflowId,
    },
  });

  if (!sourceWorkflow) {
    throw new Error("Workflow not found");
  }

  const result = await prisma.workflow.create({
    data: {
      userId,
      status: WorkflowStatus.DRAFT,
      name: data.name,
      description: data.description,
      definition: sourceWorkflow.definition,
    },
  });
  if (!result) {
    throw new Error("Failed to duplicate workflow");
  }

  redirect("/workflows");
}
