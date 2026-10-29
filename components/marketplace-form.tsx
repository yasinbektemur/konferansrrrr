'use client';
import { useActionState, useRef } from 'react';
import { marketplaceAction } from '@/app/actions/marketplace';

export function MarketplaceForm({children,label='Kaydet',confirm,className='form-stack'}:{children:React.ReactNode;label?:string;confirm?:string;className?:string}){
  const [state,action,pending]=useActionState(marketplaceAction,{});
  return <form className={className} action={action} onSubmit={event=>{if(confirm&&!window.confirm(confirm))event.preventDefault();}}>
    {children}{state.error&&<p role="alert" className="error">{state.error}</p>}{state.success&&<p role="status" className="notice">{state.success}</p>}
    <button className="btn primary" disabled={pending}>{pending?'İşleniyor…':label}</button>
  </form>;
}
export function ApplicationDialog({id,title,institutionName}:{id:string;title:string;institutionName:string}){
  const dialog=useRef<HTMLDialogElement>(null);
  return <><button className="btn primary" onClick={()=>dialog.current?.showModal()}>Kuruma başvur</button>
    <dialog ref={dialog} className="market-dialog" aria-labelledby="application-dialog-title" onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}>
      <div className="dialog-heading"><div><small>{institutionName}</small><h2 id="application-dialog-title">Başvurunu gönder</h2></div><button type="button" className="btn" onClick={()=>dialog.current?.close()} aria-label="Başvuru penceresini kapat">Kapat</button></div>
      <p>{title}</p><MarketplaceForm label="Başvuruyu gönder"><input type="hidden" name="command" value="submit"/><input type="hidden" name="id" value={id}/>
        <label>Başvuru mesajın<textarea className="field" name="message" rows={7} minLength={30} maxLength={6000} required placeholder="Araştırma alanını, ilgili deneyimini ve bu programa neden başvurduğunu anlat."/></label>
        <label className="consent"><input type="checkbox" name="consent" required/><span>Adımın, e-posta adresimin ve bu mesajın {institutionName} yetkilileriyle paylaşılmasını onaylıyorum.</span></label>
        <p className="muted">Gönderim sonrası durumunu “Gönderdiğim başvurular” ekranından takip edebilir, başvurunu geri çekebilirsin. Dosya ve makale gönderimi bu forma dahil değildir.</p>
      </MarketplaceForm>
    </dialog></>;
}
