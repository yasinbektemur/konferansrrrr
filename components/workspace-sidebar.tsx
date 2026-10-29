'use client';
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import type {PublicUser} from '@/modules/identity/application/authentication-service';
import {logoutAction} from '@/app/actions/auth';
import {RadarIcon,SearchIcon,CalendarIcon,BriefcaseIcon,ShieldIcon,SettingsIcon,ChevronIcon,MenuIcon,CloseIcon,BuildingIcon,BookIcon,UserIcon,LayersIcon,ChartIcon,GlobeIcon} from './icons';
export type WorkspaceKind='admin'|'personal'|'institution';
type Icon=typeof RadarIcon;
type Group={id:string;label:string;icon:Icon;items:Array<[string,string]>};
function groupsFor(kind:WorkspaceKind,user:PublicUser):Group[]{
 const manager=['admin','owner'].includes(user.role);
 if(kind==='admin')return [
  {id:'overview',label:'Kontrol merkezi',icon:ChartIcon,items:[['Genel bakış','/admin']]},
  {id:'publishing',label:'Fırsat ve yayın yönetimi',icon:BriefcaseIcon,items:[['Fırsatlar','/admin/opportunities'],['CSV içe / dışa aktarma','/admin/import'],['Yeni fırsat oluştur','/admin/opportunities#create-listing'],...(manager?[['Kurum ve yayın onayı','/admin/institutions'] as [string,string]]:[])]},
  ...(manager?[{id:'people',label:'Kullanıcılar ve kurumlar',icon:UserIcon,items:[['Kullanıcılar','/admin/users'],['Askıdaki hesaplar','/admin/users?status=suspended'],['Yönetici hesapları','/admin/users?role=admin'],['Kurum dizini','/kurumlar']] as Array<[string,string]>}]:[]),
  {id:'content',label:'Site ve içerik',icon:BookIcon,items:[['İçerik stüdyosu','/admin/content'],['Yeni site sayfası','/admin/content?kind=page'],['Ana sayfa düzeni','/admin/content?edit=ana-sayfa&kind=home'],['Araştırmacı rehberleri','/admin/content?kind=guide'],...(manager?[['Site kimliği ve footer','/admin/site'] as [string,string]]:[])]},
  {id:'data',label:'Veri ve entegrasyon',icon:LayersIcon,items:[['Kaynaklar','/admin/sources'],['Moderasyon kuyruğu','/admin/sources#moderation'],['Çalışma geçmişi','/admin/sources#integration-runs']]},
  ...(manager?[{id:'audit',label:'Denetim ve sistem',icon:ShieldIcon,items:[['Denetim kayıtları','/admin/audit'],['Giriş hareketleri','/admin/audit?action=auth'],['Sistem durumu','/admin/system']] as Array<[string,string]>}]:[])
 ];
 if(kind==='institution')return [
  {id:'institution',label:'Kurum çalışma alanı',icon:BuildingIcon,items:[['Kurumlarım ve ilanlarım','/kurum-paneli'],['Yeni kurum oluştur','/kurum-paneli#institution-create']]},
  {id:'publishing',label:'Yayın ve başvurular',icon:BriefcaseIcon,items:[['İlan ve aday yönetimi','/kurum-paneli#institution-list'],['Yayın süreci rehberi','/sayfa/platformu-kullanma']]},
  {id:'discover',label:'Kurum ağı ve keşif',icon:GlobeIcon,items:[['Kurum dizini','/kurumlar'],['Fırsat vitrini','/'],['Çağrı takvimi','/takvim']]},
  {id:'account',label:'Hesap ve iletişim',icon:SettingsIcon,items:[['Profilim','/hesabim/profil'],['Bildirimler','/hesabim/bildirimler'],['Tercihler','/settings']]}
 ];
 return [
  {id:'desk',label:'Çalışma alanım',icon:RadarIcon,items:[['Çalışma masam','/hesabim'],['Görevlerim','/hesabim/gorevler']]},
  {id:'discover',label:'Keşif ve kayıtlarım',icon:SearchIcon,items:[['Takip listem','/followed'],['Koleksiyonlarım','/hesabim/koleksiyonlar'],['Yeni fırsat keşfet','/']]},
  {id:'applications',label:'Başvuru sürecim',icon:BriefcaseIcon,items:[['Gönderdiğim başvurular','/hesabim/basvurular'],['Hazırlık panom','/panel'],['Başvuru rehberi','/rehber/basvuruya-hazirlik']]},
  {id:'calendar',label:'Takvim ve bildirimler',icon:CalendarIcon,items:[['Takip ettiğim tarihler','/hesabim/takvim'],['Bildirimlerim','/hesabim/bildirimler'],['Tüm çağrı tarihleri','/takvim']]},
  {id:'account',label:'Profil ve hesap',icon:UserIcon,items:[['Araştırmacı profilim','/hesabim/profil'],['Bildirim tercihleri','/settings'],['Kurum çalışma alanım','/kurum-paneli']]}
 ];
}
export function WorkspaceSidebar({kind,user,brandName}:{kind:WorkspaceKind;user:PublicUser;brandName:string}){
 const path=usePathname(),query=useSearchParams(),groups=groupsFor(kind,user),[open,setOpen]=useState<Record<string,{expanded:boolean;route:string}>>({});const dialog=useRef<HTMLDialogElement>(null),aside=useRef<HTMLElement>(null),route=`${path}?${query.toString()}`;
 const matches=groups.flatMap(g=>g.items).filter(([,href])=>{if(href.includes('#'))return false;const [target,search]=href.split('?');if(target!==path)return false;return !search||[...new URLSearchParams(search)].every(([k,v])=>query.get(k)===v);}).sort((a,b)=>b[1].length-a[1].length);
 const active=matches[0]?.[1];
 function expanded(group:Group){const state=open[group.id];return !state||(group.items.some(([,href])=>href===active)&&state.route!==route)||state.expanded;}
 function revealActive(root:HTMLElement|null){const nav=root?.querySelector<HTMLElement>('.ws-groups'),link=nav?.querySelector<HTMLElement>('[aria-current="page"]');if(!nav||!link)return;const item=link.getBoundingClientRect(),bounds=nav.getBoundingClientRect();if(item.top<bounds.top||item.bottom>bounds.bottom)nav.scrollTop+=item.top-bounds.top-bounds.height/2;}
 useEffect(()=>{revealActive(aside.current);},[active,route]);
 const title=kind==='admin'?'Yönetim merkezi':kind==='institution'?'Kurum paneli':'Araştırmacı paneli';
 function body(mobile=false){return <><div className="ws-brand"><Link href="/"><RadarIcon aria-hidden="true"/><span><b>{brandName}</b><small>{title}</small></span></Link>{mobile&&<button className="ws-close" aria-label="Panel menüsünü kapat" onClick={()=>dialog.current?.close()}><CloseIcon/></button>}</div><div className="ws-role"><span>{user.displayName.slice(0,2).toLocaleUpperCase('tr')}</span><div><b>{user.displayName}</b><small>{kind==='admin'?(user.role==='owner'?'Superadmin':user.role==='curator'?'İçerik editörü':'Yönetici'):kind==='institution'?'Kurum çalışma alanı':'Kişisel çalışma alanı'}</small></div></div>
  <nav className="ws-groups" aria-label={`${title} menüsü`}>{groups.map(group=><section key={group.id} className="ws-group"><button type="button" aria-expanded={expanded(group)} aria-controls={`${mobile?'mobile':'desktop'}-${group.id}`} onClick={()=>setOpen({...open,[group.id]:{expanded:!expanded(group),route}})}><group.icon aria-hidden="true"/><span>{group.label}</span><ChevronIcon className="ws-chevron"/></button><div id={`${mobile?'mobile':'desktop'}-${group.id}`} hidden={!expanded(group)}>{group.items.map(([label,href])=><Link key={href} href={href} aria-current={href===active?'page':undefined} onClick={()=>dialog.current?.close()}><span className="ws-link-dot"/>{label}</Link>)}</div></section>)}</nav>
  <div className="ws-bottom"><Link href="/"><GlobeIcon aria-hidden="true"/> Fırsat vitrinine dön</Link><form action={logoutAction}><button><UserIcon aria-hidden="true"/> Çıkış yap</button></form><small>Konferans Radar · {title}</small></div></>;}
 return <><aside ref={aside} className="workspace-sidebar">{body()}</aside><button className="workspace-menu-toggle" aria-label="Panel menüsünü aç" onClick={()=>{dialog.current?.showModal();revealActive(dialog.current);}}><MenuIcon/></button><dialog ref={dialog} className="workspace-drawer" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}} aria-label={`${title} gezinme`}>{body(true)}</dialog></>;
}
