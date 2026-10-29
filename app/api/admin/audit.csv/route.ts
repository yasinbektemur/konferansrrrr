import { NextResponse } from "next/server";
import { requireUserAdministrator } from "@/modules/identity/infrastructure/server-auth";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
const csv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
export async function GET(){await requireUserAdministrator();const rows=getDatabase().prepare(`SELECT a.created_at,a.action,u.email actor_email,a.entity_type,a.entity_id,a.metadata_json FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 10000`).all() as Array<Record<string,unknown>>;const header=["created_at","action","actor_email","entity_type","entity_id","metadata_json"],body=[header.join(","),...rows.map(row=>header.map(key=>csv(row[key])).join(","))].join("\r\n");return new NextResponse(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="radar-audit-${new Date().toISOString().slice(0,10)}.csv"`}})}
