'use client';
import {useActionState,useState} from 'react';
import {saveContent} from '@/app/actions/content';
import type {ContentPage} from '@/modules/content/content-service';
import {ContentSections} from './content-sections';
import {PageBlocksEditor} from './page-blocks-editor';
export function ContentEditor({page,initialKind='guide'}:{page?:ContentPage;initialKind?:ContentPage['kind']}){
  const [state,action,pending]=useActionState(saveContent,{}),[preview,setPreview]=useState(false);
  const [body,setBody]=useState(page?.body??''),[title,setTitle]=useState(page?.title??''),[blocks,setBlocks]=useState(page?.blocks??[]);
  const [kind,setKind]=useState(page?.kind??initialKind),[slug,setSlug]=useState(page?.slug??(initialKind==='home'?'ana-sayfa':''));
  const version=page?.version??0;
  return <form action={action} className="form-stack cms-editor"><input type="hidden" name="version" value={version}/><input type="hidden" name="blocks" value={JSON.stringify(blocks)}/>
    <div className="form-columns"><label>İçerik türü<select className="admin-field" name="kind" value={kind} onChange={e=>{const value=e.target.value as ContentPage['kind'];setKind(value);if(value==='home')setSlug('ana-sayfa');}}><option value="guide">Araştırmacı rehberi</option><option value="page">Bağımsız site sayfası</option><option value="home">Ana sayfa içeriği</option></select></label><label>Sayfa adresi<input className="admin-field" name="slug" value={slug} onChange={e=>setSlug(e.target.value)} readOnly={version>0||kind==='home'} pattern="[a-z0-9-]{2,80}" required placeholder="arastirma-merkezi"/></label></div>
    <label>Başlık<input className="admin-field" name="title" value={title} onChange={e=>setTitle(e.target.value)} required minLength={3} maxLength={180}/></label>
    <label>İçerik<textarea className="admin-field" name="body" value={body} onChange={e=>setBody(e.target.value)} required minLength={5} maxLength={30000} rows={6}/></label>
    <label>Arama motoru açıklaması<textarea className="admin-field" name="seoDescription" defaultValue={page?.seoDescription} maxLength={300} rows={2}/></label>
    <PageBlocksEditor blocks={blocks} onChange={setBlocks}/>
    <div className="editor-toolbar"><button type="button" className="admin-button" onClick={()=>setPreview(!preview)} aria-expanded={preview}>{preview?'Önizlemeyi kapat':'Önizleme'}</button><span>{body.length} karakter · {blocks.length} bölüm</span></div>
    {preview&&<article className="content-preview"><h1>{title}</h1><p>{body}</p><ContentSections blocks={blocks}/></article>}
    <div className="form-columns"><label>Yayın durumu<select className="admin-field" name="status" defaultValue={page?.status??'draft'}><option value="draft">Taslak</option><option value="published">Yayında</option><option value="archived">Arşiv</option></select></label><fieldset className="cms-visibility"><legend>Sayfa bağlantıları</legend><label><input type="checkbox" name="showInNavigation" defaultChecked={page?.showInNavigation} disabled={kind==='home'}/> Üst menüde göster</label><label><input type="checkbox" name="showInFooter" defaultChecked={page?.showInFooter} disabled={kind==='home'}/> Footer’da göster</label></fieldset></div>
    {state.error&&<p role="alert" className="error">{state.error}</p>}
    <button className="admin-button primary" disabled={pending}>{pending?'Kaydediliyor…':'İçeriği kaydet'}</button>
  </form>;
}
