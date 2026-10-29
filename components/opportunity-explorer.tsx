import Link from 'next/link';
import { daysUntilDeadline, type OpportunityProps } from '@/modules/opportunities/domain/opportunity';
import type { Paginated } from '@/modules/opportunities/application/opportunity-repository';
import { one, values, type CatalogParams } from '@/modules/opportunities/presentation/search-params';
import { toggleFollowAction } from '@/app/actions/opportunities';
import { BookmarkIcon, SearchIcon } from './icons';
import { OpportunityPreview } from './opportunity-preview';
import { ExplorerControls } from './explorer-controls';
type Facet={name:string;count:number;slug?:string};
type Props={result:Paginated<{props:OpportunityProps}>;facets:{types:Facet[];topics:Facet[];countries:Facet[]};params:CatalogParams;authenticated:boolean;basePath?:string};
const labels:Record<string,string>={conference:'Konferans',workshop:'Çalıştay',grant:'Hibe',fellowship:'Burs',competition:'Yarışma',fair:'Fuar',special_issue:'Özel sayı',award:'Ödül',online:'Çevrim içi',onsite:'Yerinde',hybrid:'Hibrit',not_applicable:'Konum bağımsız'};
export function OpportunityExplorer({result,facets,params,authenticated,basePath='/'}:Props){
  return <ExplorerControls><div className="explorer"><aside className="filters"><form action={basePath}>
    <input type="hidden" name="q" value={one(params.q)}/><input type="hidden" name="sort" value={one(params.sort)}/>
    <div className="filter-title"><strong>Aramanı daralt</strong><Link href={basePath}>Temizle</Link></div>
    <FilterGroup title="Fırsat türü" name="type" selected={values(params.type)} items={facets.types.map(x=>({label:labels[x.name]??x.name,value:x.name,count:x.count}))}/>
    <FilterGroup title="Araştırma alanı" name="topic" selected={values(params.topic)} items={facets.topics.slice(0,8).map(x=>({label:x.name,value:x.slug??x.name,count:x.count}))}/>
    <FilterGroup title="Ülke" name="country" selected={values(params.country)} items={facets.countries.slice(0,7).map(x=>({label:x.name,value:x.name,count:x.count}))}/>
    <label className="filter-select">Katılım<select className="field" name="mode" defaultValue={one(params.mode)}><option value="">Tümü</option><option value="online">Çevrim içi</option><option value="hybrid">Hibrit</option><option value="onsite">Yerinde</option><option value="not_applicable">Konum bağımsız</option></select></label>
    <label className="filter-select">Son başvuru<select className="field" name="days" defaultValue={one(params.days)}><option value="">Tüm tarihler</option><option value="7">Önümüzdeki 7 gün</option><option value="30">Önümüzdeki 30 gün</option><option value="90">Önümüzdeki 90 gün</option></select></label>
    <button className="btn filter-apply">Filtrele</button></form></aside>
    <section className="results"><form className="search-strip" action={basePath}>
      {Object.entries(params).filter(([key])=>!['q','sort','page'].includes(key)).flatMap(([key,value])=>values(value).map(v=><input key={`${key}-${v}`} type="hidden" name={key} value={v}/>))}
      <div className="search-box"><SearchIcon/><input className="field" name="q" aria-label="Fırsat ara" defaultValue={one(params.q)} placeholder="Başlık, kurum veya anahtar kelime…"/></div><select className="field" name="sort" aria-label="Fırsat sıralaması" defaultValue={one(params.sort)||'deadline'}><option value="deadline">Son tarihe göre</option><option value="start_date">Etkinlik tarihine göre</option><option value="newest">Yeni eklenenler</option><option value="confidence">Güven puanı</option></select><button className="btn primary">Ara</button>
    </form><div className="active-filters">{Object.entries(params).filter(([key])=>!['page','sort'].includes(key)).flatMap(([key,value])=>values(value).filter(Boolean).map(v=>{const next={...params,[key]:values(value).filter(item=>item!==v)};return <Link key={`${key}-${v}`} href={queryHref(next,1,basePath)} aria-label={`${labels[v]??v} filtresini kaldır`}>{labels[v]??v} <span aria-hidden="true">×</span></Link>;}))}</div>
    <div className="result-meta"><span><strong>{result.total}</strong> fırsat</span><span>Sayfa {result.page} / {result.totalPages}</span></div>
    {result.items.length?<div className="opportunity-list">{result.items.map(({props:o})=><OpportunityRow key={o.id} opportunity={o} authenticated={authenticated}/>)}</div>:<div className="empty"><h2>Bu kesişimde sonuç yok</h2><p>Filtrelerden birini kaldırıp aramayı genişletmeyi dene.</p><Link className="btn" href={basePath}>Filtreleri temizle</Link></div>}
    <Pagination current={result.page} total={result.totalPages} params={params} basePath={basePath}/></section>
  </div></ExplorerControls>;
}
function OpportunityRow({opportunity:o,authenticated}:{opportunity:OpportunityProps;authenticated:boolean}){
  const deadline=[...o.deadlines].filter(d=>d.dueAt.slice(0,10)>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.dueAt.localeCompare(b.dueAt))[0];
  return <article className="op-row"><span className={`type-rule ${o.type}`}/><div className="op-main"><div className="op-label">{labels[o.type]} <span> / </span>{o.institutionId?<Link href={`/kurumlar/${o.institutionId}`}>{o.organizerName}</Link>:o.publisher??o.sourceName}</div><h3><Link href={`/conference/${o.id}`}>{o.title}</Link></h3><p>{o.summary}</p><div className="op-tags"><span>{o.city??o.country??labels[o.attendanceMode]}</span>{o.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}<span className={o.applyMode==='platform'?'direct-apply':''}>{o.sampleData?'Örnek katalog':o.applyMode==='platform'?'Radar üzerinden başvuru':'Resmî siteden başvuru'}</span></div></div><div className={`op-cell deadline ${deadline&&daysLeft(deadline.dueAt)<=14?'urgent':''}`}>Son tarih<b>{deadline?new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(deadline.dueAt)):'Açıklanmadı'}</b>{deadline&&<small>{daysLeft(deadline.dueAt)} gün kaldı</small>}</div><div className="row-actions"><OpportunityPreview opportunity={o}/>{authenticated?<form action={toggleFollowAction}><input type="hidden" name="opportunityId" value={o.id}/><button className={`icon-btn ${o.followed?'active':''}`} aria-label={o.followed?'Takipten çıkar':'Takibe al'}><BookmarkIcon fill={o.followed?'currentColor':'none'}/></button></form>:<Link className="icon-btn" href="/login" aria-label="Giriş yap ve takip et"><BookmarkIcon/></Link>}</div></article>;
}
function FilterGroup({title,name,selected,items}:{title:string;name:string;selected:string[];items:Array<{label:string;value:string;count:number}>}){return <fieldset className="filter-group"><legend>{title}</legend>{items.map(item=><label className="check" key={item.value}><input type="checkbox" name={name} value={item.value} defaultChecked={selected.includes(item.value)}/>{item.label}<em>{item.count}</em></label>)}</fieldset>;}
function Pagination({current,total,params,basePath}:{current:number;total:number;params:CatalogParams;basePath:string}){
  if(total<=1)return null;
  const pages=Array.from(new Set([1,total,current-1,current,current+1])).filter(p=>p>=1&&p<=total).sort((a,b)=>a-b);
  return <nav className="pagination" aria-label="Fırsat sayfaları"><span>Sayfa {current} / {total}</span><div className="page-buttons">{pages.map((p,i)=><span key={p}>{i>0&&p-pages[i-1]>1&&'…'}<Link aria-current={p===current?'page':undefined} aria-label={`Sayfa ${p}`} className={p===current?'current':''} href={queryHref(params,p,basePath)}>{p}</Link></span>)}</div></nav>;
}
function queryHref(params:CatalogParams,page:number,basePath:string){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(k!=='page')values(v).filter(Boolean).forEach(x=>q.append(k,x));});q.set('page',String(page));return `${basePath}?${q}`;}
function daysLeft(value:string){return Math.max(0,daysUntilDeadline(value));}
