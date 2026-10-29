'use client';
import {useActionState} from 'react';
import {updateOpportunityAction} from '@/app/actions/admin';
import {AdminOpportunityFields} from './admin-opportunity-fields';
export function AdminListingEditForm({values}:{values:Record<string,unknown>}){
 const [state,action,pending]=useActionState(updateOpportunityAction,{});
 return <form className="form-stack" action={action}><input type="hidden" name="id" value={String(values.id)}/><input type="hidden" name="version" value={state.version??Number(values.version)}/><AdminOpportunityFields values={values}/>{state.error&&<p role="alert" className="error">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}<button className="admin-button primary" disabled={pending}>Değişiklikleri kaydet</button></form>;
}
