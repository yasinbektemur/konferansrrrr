import { NextResponse } from "next/server";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
export function GET(){const db=getDatabase();const integrity=String(Object.values(db.prepare("PRAGMA quick_check").get() as Record<string,unknown>)[0]);const migration=db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as {version:number};return NextResponse.json({status:integrity==="ok"?"healthy":"degraded",database:"sqlite",integrity,migration:migration.version},{status:integrity==="ok"?200:503})}
