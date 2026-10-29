# Konferans Radar

Konferans, çalıştay, hibe, burs, ödül ve özel sayı çağrılarını ilişkisel olarak yöneten araştırma fırsatı platformu. Uygulama Next.js 16, React 19 ve Node.js’in yerleşik SQLite motoruyla çalışır; Supabase veya ayrı SQLite kurulumu gerektirmez.

## Neler var?

- Çok ölçütlü arama, filtre, sıralama, sayfalama ve hızlı inceleme modalı
- CSV şablonu, sütun kuralları, hata raporu, içerik düzeltme, önizleme ve idempotent toplu ilan aktarımı
- Role göre adım adım kullanım sihirbazı; atlama ve yeniden başlatma
- İlan/CMS/koleksiyon/görev/hazırlık çöp kutuları, geri alma ve başvuru kararını yeniden değerlendirme
- İkonlu açılır menüler, konu/ülke keşfi, kurumlar, rehberler ve kapsamlı footer içeren portal vitrini
- Ayrı yönetici/araştırmacı/kurum panellerinde açılır sidebar grupları ve mobil menü
- Bölümlü CMS: site sayfaları, ana sayfa içeriği, rehberler, önizleme, menü/footer görünürlüğü ve sürüm geri yükleme
- Kurum dizini, kurum profili, kurum yayıncı paneli ve yönetici onay kuyruğu
- İlan taslağı/düzenleme/yayınlama/kapatma; gerçek başvuru gönderimi ve kurumun aday değerlendirmesi
- Araştırmacı gönderim geçmişi, geri çekme ve uygulama içi karar bildirimleri
- Fırsat ↔ kaynak ↔ konum ↔ konu ↔ son tarih ilişkileri ve foreign key bütünlüğü
- Kalıcı kullanıcı kaydı, güvenli parola hash’i ve sunucu oturumu
- Takip listesi, son tarih takvimi, coğrafi görünüm ve başvuru Kanban’ı
- Rol tabanlı yönetim paneli; yayınlama, arşivleme, audit log ve outbox
- İdempotent yönetim komutları, optimistic locking, yapılandırılmış log ve cache tablosu
- Sürüm kontrollü otomatik migration, seed, bütünlük kontrolü ve yedekleme
- JSON API, RSS ve sağlık kontrolü

## Hızlı başlangıç

```bash
bash install.sh
bash run.sh dev
```

Windows için `install.ps1` ve tüm senaryolar için ayrıntılı yönergeler [KURULUM.md](KURULUM.md) dosyasındadır. İlk kaydolan kullanıcı sistem sahibi olur.

Node.js 24+ kullanılır. Uygun Node yoksa kurucu resmi dağıtımı SHA-256 denetimiyle proje içine kurar. `run.sh` / `run.ps1` bu çalışma zamanını kullanır. Bakım komutları da uygulamayla aynı ortam dosyalarını okur.

## Mimari

Güncel tamamlanan akışlar ve kalan kapsam [ürün durumu belgesinde](docs/PRODUCT-STATUS.md) tutulur. Kişisel çalışma masası `/hesabim`, CMS editörü `/admin/content`, yayınlanmış rehberler `/rehber` adresindedir.

CMS site sayfaları `/sayfa/[adres]`, site kimliği/iletişim/footer ayarları `/admin/site`, sistem durumu `/admin/system` üzerinden yönetilir. CMS değişiklikleri SQLite'a kaydedilir; başlangıç rehberleri sonraki kurulumlarda üzerine yazılmaz.

Kurum çalışma alanı `/kurum-paneli`, kurum dizini `/kurumlar`, yönetici onayları `/admin/institutions`, gönderilmiş başvurular `/hesabim/basvurular` adresindedir. `/panel` kişisel hazırlık panosudur; burada aşama değiştirmek kuruma başvuru göndermez. Kurumlar platformdan veya resmî siteden başvuru seçeneğini ilan bazında belirler. Kurum/ilan onayı otomatik değildir; yönetici incelemesi gerekir.

Kod `modules/` altında kimlik, fırsatlar, takip, başvurular, yönetim ve paylaşılan altyapı sınırlarına ayrılmış modüler monolittir. Server Component’ler okuma modellerine doğrudan erişir; Server Action’lar kimlik/yetki kontrolünden sonra uygulama servislerini çağırır. Dış istemciler yalnızca `app/api/` BFF uçlarını kullanır.

Test ve kalite komutları:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run db:doctor
```

`data/conferences.json` başlangıç verisidir. Tarihler örnek olabilir; kritik karar öncesinde her kaydın resmî bağlantısını doğrulayın.
