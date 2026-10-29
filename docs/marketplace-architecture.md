# Kurumsal yayın ve başvuru modülü

`modules/marketplace` kurumun yayın hesabı ile aday başvuru sürecinin sınırıdır. Başvuru hazırlığı `modules/applications` içinde kalır; bu modüldeki görev ve aşamalar kuruma gönderim anlamına gelmez.

| Katman | Sorumluluk |
| --- | --- |
| `domain/models.ts` | Kurum, ilan, gönderim, durum ve okuma modelleri |
| `application/recruitment-service.ts` | Aktif hesap kontrolü, kurum kapsamı, yönetici onayı, geçiş kuralları, idempotency ve işlem sınırı |
| `application/ports.ts` | Depolama ve katalog yayınlama sözleşmeleri |
| `infrastructure/sqlite-recruitment-repository.ts` | SQLite kurum/gönderim kayıtları, SQL sayfalaması, audit ve uygulama içi bildirim |
| `opportunities/infrastructure/institutional-catalog.ts` | Katalog modülünün kurumsal yayın adapter'ı; opportunity/organizer/deadline değişiklikleri |
| `infrastructure/server-recruitment.ts` | Aynı SQLite bağlantısıyla servislerin kurulması |

Yazma işlemleri tek SQLite transaction içinde yürür. Gönderim + audit + bildirim aynı anda kaydedilir; bildirim kaydı başarısızsa gönderim de geri alınır. Kurum oluşturma ve ilk ilan kaydında kararlı UUID + normalize edilmiş komut hash'i tekrarları ayırır. Araştırmacı/ilan unique anahtarı ikinci başvuruyu engeller. Güncellemeler sürümle denetlenir; eski ekranın kararı yeni kaydı ezmez.

Başvuru durumu: `submitted → reviewing/accepted/rejected`, `reviewing → accepted/rejected`. Araştırmacı `submitted/reviewing/accepted → withdrawn` yapabilir. Sonuçlanmış veya geri çekilmiş kayda kurum yeniden karar veremez. Başvuru için kurumun onaylı, ilanın yayımlanmış, son tarihin geçmemiş ve kanalın platform olması gerekir. Kurum üyeleri kendi ilanına başvuramaz.

Kurum profili `pending/verified/rejected`; ilan `draft → review → published/rejected`, düzeltme sonrası yeniden taslak/inceleme, son olarak `archived`. Yayındaki içerik doğrudan düzenlenmez; kapatma desteklenir. Üyelik modeli manager/reviewer rollerini saklar; davet ve ek üye yönetimi henüz arayüzde yoktur.

Başvuru mesajı, isim ve e-posta snapshot'ı yalnızca başvuran ve ilgili kurum üyeleri tarafından okunur. Platform yöneticisinin hesap dosyası görünümü yalnızca ilan/kurum/durum/tarih projeksiyonunu alır. Audit metadata başvuru mesajını içermez.

Facet cache TTL 300 saniyedir; kurumsal ilan yayını/kapatılması ve kurum onayı değişiminde namespace silinir. Kullanıcıya özel başvuru listeleri paylaşılan cache'e alınmaz. `catalog-visibility.ts` herkese açık katalog projeksiyonlarının ortak kurum onay filtresidir.

Gerçek SQLite testleri sahiplik, rol yükseltme reddi, tekrarlar, eski sürüm, kapalı/süresi dolmuş/dış başvurulu ilanlar, geri çekme, atomik geri alma, onay iptalinde cache ve kapsamlı sayfalamayı kapsar. Tarayıcı testi üç ayrı hesapla form akışını doğrular. Harici e-posta teslimatı veya dosya depolama yapılmaz.
