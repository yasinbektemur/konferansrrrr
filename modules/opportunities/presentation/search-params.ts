import type { OpportunityQuery } from '../application/opportunity-repository';
import { opportunityTypes } from '../domain/opportunity';
export type CatalogParams=Record<string,string|string[]|undefined>;
export function values(value:string|string[]|undefined){return value===undefined?[]:Array.isArray(value)?value:[value];}
export function one(value:string|string[]|undefined){return values(value)[0]??'';}
export function catalogQuery(params:CatalogParams):OpportunityQuery{
  const sort=one(params.sort),mode=one(params.mode),days=Number(one(params.days));
  return {search:one(params.q).slice(0,200),types:values(params.type).filter((type):type is typeof opportunityTypes[number]=>opportunityTypes.includes(type as typeof opportunityTypes[number])),topics:values(params.topic),countries:values(params.country),
    sort:['deadline','start_date','newest','confidence'].includes(sort)?sort as OpportunityQuery['sort']:'deadline',
    attendanceModes:['online','onsite','hybrid','not_applicable'].includes(mode)?[mode as 'online']:undefined,
    deadlineWithinDays:[7,30,90].includes(days)?days:undefined,page:Math.max(1,Math.floor(Number(one(params.page))||1)),pageSize:10};
}
