import { NextResponse } from "next/server";
import { mutateFieldServices } from "@/lib/data";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { detectSecretsInConfig } from "@/lib/field-ops-security";
import { addFieldActivityEvent } from "@/lib/field-ops-activity";

const activateServiceSchema = z.object({
  actor: z.string().max(50).optional(),
  serviceId: z.string().min(1, "Service ID is required"),
  config: z.record(z.string(), z.unknown()).optional().default({}).refine(
    (val) => JSON.stringify(val).length <= 10240,
    "Config exceeds 10KB limit",
  ),
});

export async function POST(request: Request) {
  const validation = await validateBody(request, activateServiceSchema);
  if (!validation.success) return validation.error;
  const { serviceId, config, actor: requestActor } = validation.data;
  const activateActor = requestActor ?? "system";

  const result = await mutateFieldServices(async (data) => {
    const idx = data.services.findIndex((s) => s.id === serviceId);
    if (idx === -1) return { error: "not-found" as const };

    const service = data.services[idx];
    if (service.status !== "saved" && service.status !== "disconnected") {
      return { error: "invalid-status" as const, currentStatus: service.status };
    }

    // Merge config and activate
    data.services[idx] = {
      ...service,
      status: "connected",
      config: { ...service.config, ...config },
    };

    return { service: data.services[idx] };
  });

  if ("error" in result) {
    if (result.error === "not-found") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Cannot activate service with status "${result.currentStatus}". Must be "saved" or "disconnected".` },
      { status: 400 }
    );
  }

  const { service } = result;

  // Check for secrets accidentally stored in plaintext config
  const suspiciousKeys = detectSecretsInConfig(config);
  if (suspiciousKeys.length > 0) {
    await addFieldActivityEvent({
      type: "credential_access_denied",
      actor: activateActor,
      taskId: null,
      serviceId: service.id,
      summary: `Warning: possible API key in service config`,
      details: `Service "${service.name}" config contains values that look like API secrets in fields: ${suspiciousKeys.join(", ")}. Use the Credential Vault instead for secure storage.`,
      metadata: { suspiciousKeys },
    });
  }

  // Log activity
  await addFieldActivityEvent({
    type: "service_activated",
    actor: activateActor,
    taskId: null,
    serviceId: service.id,
    summary: `Service activated: ${service.name}`,
    details: `Service "${service.name}" configured and activated. Auth type: ${service.authType}, Risk level: ${service.riskLevel}.`,
    metadata: {
      authType: service.authType,
      riskLevel: service.riskLevel,
      configKeys: Object.keys(config),
    },
  });

  const warnings: string[] = suspiciousKeys.length > 0
    ? [`Possible API key detected in config fields: ${suspiciousKeys.join(", ")}. Consider using the Credential Vault for secure storage.`]
    : [];

  return NextResponse.json({ ...service, warnings });
}
