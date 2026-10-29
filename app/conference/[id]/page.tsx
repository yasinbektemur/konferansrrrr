import Link from 'next/link';
import { notFound } from 'next/navigation';
import { startApplicationAction, toggleFollowAction } from '@/app/actions/opportunities';
import { BookmarkIcon, ExternalIcon } from '@/components/icons';
import { ApplicationDialog } from '@/components/marketplace-form';
import { getCurrentUser } from '@/modules/identity/infrastructure/server-auth';
import { getDatabase } from '@/modules/shared/infrastructure/database/server-database';
import { SqliteOpportunityRepository } from '@/modules/opportunities/infrastructure/sqlite-opportunity-repository';
import { getRecruitment } from '@/modules/marketplace/infrastructure/server-recruitment';

export default async function OpportunityDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params,user=await getCurrentUser();
  const opportunity=new SqliteOpportunityRepository(getDatabase()).findById(id,user?.id);if(!opportunity)notFound();
  const o=opportunity.props,listing=getRecruitment().publicListing(id);
  const sent=user?getRecruitment().mySubmissions(user.id).find(s=>s.opportunityId===id):null;
  const open=listing&&listing.deadline>=new Date().toISOString().slice(0,10);
  return <main className="page"><Link href="/">← Fırsatlara dön</Link><header className="page-heading" style={{marginTop:20}}><div><p className="op-label">{label(o.type)} / {o.organizerName??o.publisher??o.sourceName}</p><h1 style={{maxWidth:900,lineHeight:1.2}}>{o.title}</h1><p className="lede">{o.summary}</p></div></header>
    {o.sampleData&&<p className="notice">Bu kayıt başlangıç kataloğundan bir örnektir. Etkinlik ve başvuru tarihlerini resmî kaynaktan doğrula.</p>}
    <div className="grid-3" style={{marginBottom:18}}><div className="stat"><span>Etkinlik / program</span><strong style={{fontSize:16}}>{o.startDate?[formatDate(o.startDate),o.endDate&&formatDate(o.endDate)].filter(Boolean).join(' — '):'Tarih açıklanmadı'}</strong></div><div className="stat"><span>Konum ve katılım</span><strong style={{fontSize:16}}>{[o.city,o.country].filter(Boolean).join(', ')||label(o.attendanceMode)}</strong></div><div className="stat"><span>Kaynak</span><strong style={{fontSize:16}}>{o.sourceName}</strong></div></div>
    <div className="workspace-split"><article className="panel"><h2>Çağrı ve uygunluk koşulları</h2><p className="candidate-message">{o.description}</p>{o.institutionId&&<Link className="btn" href={`/kurumlar/${o.institutionId}`}>Kurum profilini incele</Link>}{!!(o.topics.length+o.indexes.length)&&<><h3 style={{marginTop:25}}>Alanlar ve indeksler</h3><div>{[...o.topics,...o.indexes].map(x=><span className="tag" key={x}>{x}</span>)}</div></>}</article>
    <aside className="panel"><h2>Başvuru ve son tarihler</h2>{o.deadlines.length?o.deadlines.map(d=><div className="desk-row" key={d.id}><span>{d.label}{d.isEstimated&&' (tahmini)'}</span><b>{formatDate(d.dueAt)}</b></div>):<p className="muted">Kayıtlı son tarih yok.</p>}
      <div className="form-stack" style={{marginTop:20}}>
        {listing?.applyMode==='platform'?sent?<><p className="notice">Bu ilan için başvurun kayıtlı.</p><Link className="btn primary" href="/hesabim/basvurular">Başvurumu görüntüle</Link></>:open?user?<ApplicationDialog id={id} title={o.title} institutionName={listing.institutionName}/>:<Link className="btn primary" href="/login">Başvurmak için giriş yap</Link>:<p className="notice">Bu ilanın başvuru süresi doldu.</p>:<p className="muted">Başvuru resmî sitede yapılır. Burada hazırlık alanı oluşturmak kuruma başvuru göndermez.</p>}
        <a className="btn dark" href={o.officialUrl} target="_blank" rel="noreferrer">Resmî çağrıyı aç <ExternalIcon/></a>
        {user?<form action={toggleFollowAction}><input type="hidden" name="opportunityId" value={o.id}/><button className="btn" style={{width:'100%'}}><BookmarkIcon/>{o.followed?'Takipten çıkar':'Takibe al'}</button></form>:<Link className="btn" href="/login">Giriş yap ve takip et</Link>}
        {user&&<details className="collection-add"><summary>Kişisel hazırlık alanı oluştur</summary><form className="form-stack" action={startApplicationAction}><input type="hidden" name="opportunityId" value={o.id}/><p className="muted">Görevlerini ve iç takvimini planla. Bu alan kurumla paylaşılmaz.</p><label>İç son tarih (isteğe bağlı)<input className="field" type="date" name="internalDeadline"/></label><button className="btn">Başvuru alanı oluştur</button></form></details>}
      </div></aside></div>
  </main>;
}
const labels:Record<string,string>={conference:'Konferans',workshop:'Çalıştay',grant:'Hibe',fellowship:'Burs',competition:'Yarışma',fair:'Fuar',special_issue:'Özel sayı',award:'Ödül',online:'Çevrim içi',onsite:'Yerinde',hybrid:'Hibrit',not_applicable:'Konum bağımsız'};
function label(x:string){return labels[x]??x;}
function formatDate(x:string){return new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(x));}
