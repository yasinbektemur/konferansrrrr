import { randomUUID } from 'node:crypto';
import type { Listing } from '@/modules/marketplace/domain/models';
import { MarketplaceForm } from './marketplace-form';

export function ListingEditor({institutionId,listing}:{institutionId:string;listing?:Listing}){
  return <MarketplaceForm label="Taslağı kaydet"><input type="hidden" name="command" value="listing"/><input type="hidden" name="id" value={listing?.id??randomUUID()}/><input type="hidden" name="institutionId" value={institutionId}/><input type="hidden" name="version" value={listing?.version??0}/>
    <label>İlan başlığı<input className="field" name="title" defaultValue={listing?.title} minLength={8} maxLength={180} required placeholder="Örn. Biyomedikal araştırma bursu"/></label>
    <div className="form-columns"><label>Fırsat türü<select className="field" name="type" defaultValue={listing?.type??'fellowship'}><option value="conference">Konferans</option><option value="workshop">Çalıştay</option><option value="grant">Hibe</option><option value="fellowship">Burs / araştırma programı</option><option value="competition">Yarışma</option><option value="award">Ödül</option><option value="fair">Fuar</option><option value="special_issue">Özel sayı</option></select></label>
    <label>Katılım<select className="field" name="attendanceMode" defaultValue={listing?.attendanceMode??'online'}><option value="online">Çevrim içi</option><option value="onsite">Yerinde</option><option value="hybrid">Hibrit</option><option value="not_applicable">Konum bağımsız</option></select></label></div>
    <label>Kısa özet<textarea className="field" name="summary" defaultValue={listing?.summary} minLength={20} maxLength={400} rows={2} required/></label>
    <label>Çağrı ve uygunluk koşulları<textarea className="field" name="description" defaultValue={listing?.description} minLength={40} maxLength={12000} rows={8} required placeholder="Programın kapsamı, kimlerin başvurabileceği, destekler ve değerlendirme süreci."/></label>
    <div className="form-columns"><label>Son başvuru tarihi (UTC gün sonu)<input className="field" type="date" name="deadline" defaultValue={listing?.deadline} required/></label>
    <label>Başvuru kanalı<select className="field" name="applyMode" defaultValue={listing?.applyMode??'platform'}><option value="platform">Radar üzerinden başvuru al</option><option value="external">Resmî siteye yönlendir</option></select></label></div>
    <label>Resmî çağrı / başvuru adresi<input className="field" type="url" name="officialUrl" defaultValue={listing?.officialUrl} placeholder="https://" required/></label>
    <p className="muted">Taslaklar yalnızca kurumunuzda görünür. Kaydettikten sonra yayın incelemesine gönderebilirsiniz.</p>
  </MarketplaceForm>;
}
