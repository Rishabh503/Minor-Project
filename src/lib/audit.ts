import { db } from "./db";

export interface LogAuditParams {
  action: string;
  entityType: string;
  entityId?: string;
  companyId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        companyId: params.companyId,
        actorId: params.actorId,
        metadata: (params.metadata as any) ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Failed to record audit event:", error);
    // Audit log failure should not crash the primary operational transaction in development
    return null;
  }
}
