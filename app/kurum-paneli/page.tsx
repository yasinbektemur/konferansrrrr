import Link from 'next/link';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/modules/identity/infrastructure/server-auth';
import { getRecruitment } from '@/modules/marketplace/infrastructure/server-recruitment';
import { institutionLabels } from '@/modules/marketplace/domain/models';
import { MarketplaceForm } from '@/components/marketplace-form';

export default async function InstitutionWorkspace(){
  const user=await requireUser(),institutions=getRecruitment().mine(user.id);
  return <main className="page institution-workspace"><header className="page-heading"><div><h1>Kurum çalışma alanı</h1><p className="lede">Çağrılarını yayımla, araştırmacılarla buluş ve başvuruları değerlendir.</p></div><Link className="btn" href="/kurumlar">Kurumları keşfet</Link></header>
    <div className="workspace-split"><section id="institution-list"><h2>Yönettiğin kurumlar</h2>{institutions.length?institutions.map(i=><Link href={`/kurum-paneli/${i.id}`} className="institution-item" key={i.id}><span className="institution-monogram">{i.name.slice(0,2).toLocaleUpperCase('tr')}</span><div><h3>{i.name}</h3><p>{institutionLabels[i.status]} · {i.listingCount} açık ilan</p></div><span>Yönet</span></Link>):<div className="empty"><h3>İlk kurumunu ekle</h3><p>Kurum adına ilan yayımlamak için profili oluştur. Kurum kaydı yönetici incelemesinden sonra açılır.</p></div>}
    <div className="panel workflow-note"><h3>Yayına giden yol</h3><ol><li>Kurum kimliğini ve resmî adresini paylaş.</li><li>Kurum onayını beklerken ilan taslağını hazırla.</li><li>İlanı yayın incelemesine gönder.</li><li>Gelen başvuruları kendi çalışma alanında değerlendir.</li></ol></div></section>
    <section id="institution-create" className="panel"><h2>Kurum profili oluştur</h2><MarketplaceForm label="Kurum oluştur"><input type="hidden" name="command" value="institution"/><input type="hidden" name="key" value={randomUUID()}/>
      <label>Kurum adı<input className="field" name="name" required minLength={3} maxLength={160}/></label><label>Ülke kodu<input className="field" name="countryCode" defaultValue="TR" required pattern="[A-Z]{2}" maxLength={2}/></label>
      <label>Resmî internet sitesi<input className="field" name="websiteUrl" type="url" placeholder="https://" required/></label><label>Kurum hakkında<textarea className="field" name="description" minLength={20} maxLength={4000} rows={5} required/></label>
    </MarketplaceForm></section></div>
  </main>;
}
