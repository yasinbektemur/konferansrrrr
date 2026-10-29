"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/identity/infrastructure/server-auth";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
import { UuidIdentifierGenerator } from "@/modules/shared/domain/identifier";
import { FollowService } from "@/modules/tracking/application/follow-service";
import { ApplicationService, type ApplicationStage } from "@/modules/applications/application/application-service";
export async function toggleFollowAction(formData: FormData) { const user = await requireUser(); const id = String(formData.get("opportunityId") ?? ""); new FollowService(getDatabase(), new UuidIdentifierGenerator()).toggle(user.id, id); revalidatePath("/"); revalidatePath("/followed"); revalidatePath(`/conference/${id}`); }
export async function startApplicationAction(formData: FormData) { const user = await requireUser(); const result = new ApplicationService(getDatabase(), new UuidIdentifierGenerator()).start({ userId: user.id, opportunityId: String(formData.get("opportunityId") ?? ""), internalDeadline: String(formData.get("internalDeadline") ?? "") || null }); redirect(`/panel?application=${result.id}`); }
export async function moveApplicationAction(formData: FormData) { const user = await requireUser(); new ApplicationService(getDatabase(), new UuidIdentifierGenerator()).move({ applicationId: String(formData.get("applicationId") ?? ""), userId: user.id, stage: String(formData.get("stage")) as ApplicationStage, expectedVersion: Number(formData.get("version")) }); revalidatePath("/panel"); }
