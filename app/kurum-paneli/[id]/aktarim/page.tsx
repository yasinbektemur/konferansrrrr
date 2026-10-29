import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireUser} from '@/modules/identity/infrastructure/server-auth';
import {getRecruitment} from '@/modules/marketplace/infrastructure/server-recruitment';
import {ListingTransferWorkbench} from '@/components/listing-transfer-workbench';
export default async function InstitutionImport({params}:{params:Promise<{id:string}>}){
 const user=await requireUser(),{id}=await params;let institution;
 try{institution=getRecruitment().institutionForManager(user.id,id);}catch{notFound();}
 return <main className="page"><Link href={`/kurum-paneli/${id}`}>Kurum ilanlarına dön</Link><header className="page-heading"><div><h1>İlan içe / dışa aktarma</h1><p>{institution.name} için CSV ile ilan taslağı oluştur.</p></div></header><ListingTransferWorkbench scope={{kind:'institution',institutionId:id}} returnHref={`/kurum-paneli/${id}`}/></main>;
}
