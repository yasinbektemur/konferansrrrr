'use client';
import {useActionState} from 'react';
import {saveSiteSettings,restoreContent} from '@/app/actions/content';
import type {SiteSettings} from '@/modules/content/domain/page-content';
export function SiteSettingsForm({settings}:{settings:SiteSettings}){
 const [state,action,pending]=useActionState(saveSiteSettings,{});
 return <form action={action} className="form-stack"><input type="hidden" name="version" value={state.version??settings.version}/><label>Site adı<input className="admin-field" name="brandName" defaultValue={settings.brandName} required maxLength={40}/></label><label>Kısa açıklama<input className="admin-field" name="tagline" defaultValue={settings.tagline} required maxLength={120}/></label><label>Footer açıklaması<textarea className="admin-field" name="footerText" defaultValue={settings.footerText} required maxLength={500}/></label><label>İletişim e-postası<input className="admin-field" type="email" name="contactEmail" defaultValue={settings.contactEmail}/></label>{state.error&&<p className="error" role="alert">{state.error}</p>}{state.success&&<p className="notice" role="status">{state.success}</p>}<button className="admin-button primary" disabled={pending}>{pending?'Kaydediliyor…':'Site ayarlarını kaydet'}</button></form>;
}
export function RestoreContentForm({slug,version,sourceVersion}:{slug:string;version:number;sourceVersion:number}){
 const [state,action,pending]=useActionState(restoreContent,{});
 return <form action={action}><input type="hidden" name="slug" value={slug}/><input type="hidden" name="version" value={version}/><input type="hidden" name="sourceVersion" value={sourceVersion}/>{state.error&&<p className="error" role="alert">{state.error}</p>}<button className="admin-button" disabled={pending}>Bu sürümü geri yükle</button></form>;
}
