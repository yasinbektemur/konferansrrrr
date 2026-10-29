import Link from 'next/link';
import {requireUser} from '@/modules/identity/infrastructure/server-auth';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ResearchWorkspace} from '@/modules/research/research-workspace';
import {ActionForm} from '@/components/action-form';
export default async function Notifications({searchParams}:{searchParams:Promise<{trash?:string}>}){
 const u=await requireUser(),trash=(await searchParams).trash==='1',items=new ResearchWorkspace(getDatabase()).notifications(u.id,trash);
 return <div className="page"><header className="page-heading"><div><h1>{trash?'Kaldırılan bildirimler':'Bildirim merkezi'}</h1><p className="lede">Okunma durumunu değiştir, listeden kaldır veya geri al.</p></div><Link className="btn" href={trash?'/hesabim/bildirimler':'?trash=1'}>{trash?'Bildirimler':'Kaldırılanlar'}</Link></header><section className="desk-panel">{items.map(n=><article className="desk-row" key={n.id}><div><h3>{n.title}</h3><p>{n.body}</p><small>{n.created_at}</small></div><div>{!trash&&<ActionForm label={n.read_at?'Okunmadı işaretle':'Okundu işaretle'}><input type="hidden" name="command" value={n.read_at?'unread':'read'}/><input type="hidden" name="id" value={n.id}/></ActionForm>}<ActionForm label={trash?'Geri al':'Listeden kaldır'}><input type="hidden" name="command" value={trash?'restore-notification':'hide-notification'}/><input type="hidden" name="id" value={n.id}/></ActionForm></div></article>)}{!items.length&&<div className="guided-empty"><h2>Bu listede bildirim yok</h2><p>Yeni güncellemeleri bildirim merkezinden takip edebilirsin.</p></div>}</section></div>;
}
