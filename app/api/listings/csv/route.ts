import {getCurrentUser} from '@/modules/identity/infrastructure/server-auth';
import {getListingTransfer} from '@/modules/transfers/infrastructure/server-transfer';
import {getRecruitment} from '@/modules/marketplace/infrastructure/server-recruitment';
import {listingTemplate} from '@/modules/transfers/domain/listing-csv';
import {DomainError} from '@/modules/shared/domain/errors';
export async function GET(request:Request){
 const user=await getCurrentUser();if(!user)return Response.json({error:'Giriş yapın.'},{status:401});
 const query=new URL(request.url).searchParams,scope=query.get('kind')==='institution'?{kind:'institution' as const,institutionId:query.get('institutionId')??''}:{kind:'catalog' as const};
 try{
  if(scope.kind==='institution')getRecruitment().institutionForManager(user.id,scope.institutionId!);
  else if(!['owner','admin','curator'].includes(user.role))return Response.json({error:'Bu işlem için yetkiniz yok.'},{status:403});
  const template=query.get('template')==='1',body=template?listingTemplate():getListingTransfer(scope).export(user.id);
  return new Response(body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="radar-${template?'sablon':'ilanlar'}.csv"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){return Response.json({error:error instanceof DomainError?error.message:'Dosya hazırlanamadı.'},{status:error instanceof DomainError?403:500});}
}
