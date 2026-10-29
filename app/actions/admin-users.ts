"use server";
import { revalidatePath } from "next/cache";
import { requireUserAdministrator } from "@/modules/identity/infrastructure/server-auth";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
import { UuidIdentifierGenerator } from "@/modules/shared/domain/identifier";
import { UserAdministrationService } from "@/modules/admin/application/user-administration-service";
import type { UserRole, UserStatus } from "@/modules/identity/domain/user";

function service(){return new UserAdministrationService(getDatabase(),new UuidIdentifierGenerator())}
export async function changeUserStatusAction(formData:FormData){const actor=await requireUserAdministrator(),targetId=String(formData.get("userId"));service().changeStatus({actorId:actor.id,targetId,status:String(formData.get("status")) as UserStatus,reason:String(formData.get("reason")??"")});revalidatePath(`/admin/users/${targetId}`);revalidatePath("/admin/users")}
export async function changeUserRoleAction(formData:FormData){const actor=await requireUserAdministrator(),targetId=String(formData.get("userId"));service().changeRole({actorId:actor.id,targetId,role:String(formData.get("role")) as UserRole});revalidatePath(`/admin/users/${targetId}`);revalidatePath("/admin/users")}
export async function revokeUserSessionsAction(formData:FormData){const actor=await requireUserAdministrator(),targetId=String(formData.get("userId"));service().revokeSessions(actor.id,targetId);revalidatePath(`/admin/users/${targetId}`)}
export async function addUserNoteAction(formData:FormData){const actor=await requireUserAdministrator(),targetId=String(formData.get("userId"));service().addNote({actorId:actor.id,targetId,body:String(formData.get("body")??"")});revalidatePath(`/admin/users/${targetId}`)}
