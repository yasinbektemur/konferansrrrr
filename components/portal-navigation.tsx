'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {BookIcon,BuildingIcon,CalendarIcon,ChevronIcon,GlobeIcon,LayersIcon,SearchIcon,BriefcaseIcon,ArrowIcon} from './icons';
import type {ContentPage} from '@/modules/content/content-service';
const types=[['conference','Konferanslar','Bilimsel toplantı ve kongreler'],['workshop','Çalıştaylar','Uygulamalı öğrenme ve buluşmalar'],['grant','Hibe ve fonlar','Araştırma projelerine destek'],['fellowship','Burs ve programlar','Yeni araştırma deneyimleri'],['special_issue','Yayın çağrıları','Özel sayılar ve yayın fırsatları'],['competition','Yarışma ve ödüller','Fikirlerini görünür kıl']];
export function PortalNavigation({pages}:{pages:ContentPage[]}){
 const nav=useRef<HTMLElement>(null);
 useEffect(()=>{function outside(event:PointerEvent){if(!nav.current?.contains(event.target as Node))nav.current?.querySelectorAll('details[open]').forEach(d=>d.removeAttribute('open'));}document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
 function close(){nav.current?.querySelectorAll('details[open]').forEach(d=>d.removeAttribute('open'));}
 return <nav className="portal-nav" aria-label="Ana gezinme" ref={nav} onKeyDown={e=>{if(e.key==='Escape'){const summary=(e.target as HTMLElement).closest('details')?.querySelector('summary');close();summary?.focus();}}}>
  <details name="portal-navigation" className="portal-menu"><summary><SearchIcon aria-hidden="true"/>Fırsatlar<ChevronIcon className="menu-chevron"/></summary><div className="portal-megamenu"><div className="mega-heading"><b>Araştırmanın bir sonraki adımı</b><Link href="/" onClick={close}>Tüm fırsatlar <ArrowIcon/></Link></div><div className="mega-grid">{types.map(([type,title,body])=><Link key={type} href={`/?type=${type}`} onClick={close}><BriefcaseIcon aria-hidden="true"/><span><b>{title}</b><small>{body}</small></span></Link>)}</div></div></details>
  <Link href="/kurumlar"><BuildingIcon aria-hidden="true"/>Kurumlar</Link>
  <details name="portal-navigation" className="portal-menu"><summary><LayersIcon aria-hidden="true"/>Keşif araçları<ChevronIcon className="menu-chevron"/></summary><div className="portal-megamenu narrow"><Link href="/takvim" onClick={close}><CalendarIcon/><span><b>Çağrı takvimi</b><small>Yaklaşan son tarihleri incele</small></span></Link><Link href="/harita" onClick={close}><GlobeIcon/><span><b>Konuma göre keşfet</b><small>Şehir ve ülke dizini</small></span></Link><Link href="/hesabim/koleksiyonlar" onClick={close}><LayersIcon/><span><b>Koleksiyonlar</b><small>Fırsatlarını konulara göre grupla</small></span></Link></div></details>
  <details name="portal-navigation" className="portal-menu"><summary><BookIcon aria-hidden="true"/>Rehber ve platform<ChevronIcon className="menu-chevron"/></summary><div className="portal-megamenu narrow"><Link href="/rehber" onClick={close}><BookIcon/><span><b>Araştırmacı rehberi</b><small>Başvuru ve kaynak kontrolü</small></span></Link>{pages.filter(p=>p.showInNavigation).map(p=><Link href={`${p.kind==='guide'?'/rehber':'/sayfa'}/${p.slug}`} key={p.slug} onClick={close}><ArrowIcon/><span><b>{p.title}</b><small>{p.seoDescription||p.body.slice(0,70)}</small></span></Link>)}<Link href="/hakkinda" onClick={close}><GlobeIcon/><b>Platform hakkında</b></Link></div></details>
 </nav>;
}
