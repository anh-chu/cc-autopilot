import type { Action, FieldTask } from "./types";

/**
 * Maps Action (new model) to FieldTask shape (expected by FieldTaskCard).
 * Actions and FieldTasks are structurally identical except missionId vs initiativeId.
 */
export function actionToFieldTask(action: Action): FieldTask {
  return {
    id: action.id,
    missionId: action.initiativeId,
    title: action.title,
    description: action.description,
    type: action.type,
    serviceId: action.serviceId,
    assignedTo: action.assignedTo,
    status: action.status,
    approvalRequired: action.approvalRequired,
    payload: action.payload,
    result: action.result,
    attachments: action.attachments,
    linkedTaskId: action.linkedTaskId,
    blockedBy: action.blockedBy,
    rejectionFeedback: action.rejectionFeedback,
    approvedBy: action.approvedBy,
    rejectedBy: action.rejectedBy,
    scheduledFor: action.scheduledFor,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
    executedAt: action.executedAt,
    completedAt: action.completedAt,
  };
}
