'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {PublicUser} from '@/modules/identity/application/authentication-service';
import type {ContentPage} from '@/modules/content/content-service';
import type {SiteSettings} from '@/modules/content/domain/page-content';
import {logoutAction} from '@/app/actions/auth';
import {RadarIcon,UserIcon,BellIcon,BuildingIcon,ArrowIcon,BookIcon} from './icons';
import {PortalNavigation} from './portal-navigation';
import {PortalFooter} from './portal-footer';
import {WorkspaceSidebar,type WorkspaceKind} from './workspace-sidebar';
export function SurfaceShell({user,children,pages,settings}:{user:PublicUser|null;children:React.ReactNode;pages:ContentPage[];settings:SiteSettings}){
 const path=usePathname(),admin=path.startsWith('/admin'),institution=path.startsWith('/kurum-paneli'),personal=['/hesabim','/panel','/followed','/settings'].some(p=>path.startsWith(p));
 const privileged=user&&['owner','admin','curator'].includes(user.role),workspace=user&&(admin||personal||institution),kind:WorkspaceKind=admin?'admin':institution?'institution':'personal';
 const switcher=<nav className="surface-switch" aria-label="Çalışma alanı"><Link aria-current={!workspace?'page':undefined} href="/">Keşfet</Link>{user&&<><Link aria-current={personal?'page':undefined} href="/hesabim">Araştırmacı panelim</Link><Link aria-current={institution?'page':undefined} href="/kurum-paneli">Kurum panelim</Link></>}{privileged&&<Link aria-current={admin?'page':undefined} href="/admin">Yönetim</Link>}</nav>;
 const account=<details className="account-menu"><summary aria-label={user?`${user.displayName}, hesap menüsü`:'Giriş / Kayıt'}><UserIcon aria-hidden="true"/><span>{user?.displayName??'Giriş / Kayıt'}</span></summary><div>{user?<><b className="account-title">Hesabım</b><Link href="/hesabim">Çalışma masam</Link><Link href="/hesabim/profil">Profil ve hesap</Link><Link href="/kurum-paneli">Kurum çalışma alanı</Link>{privileged&&<Link href="/admin">Yönetim merkezi</Link>}<form action={logoutAction}><button>Çıkış yap</button></form></>:<><Link href="/login">Giriş yap veya kayıt ol</Link><Link href="/sayfa/platformu-kullanma">Nasıl çalışır?</Link></>}</div></details>;
 if(workspace)return <div className={`surface workspace-layout workspace-${kind} ${admin?'surface-admin':'surface-personal'}`}><WorkspaceSidebar kind={kind} user={user} brandName={settings.brandName}/><div className="workspace-stage"><header className="workspace-toolbar">{switcher}<div className="workspace-toolbar-actions"><Link className="toolbar-notifications" aria-label="Bildirim merkezini aç" href="/hesabim/bildirimler"><BellIcon/></Link>{account}</div></header><div className="workspace-body">{children}</div></div></div>;
 return <div className="surface surface-public"><div className="portal-utility"><span>{settings.tagline}</span><div><Link href="/sayfa/platformu-kullanma"><BookIcon/>Nasıl çalışır?</Link><Link href="/kurum-paneli"><BuildingIcon/>Kurumlar için yayın</Link></div></div><header className="portal-header"><Link className="portal-brand" href="/"><RadarIcon/><b>{settings.brandName}</b></Link><PortalNavigation pages={pages}/><div className="portal-account-actions">{account}<Link className="btn primary publish-button" href="/kurum-paneli">İlan yayımla <ArrowIcon/></Link></div></header>{user&&<div className="portal-contextbar">{switcher}<Link href="/hesabim/bildirimler"><BellIcon/>Bildirimlerim</Link></div>}{children}<PortalFooter settings={settings} pages={pages}/></div>;
}
