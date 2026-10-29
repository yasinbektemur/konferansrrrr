"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/modules/identity/infrastructure/server-auth";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
import { UuidIdentifierGenerator } from "@/modules/shared/domain/identifier";
import { OpportunityAdminService } from "@/modules/admin/application/opportunity-admin-service";
export async function updateOpportunityAction(_state:{error?:string;success?:string;version?:number},form:FormData):Promise<{error?:string;success?:string;version?:number}>{const user=await requireAdmin();try{const version=new OpportunityAdminService(getDatabase(),new UuidIdentifierGenerator()).update(String(form.get('id')),Object.fromEntries(form),user.id,Number(form.get('version')));revalidatePath('/','layout');return {version,success:'İlan güncellendi.'};}catch(error){return {error:error instanceof Error?error.message:'İlan güncellenemedi.'};}}
export async function createOpportunityAction(formData:FormData){const user=await requireAdmin();const service=new OpportunityAdminService(getDatabase(),new UuidIdentifierGenerator());service.create({title:String(formData.get("title")),type:String(formData.get("type")) as "conference",summary:String(formData.get("summary")),description:String(formData.get("description")),officialUrl:String(formData.get("officialUrl")),deadline:String(formData.get("deadline")),deadlineLabel:String(formData.get("deadlineLabel")),confidenceScore:Number(formData.get("confidenceScore"))},user.id,String(formData.get("idempotencyKey")));revalidatePath("/");redirect("/admin?created=1")}
