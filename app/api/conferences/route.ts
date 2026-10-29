import { NextRequest,NextResponse } from "next/server";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
import { SqliteOpportunityRepository } from "@/modules/opportunities/infrastructure/sqlite-opportunity-repository";
export async function GET(request:NextRequest){const page=Math.max(1,Number(request.nextUrl.searchParams.get("page")??1)),pageSize=Math.min(50,Math.max(1,Number(request.nextUrl.searchParams.get("pageSize")??20)));const result=new SqliteOpportunityRepository(getDatabase()).search({search:request.nextUrl.searchParams.get("q")??undefined,page,pageSize});return NextResponse.json({...result,items:result.items.map(x=>x.props)},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}})}
