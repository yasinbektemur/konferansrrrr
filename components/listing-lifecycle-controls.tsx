'use client';
import {useActionState} from 'react';
import {listingLifecycleAction} from '@/app/actions/listing-lifecycle';
export function ListingLifecycleControls({id,version,status,deleted=false}:{id:string;version:number;status:string;deleted?:boolean}){
 const [state,action,pending]=useActionState(listingLifecycleAction,{});
 return <div className="lifecycle-controls"><form action={action} onSubmit={e=>{const command=(e.nativeEvent as SubmitEvent).submitter?.getAttribute('value');if(command==='trash'&&!confirm('İlan yayından kaldırılıp çöp kutusuna taşınacak. İlişkili başvurular korunur. Devam edilsin mi?'))e.preventDefault();}}><input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={version}/>{deleted?<button className="btn" name="command" value="restore" disabled={pending}>Çöpten geri al</button>:<><button className="btn" name="command" value={status==='archived'?'unarchive':'archive'} disabled={pending}>{status==='archived'?'Arşivden çıkar':'Arşivle'}</button><button className="btn" name="command" value="trash" disabled={pending}>Çöpe taşı</button></>}</form>{state.error&&<p className="error" role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}</div>;
}
