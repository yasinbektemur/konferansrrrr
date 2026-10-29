import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRecruitment } from '@/modules/marketplace/infrastructure/server-recruitment';
export default async function InstitutionProfile({params}:{params:Promise<{id:string}>}){
  const {id}=await params,service=getRecruitment();let institution;try{institution=service.institution(id);}catch{notFound();}
  const listings=service.publicListings(id);
  return <main className="page"><Link href="/kurumlar">← Tüm kurumlar</Link><header className="institution-profile"><span className="institution-monogram">{institution.name.slice(0,2).toLocaleUpperCase('tr')}</span><div><small>{institution.countryCode} · Kurum onaylı</small><h1>{institution.name}</h1><a className="btn" href={institution.websiteUrl} target="_blank" rel="noreferrer">Resmî internet sitesi</a></div></header>
    <div className="workspace-split"><section><h2>Açık çağrılar</h2>{listings.length?listings.map(l=><article className="institution-item" key={l.id}><div><small>{l.applyMode==='platform'?'Radar üzerinden başvuru':'Resmî siteden başvuru'}</small><h3><Link href={`/conference/${l.id}`}>{l.title}</Link></h3><p>{l.summary}</p><b>Son tarih: {l.deadline}</b></div><Link className="btn" href={`/conference/${l.id}`}>İncele</Link></article>):<div className="empty"><h3>Şu anda açık çağrı yok</h3><Link href="/">Diğer fırsatları keşfet</Link></div>}</section><aside className="panel"><h2>Kurum hakkında</h2><p className="candidate-message">{institution.description}</p><p className="muted">Kurum onayı platform yöneticisinin incelemesini gösterir. Başvurmadan önce resmî çağrı ve uygunluk koşullarını da kontrol et.</p></aside></div>
  </main>;
}
