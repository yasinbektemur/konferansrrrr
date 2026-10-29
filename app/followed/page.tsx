import { OpportunityExplorer } from '@/components/opportunity-explorer';
import { requireUser } from '@/modules/identity/infrastructure/server-auth';
import { getDatabase } from '@/modules/shared/infrastructure/database/server-database';
import { SqliteOpportunityRepository } from '@/modules/opportunities/infrastructure/sqlite-opportunity-repository';
import { OpportunityFacets } from '@/modules/opportunities/infrastructure/opportunity-facets';
import { catalogQuery, type CatalogParams } from '@/modules/opportunities/presentation/search-params';
export default async function FollowedPage({searchParams}:{searchParams:Promise<CatalogParams>}){
  const user=await requireUser(),params=await searchParams,db=getDatabase(),result=new SqliteOpportunityRepository(db).search({...catalogQuery(params),followedByUserId:user.id,viewerUserId:user.id});
  return <main className="page"><header className="page-heading"><div><h1>Takip edilen fırsatlar</h1><p className="lede">Seçtiğin çağrıları filtrele, son tarihlerini incele ve hazırlığını planla.</p></div></header><OpportunityExplorer result={{...result,items:result.items.map(x=>({props:x.props}))}} facets={new OpportunityFacets(db).getAll()} params={params} authenticated basePath="/followed"/></main>;
}
