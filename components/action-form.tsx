"use client";
import {useActionState} from 'react';
import {researchAction} from '@/app/actions/research';
export function ActionForm({children,label='Kaydet',confirm:confirmation}:{children:React.ReactNode;label?:string;confirm?:string}){const [state,action,pending]=useActionState(researchAction,{});return <form className="form-stack" action={action} onSubmit={e=>{if(confirmation&&!confirm(confirmation))e.preventDefault();}}>{children}{state.error&&<p role="alert" className="error">{state.error}</p>}{state.success&&<p className="notice" role="status">{state.success}</p>}<button className="btn primary" disabled={pending}>{pending?'Kaydediliyor…':label}</button></form>}
