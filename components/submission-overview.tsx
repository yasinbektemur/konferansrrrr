import Link from 'next/link';
import { requireUserAdministrator } from '@/modules/identity/infrastructure/server-auth';
import { getRecruitment } from '@/modules/marketplace/infrastructure/server-recruitment';
import { submissionLabels } from '@/modules/marketplace/domain/models';

export function SubmissionOverview({userId}:{userId:string}){
  const result=getRecruitment().mySubmissionPage(userId);
  return <section className="desk-panel submission-overview"><header><h2>Kuruma gönderdiğim başvurular ({result.total})</h2><Link href="/hesabim/basvurular">Tüm gönderimler</Link></header>
    {result.items.length?result.items.slice(0,3).map(s=><Link className="desk-row" href="/hesabim/basvurular" key={s.id}><div><b>{s.title}</b><small>{s.institutionName}</small></div><span className={`status-pill status-${s.status}`}>{submissionLabels[s.status]}</span></Link>):<p className="muted">Henüz bir kuruma başvuru göndermedin. Hazırlık panosundaki çalışmaların yalnızca sana aittir.</p>}
  </section>;
}
export async function AdministrativeSubmissionHistory({userId,page}:{userId:string;page:number}){
  const admin=await requireUserAdministrator(),result=getRecruitment().administrativeSubmissions(admin.id,userId,page);
  return <section className="admin-card"><h2>Kuruma gönderilen başvurular ({result.total})</h2>{result.items.length?<table className="admin-table"><thead><tr><th>İlan</th><th>Kurum</th><th>Durum</th><th>Gönderim</th></tr></thead><tbody>{result.items.map(s=><tr key={s.id}><td>{s.title}</td><td>{s.institutionName}</td><td>{submissionLabels[s.status]}</td><td>{s.createdAt}</td></tr>)}</tbody></table>:<p>Gönderilmiş başvuru yok.</p>}
    {result.pages>1&&<nav className="pagination" aria-label="Kullanıcının gönderim sayfaları">{result.page>1&&<Link href={`?submissionPage=${result.page-1}`}>Önceki</Link>}<span>{result.page} / {result.pages}</span>{result.page<result.pages&&<Link href={`?submissionPage=${result.page+1}`}>Sonraki</Link>}</nav>}
  </section>;
}
