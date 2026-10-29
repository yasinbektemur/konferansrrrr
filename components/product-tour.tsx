'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import type {PublicUser} from '@/modules/identity/application/authentication-service';
import {BookIcon,CloseIcon} from './icons';
type Step={title:string;body:string;route:string;target:string;tip:string};
const basic:Step[]=[
 {title:'Konferans Radar’a hoş geldin',body:'Araştırma fırsatlarını bulabilir, hazırlığını planlayabilir ve kurumlara başvuru gönderebilirsin. Birlikte ana ekranları gezelim.',route:'/',target:'.portal-hero',tip:'Tur boyunca hiçbir kayıt veya başvuru oluşturulmaz.'},
 {title:'Sana uygun çağrıyı bul',body:'Başlık, kurum veya araştırma alanı ara. Tür, konu, ülke ve son tarih filtrelerini birlikte kullan; liste, kart veya kompakt görünümü seç.',route:'/',target:'.portal-results-layout',tip:'Fırsat detayını açmadan önce resmî kaynak ve son tarih bilgilerini kontrol et.'},
 {title:'İlgilendiğin fırsatı takip et',body:'İlanın yer imi düğmesi fırsatı takip listene ekler. Takip ettiğin çağrıların tarihlerini kişisel takviminde görebilirsin.',route:'/followed',target:'.workspace-body',tip:'Örnek katalog etiketli kayıtların tarihlerini resmî siteden doğrula.'},
 {title:'Fırsatlarını koleksiyonlarla düzenle',body:'Proje veya araştırma konusuna göre koleksiyon oluştur. Fırsat detayından ilgili koleksiyona ekleyerek alternatiflerini bir arada tut.',route:'/hesabim/koleksiyonlar',target:'.workspace-body',tip:'Koleksiyonların sana aittir; başka kullanıcıların özel listelerini göremezsin.'},
 {title:'Başvuru hazırlığını planla',body:'İlan detayında kişisel hazırlık alanı oluştur. Hazırlık panosunda aşamayı ilerlet, görevler ekle ve tamamlanan işleri işaretle.',route:'/panel',target:'.workspace-body',tip:'Hazırlık alanı oluşturmak kuruma başvuru göndermez.'},
 {title:'Gerçek başvurunu gönder ve izle',body:'Platform başvurusu açık bir ilanda mesajını yazıp paylaşım onayını ver. Gönderdiğin başvuruların durumunu burada görürsün. Dış başvurular ilanın resmî adresinde tamamlanır.',route:'/hesabim/basvurular',target:'.workspace-body',tip:'Kurumun değerlendirme sonucu bildirimlerine de düşer.'},
 {title:'Kurum adına ilan yayımla',body:'Kurum profili oluştur, ardından ilan taslağı hazırla. Kurum onaylandıktan sonra ilanını incelemeye gönder. Kurum ekranındaki CSV içe / dışa aktarma bağlantısıyla çok sayıda taslak ekleyebilirsin.',route:'/kurum-paneli',target:'.workspace-body',tip:'Kurum yöneticisi olmak platform yönetim yetkisi vermez.'},
 {title:'Bildirimlerini ve hesabını yönet',body:'Başvuru sonuçlarını burada takip et. Soldaki menüden profilini, bildirim tercihlerini ve görevlerini açabilirsin.',route:'/hesabim/bildirimler',target:'.workspace-body',tip:'Üst menüyle vitrinden panele geçebilir, hesap menüsünden çıkış yapabilirsin.'}
];
const adminSteps:Step[]=[
 {title:'İçerik ve sayfaları yönet',body:'CMS’de rehber, site sayfası veya ana sayfa içeriği oluştur. Metin, bağlantı ve soru-cevap bölümlerini sırala; önizle ve yayımla. İstersen menüye veya footer’a ekle.',route:'/admin/content',target:'.cms-management-grid',tip:'Sürüm geçmişinden eski içeriği yeni bir sürüm olarak geri yükleyebilirsin.'},
 {title:'CSV ile ilan aktar',body:'Şablonu indirip kendi çağrılarınla doldur. Dosyayı kontrol et; hatalarda satır ve çözüm bilgisine bak. Önizlemeyi inceledikten sonra yayınlamayı onayla.',route:'/admin/import',target:'.transfer-workbench',tip:'Hatalı dosyada hiçbir ilan kaydedilmez. Aynı referanslı aynı kayıtlar atlanır.'}
];
const managementStep:Step={title:'Kullanıcı ve kurum işlemlerini denetle',body:'Kullanıcı dosyalarından hesap durumunu ve işlem geçmişini incele. Kurum ve yayın onayı menüsünden yeni kurumsal ilanları değerlendir.',route:'/admin/users',target:'.admin-content',tip:'Denetim kayıtları yönetim işlemlerinin geçmişini gösterir.'};
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('radar-tour',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('radar-tour',callback);};}
export function ProductTour({user}:{user:PublicUser}){
 const key=`radar-tour:v1:${user.id}`,router=useRouter(),path=usePathname(),dialog=useRef<HTMLDialogElement>(null),[index,setIndex]=useState(0),[active,setActive]=useState(false);
 const saved=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(key)??'new';}catch{return 'unavailable';}},()=>'loading');
 const privileged=['owner','admin','curator'].includes(user.role),manager=['owner','admin'].includes(user.role);
 const steps=[...basic,...(manager?[managementStep]:[]),...(privileged?adminSteps:[]),{title:'Hazırsın',body:'Kendi çalışma masandan devam edebilirsin. Yardıma ihtiyaç duyduğunda ekranın köşesindeki Kullanım sihirbazı düğmesi turu yeniden açar.',route:'/hesabim',target:'.research-intro',tip:'Turu istediğin zaman atlayabilir veya tekrar başlatabilirsin.'}],step=steps[index];
 function finish(status:'completed'|'skipped'){try{localStorage.setItem(key,status);window.dispatchEvent(new Event('radar-tour'));}catch{}setActive(false);dialog.current?.close();}
 function go(next:number){setIndex(next);router.push(steps[next].route,{scroll:true});}
 function start(){setIndex(0);setActive(true);dialog.current?.showModal();router.push('/');}
 useEffect(()=>{if(!active||path!==step.route)return;const target=document.querySelector(step.target);target?.classList.add('tour-highlight');target?.scrollIntoView({block:'start',behavior:'instant'});return()=>target?.classList.remove('tour-highlight');},[active,path,step.route,step.target]);
 return <>
  {saved==='new'&&!active&&<aside className="tour-invitation" aria-label="Yeni kullanıcı rehberi"><b>Nereden başlayacağını birlikte keşfedelim.</b><div><button onClick={start}>Adım adım tanı</button><button onClick={()=>finish('skipped')}>Turu atla</button></div></aside>}
  <button className="tour-launcher" onClick={start} aria-label="Kullanım sihirbazını aç"><BookIcon/><span>Kullanım sihirbazı</span></button>
  <dialog ref={dialog} className="product-tour" aria-labelledby="tour-title" aria-describedby="tour-body" onCancel={()=>finish('skipped')}>
   <header><span>Adım {index+1} / {steps.length}</span><button aria-label="Turu kapat" onClick={()=>finish('skipped')}><CloseIcon/></button></header>
   <progress value={index+1} max={steps.length} aria-label="Tur ilerlemesi"/>
   <h2 id="tour-title">{step.title}</h2><p id="tour-body">{step.body}</p><p className="tour-tip">{step.tip}</p>
   <footer><button className="tour-skip" onClick={()=>finish('skipped')}>Hepsini atla</button><div><button className="btn" disabled={index===0} onClick={()=>go(index-1)}>Geri</button>{index===steps.length-1?<button className="btn primary" onClick={()=>finish('completed')}>Turu tamamla</button>:<button className="btn primary" onClick={()=>go(index+1)}>İleri</button>}</div></footer>
  </dialog>
 </>;
}
