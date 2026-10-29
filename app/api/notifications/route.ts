import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/infrastructure/server-auth";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
export async function GET(){const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Yetkisiz"},{status:401});const data=getDatabase().prepare("SELECT id,kind,title,body,opportunity_id,read_at,created_at FROM notifications WHERE user_id=? AND hidden_at IS NULL ORDER BY created_at DESC,id DESC LIMIT 50").all(user.id);return NextResponse.json({data})}
