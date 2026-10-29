<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Konferans Radar: Kalıcı Proje Talimatları

Bu dosya, proje için kullanıcıyla birlikte alınmış ürün, mimari, kalite ve teslimat kararlarının ana kaynağıdır. Yeni geliştirmeler bu kararlarla uyumlu olmalıdır. Kısa vadeli kolaylık uğruna aşağıdaki ilkeler atlanmamalıdır.

Bu belge yaşayan bir karar kaydıdır. Kullanıcının daha yeni açık yönlendirmesi eski ürün/tasarım kararlarının önüne geçer; belge gerektiğinde güncellenir. Eski tasarım tercihleri kapsamı daraltmak veya kullanıcının istediği işi ertelemek için gerekçe değildir. Bir özelliğin burada hedef olarak yazılması onun uygulanmış olduğu anlamına gelmez; gerçek durum `docs/PRODUCT-STATUS.md` dosyasında tutulur.

## Mevcut çalışma aşaması

- Kullanıcı uygulamayı başlatmayı onayladı; proje aktif geliştirme aşamasındadır.
- 29 Ekim 2026: Akademik fırsatları LinkedIn/Kariyer benzeri kurum–ilan–başvuru ilişkisiyle genişletme kararı alındı. Araştırmacı, kurum yayıncısı ve platform yöneticisi ayrı çalışma alanları kullanır. Kurum üyeliği platform yöneticiliği vermez.
- Kurumsal ilan başvurusu ile kişisel hazırlık panosu ayrı kavramlardır; arayüz kuruma neyin iletildiğini açıkça belirtmelidir. Tam makale/peer-review sistemi hâlâ kapsam dışıdır.
- Araştırma; ürün kapsamı, rakipler, resmî veri kaynakları, entegrasyon koşulları, güvenlik, SQLite/VPS sınırları ve kullanıcı deneyimini kapsamalıdır.
- Uygulama başladığında mevcut prototip yama yığını olarak büyütülmemeli; aşağıdaki hedef mimariye kontrollü biçimde dönüştürülmelidir.
- Güncel kullanıcı onayı: önce bu belgeyi yeni kapsamla güncelle, ardından uygulama kodunu geliştir. Kariyer.net/LinkedIn örnekleri tam portal yapısı ve kullanım kapsamı için referanstır; akademik fırsat odağı korunur.

## Güncel portal ve panel beklentisi

- Kullanıcı tek uzun ilan listesi ve birkaç yan kutuyu yeterli bulmuyor. Doluluk; içerik çeşitliliği, farklı keşif yolları, kapsamlı navigasyon ve çalışan modüllerin görünür olmasıyla sağlanmalıdır.
- Vitrin, estetik header/arama alanı, ikonlu navbar ve açılır menüler, kategoriler, farklı çağrı grupları, araştırma alanları, kurum keşfi, rehber/duyuru bölümleri ve çok kolonlu kapsamlı footer içermelidir.
- Navbar ve footer ürünün bilgi mimarisinin parçalarıdır. Platform, araştırmacı ve kurum bağlantıları anlaşılır gruplara ayrılmalı; hesap, panel geçişi, bildirim ve çıkış kolay bulunmalıdır.
- Ana sayfa birkaç kart ve büyük boş alanlarla teslim edilmemelidir. İlk ekran ve sayfanın devamı birlikte tasarlanmalı; gerçek içerik, okunabilir tipografi ve responsive yoğunluk korunmalıdır. Örnek içerik açıkça etiketlenir; sahte kurum/sayı/aktivite oluşturulmaz.
- Superadmin (mevcut `owner` rolü) ve yetkili editörler CMS üzerinden sayfa oluşturabilmeli, içerik bölümleri ekleyip sıralayabilmeli, önizleyebilmeli ve yayımlayabilmelidir. Site sayfaları yalnızca tek metin kutulu rehber olarak düşünülmemelidir.
- CMS kapsamında ana sayfa içeriği, bağımsız sayfalar, rehberler, menüde gösterim, footer bağlantıları, sayfa açıklaması, taslak/yayın/arşiv ve sürüm geçmişi düşünülmelidir. Genel site ayarları yalnızca uygun yönetim rolüne açılmalıdır.
- Yönetici ve normal kullanıcı panellerinin ikisinde de ekran yüksekliğini kullanan, çok gruplu ve alt öğeli sidebar bulunmalıdır. Gruplar açılıp kapanabilmeli; aktif bölüm açık görünmeli; uzun menü bağımsız kayabilmeli; mobilde klavyeyle kullanılabilen drawer'a dönüşmelidir.
- Yönetici navigasyonu en az yayınlar, kullanıcılar/kurumlar, site/CMS, veri kaynakları, denetim ve sistem başlıklarını; araştırmacı navigasyonu çalışma alanı, keşif/kayıtlar, başvuru/hazırlık, takvim ve hesap başlıklarını düzenli biçimde sunmalıdır. Kurum paneli de aynı navigasyon kalitesini taşımalıdır.
- Her alt menü çalışan, yetki kontrollü ekran/işlem/filtreye gitmelidir. Uygulanmamış özellikler tamamlanmış gibi menüye eklenmez. Eksik modüller gerçek kapsam olarak ayrıca izlenir.

## Ürün vizyonu

Bu ürün basit bir konferans listeleme sitesi veya MVP değildir. Post-MVP olgunluğunda, biyomedikal AR-GE ekipleri için bir **araştırma fırsatları ve başvuru operasyon platformu** olarak tasarlanacaktır.

Platformun ana işi:

- Konferans, workshop, hibe, fellowship, fon, ödül, yarışma, fuar, özel sayı ve benzeri fırsatları keşfetmek.
- Fırsatların kaynak, tarih, uygunluk ve güvenilirliğini doğrulamak.
- Araştırmacı veya proje profiline göre anlamlı eşleştirme yapmak.
- Kişisel ve kurumsal deadline'ları takip etmek.
- Başvuru hazırlığını ekip, görev, dosya, not ve karar geçmişiyle yönetmek.
- Kullanıcıya doğru zamanda anlaşılır bildirimler göndermek.

Ürün, konferans organizatörleri için tam makale gönderim/peer-review sistemi olmamalıdır. Abstract submission, reviewer allocation ve konferans işletimi ancak ileride açıkça ayrı bir “Organizatör” ürünü/modülü olarak kararlaştırılırsa kapsama alınmalıdır.

## Kullanıcı deneyimi kapsamı

- Kullanım sihirbazı role göre temel ekranları ve işlem sırasını göstermeli; geri/ileri, tümünü atla ve yeniden başlat seçenekleri içermelidir. Turu atlamak temel işlevleri engellememelidir.
- Her yeni değişiklikte ileri işlemin karşılığı incelenir: düzenleme, arşivden çıkarma, silme/çöp kutusu, geri alma, iptal ve yeniden deneme. İlişkili başvuruların geçmişi silinmez; geri dönüşte yetki, sürüm, tarih ve yayın onayı tekrar denetlenir. Sonuç kararı değişikliği gerekçe, audit ve yeni bildirim üretir.
- CSV içe aktarma şablon, tüm zorunlu sütunların kuralları, satır/sütun bazlı hata ve düzeltme önerileri, ekran içinde düzeltme, önizleme ve açık son onay içermelidir. Hatalı dosya kısmen kaydedilmez. Aktarımlar kurum/aktör kapsamlı ve tekrar gönderime dayanıklı olmalıdır.
- Kurulumda Node 24+ tabanı kullanılır; eksik/eski sistem Node'u yerine resmi doğrulanmış runtime proje içine kurulabilir. Ortam dosyaları ve veri korunur, bakım komutları uygulamayla aynı ayarları okur. İşletim sisteminde gerçekten denenmemiş senaryolar denenmiş gibi belgelenmez.

Kullanıcı tarafında en az şu yetenekler düşünülmelidir:

- Gelişmiş metin ve Boolean arama.
- Çoklu facet filtreleme, sıralama, aktif filtre özeti ve filtre sıfırlama.
- Sunucu taraflı pagination; uygun yerlerde infinite scroll yerine açık ve erişilebilir sayfalama.
- Kart, kompakt liste, veri tablosu, takvim, harita ve başvuru pipeline görünümleri.
- Kayıtlı aramalar ve yeni/değişen eşleşme alarmları.
- Takip, favori, etiket ve kişisel/ekip koleksiyonları.
- Fırsat karşılaştırma ekranı.
- Kişisel deadline ile kurum içi deadline ayrımı.
- Uygunluk matrisi ve başvuru kontrol listesi.
- Proje özeti, anahtar kelimeler, araştırmacı profili ve yayınlara göre öneriler.
- Başvuru workspace'i: sorumlu, görev, yorum, dosya, durum, karar ve aktivite geçmişi.
- Takvim dışa aktarma ve mümkün olduğunda çift yönlü senkronizasyon.
- E-posta, Telegram ve uygulama içi bildirimler ile haftalık özet.
- Anlaşılır profil, oturum, ekip ve bildirim ayarları.
- Gerçek çalışan modal, dialog, drawer, popover, toast ve confirmation akışları.
- Her özellik için loading, skeleton, boş sonuç, hata, yetkisizlik, offline ve yeniden deneme durumları.
- Mobil, tablet, laptop ve geniş masaüstünde eksiksiz responsive davranış.
- Klavye navigasyonu, görünür focus, ekran okuyucu semantiği ve reduced-motion desteği.

## Yönetim paneli

Admin paneli kullanıcı arayüzünün yalnızca farklı renkteki kopyası olmamalıdır. Yoğun veri ve operasyon işlerine uygun, yetki korumalı profesyonel bir çalışma alanı olmalıdır.

Beklenen admin yetenekleri:

- Konferans, hibe ve diğer fırsatlarda CRUD, taslak, yayınlama, arşivleme ve geri yükleme.
- Scraper/API/import kaynaklarından gelen kayıtlar için moderasyon kuyruğu.
- Onay, ret, düzeltme, birleştirme ve toplu işlem akışları.
- Duplicate tespiti ve alan bazlı değişiklik karşılaştırması.
- Veri kaynağı, provenance, doğrulama tarihi, güven puanı ve doğrulama geçmişi.
- Deadline değişikliği ve bozuk kaynak/link tespiti.
- Kullanıcı, organizasyon, ekip, rol ve yetki yönetimi.
- Taksonomi, kategori, konu, ülke, kurum, yayıncı ve fon sağlayıcı yönetimi.
- Küratör listeleri, kurum içi fırsatlar, duyurular ve bültenler.
- Bildirim şablonları ve teslimat durumu.
- Entegrasyon, scraper, background job ve retry/dead-letter görünümü.
- Audit log, güvenlik olayları ve sistem sağlık ekranları.
- Kullanım, arama, takip ve başvuru dönüşüm analitiği.
- CSV/JSON içe-dışa aktarma ve güvenli toplu güncelleme.

## Frontend tasarım standardı

- Frontend yeniden tasarımında `frontend-design` skill'i kullanılmalıdır. Yerel kaynak mevcutsa önce `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md` tamamen okunmalıdır (`~`, geçerli kullanıcının ev dizinidir).
- Görsel kimlik akademik araştırma ve fırsat keşfine dayanmalıdır. “Radar / araştırma masası” önceki bir tasarım yönüdür; tek zorunlu görünüm değildir. Güncel hedef, özgün ve zengin bir fırsat portalı ile ayrı profesyonel çalışma panelleridir.
- Mevcut prototipteki her şeyi aynı yuvarlak karta bölme, her başlığa gereksiz uppercase eyebrow ekleme, dekoratif gradient, her öğede fade-up ve her hover'da yukarı kayma yaklaşımı devam ettirilmemelidir.
- Tipografi, renk, boşluk, yoğunluk, radius, border ve motion için önce küçük ve gerekçeli bir token sistemi tanımlanmalıdır.
- Tipografi, ikonlar, görseller ve bölüm çeşitliliğiyle hatırlanabilir bir kimlik oluşturulmalı; görsel tutarlılık içerik veya modül sayısını gereksiz azaltma gerekçesine dönüşmemelidir.
- Veri yoğunluğu gizlenmemeli; progressive disclosure, doğru tablo tasarımı, sabit kolonlar, detay drawer'ları ve responsive önceliklendirme ile yönetilmelidir.
- Metinler kullanıcı dilinde, kısa, aktif ve tutarlı olmalıdır. Teknik altyapı adları kullanıcı arayüzüne sızmamalıdır.
- Başarılı görünmek erişilebilirlikten, okunabilirlikten veya görev hızından daha önemli değildir.
- Uygulama sırasında gerçek viewport ekran görüntüleriyle görsel inceleme ve en az bir sadeleştirme/eleştiri turu yapılmalıdır.

## Hedef mimari: modüler monolit

Sistem dağıtık mikroservis yığını olarak değil, sınırları belirgin bir **modüler monolit** olarak kurulmalıdır. Modüller birbirlerinin tablolarına veya iç sınıflarına doğrudan erişmemelidir. İletişim açık application service, port veya domain event sözleşmeleriyle yapılmalıdır.

Önerilen modüller:

1. Identity & Access
2. Organizations & Teams
3. Researcher Profiles
4. Opportunity Catalog
5. Taxonomy & Eligibility
6. Sources & Ingestion
7. Moderation & Verification
8. Search & Saved Searches
9. Matching & Recommendations
10. Tracking & Collections
11. Application Workspace
12. Tasks & Collaboration
13. Notifications
14. Calendar Integrations
15. Administration
16. Audit & Analytics
17. System Operations

Her iş modülü gerektiği ölçüde şu katmanlara ayrılmalıdır:

```text
domain/
application/
infrastructure/
presentation/
```

Ortak kod yalnızca gerçekten modüller arası ve kararlıysa shared kernel'e alınmalıdır. `utils` klasörü kontrolsüz bir çöplüğe dönüşmemelidir.

## Kod tasarımı ve sürdürülebilirlik

- SOLID ilkeleri uygulanmalıdır.
- OOP; entity, value object, aggregate, policy, repository, application service ve domain service gibi davranış taşıyan kavramlarda kullanılmalıdır.
- Her tablo veya fonksiyon anlamsız biçimde class'a çevrilmemelidir; composition tercih edilmeli, kalıtım sınırlı tutulmalıdır.
- Domain katmanı Next.js, SQLite, HTTP, React veya sağlayıcı SDK'larına bağımlı olmamalıdır.
- Dependency inversion port/interface sınırlarında uygulanmalıdır.
- İş kuralları route handler, React component veya SQL dosyalarına gömülmemelidir.
- Tür güvenliği, açık hata modelleri ve boundary validation zorunludur.
- Ölü kod, kullanılmayan component, sahte özellik, bağlanmamış servis ve yoruma alınmış eski uygulama bırakılmamalıdır.
- Feature flag olmadan yarım özellik kullanıcıya gösterilmemelidir.
- Büyük dosyalar davranış ve sorumluluk sınırlarına göre parçalanmalıdır; yalnızca satır sayısı için yapay parçalama yapılmamalıdır.
- PostgreSQL gibi başka bir veritabanına ileride geçişi kolaylaştırmak için veri erişimi application/domain katmanından ayrılmalıdır.

## TDD ve doğrulama yaklaşımı

Yeni davranışlar TDD ile geliştirilmelidir:

1. Başarısız testle iş kuralı tanımlanır.
2. Testi geçiren en küçük doğru uygulama yazılır.
3. Davranış korunarak refactor yapılır.

Test katmanları:

- Domain unit testleri.
- Use-case/application service testleri.
- Geçici gerçek SQLite veritabanıyla repository ve transaction integration testleri.
- Route/API contract testleri.
- Auth, arama, takip, başvuru ve admin moderasyonu için kritik E2E testleri.
- Erişilebilirlik ve responsive smoke testleri.

Her şeyi mock'layan kırılgan testler yerine gerçek sınırları doğrulayan testler tercih edilmelidir. Hata, retry, duplicate, authorization ve eşzamanlılık senaryoları ayrıca test edilmelidir.

## SQLite ve veri yaşam döngüsü

- Supabase kaldırılacak; başlangıç ve tek VPS hedefi için SQLite kullanılacaktır.
- Kullanıcının bilgisayarına ayrıca SQLite sunucusu veya `sqlite3` CLI kurması zorunlu olmayacaktır.
- Veritabanı varsayılan olarak kalıcı bir `data/app.db` dosyasında tutulacaktır; yol environment/config ile değiştirilebilir olmalıdır.
- Veritabanı dosyası, WAL/SHM dosyaları, yedekler ve secrets Git'e eklenmemelidir.
- Uygulama ilk açılışta veritabanını ve gerekli dizinleri güvenli biçimde oluşturmalıdır.
- Yalnızca `CREATE TABLE IF NOT EXISTS` yaklaşımı yeterli değildir. Kullanıcıdan manuel komut istemeyen, uygulama başlangıcında çalışan, sürüm takipli ve idempotent otomatik migration sistemi olmalıdır.
- Migration başlamadan önce uygun yedek alınmalı; migration kilidi, başarısızlık kaydı ve güvenli yeniden çalıştırma davranışı tanımlanmalıdır.
- Foreign keys etkin olmalı; WAL, busy timeout, transaction ve checkpoint politikaları bilinçli yapılandırılmalıdır.
- Aynı veritabanında tek writer sınırı kabul edilmeli; uzun write transaction'lardan kaçınılmalıdır.
- SQLite dosyası network filesystem üzerinde paylaşılmamalı ve birden fazla uygulama sunucusunca ortak açılmamalıdır.
- Günlük online backup, retention, integrity check, disk alanı kontrolü ve belgelenmiş restore testi bulunmalıdır.
- Docker kullanılırsa veritabanı ve yedek dizinleri kalıcı volume üzerinde olmalıdır.
- Node'un yerleşik `node:sqlite` sürücüsünün kararlılık durumu uygulamadan önce yeniden doğrulanmalıdır. Gerekirse sistem çapında SQLite kurulumu gerektirmeyen paketlenmiş bir Node sürücüsü değerlendirilmelidir.

## Kimlik doğrulama ve güvenlik

- Kullanıcı register/login kayıtları SQLite'ta kalıcı tutulacaktır.
- Parolalar hiçbir koşulda düz metin veya hızlı genel hash ile saklanmamalıdır. Güncel OWASP önerisine göre Argon2id; mümkün değilse uygun maliyet parametreli scrypt kullanılmalıdır.
- E-posta normalizasyonu, benzersizlik, doğrulama, parola sıfırlama ve güvenli hesap kurtarma tasarlanmalıdır.
- Oturumlar server-side tutulmalı; istemciye yalnızca yüksek entropili opaque token verilmelidir. Veritabanında mümkünse token verifier/hash saklanmalıdır.
- Cookie'ler production'da `HttpOnly`, `Secure`, uygun `SameSite` ve `Path=/` özelliklerine sahip olmalıdır.
- Auth/session token'ları `localStorage` içinde tutulmamalıdır.
- Login, register, reset, webhook ve hassas API uçlarında rate limiting uygulanmalıdır.
- CSRF, XSS, SQL injection, open redirect, SSRF, dosya yükleme ve privilege escalation tehditleri tasarımda ele alınmalıdır.
- RBAC en az kullanıcı, küratör, admin ve sistem yöneticisi rollerini desteklemelidir. Organizasyon kapsamlı izinler için gerektiğinde resource-based policy uygulanmalıdır.
- Yetki yalnızca arayüzde gizleme ile değil her server-side use case sınırında kontrol edilmelidir.
- Admin rol/yetki değişikliklerinde session rotation ve kritik işlemlerde yeniden doğrulama düşünülmelidir.
- Secrets kaynak kodda, logda veya Git'te bulunmamalıdır.

## İdempotency, transaction ve asenkron işler

- Tekrarlanabilen tüm write operasyonlarında idempotency stratejisi tanımlanmalıdır.
- Dış kaynak kayıtları `source + external_id` gibi kararlı unique anahtarlarla deduplicate edilmelidir.
- API komutları için gerektiğinde idempotency key ve request fingerprint saklanmalıdır.
- Webhook event'leri provider/event ID ile yalnızca bir kez işlenmelidir.
- Bildirim teslimatlarında aynı kullanıcı/fırsat/deadline/kanal birleşiminin tekrar gönderilmesini engelleyen anahtar olmalıdır.
- Import, seed, migration, retry ve scheduled job işlemleri güvenli biçimde tekrar çalıştırılabilmelidir.
- Veri değişikliği ile event/job üretiminin atomik olması gereken yerlerde transactional outbox kullanılmalıdır.
- Background job'larda sınırlı retry, exponential backoff, jitter ve dead-letter durumu bulunmalıdır.
- İşlem sınırları application service düzeyinde belirlenmeli; yarım kalan çok adımlı güncellemeler engellenmelidir.
- Aynı kayıt üzerinde yarışan güncellemeler için version/optimistic concurrency değerlendirilmelidir.

## Log, audit, cache ve gözlemlenebilirlik

- Teknik loglar yapılandırılmış JSON formatında ve correlation/request ID ile üretilmelidir.
- Parola, raw session token, access token, API key, cookie, hassas kişisel veri ve tam request body loglanmamalıdır.
- Teknik application log ile değiştirilemez iş/audit geçmişi ayrı kavramlar ve ayrı saklama politikaları olmalıdır.
- Auth başarı/başarısızlığı, authorization reddi, admin işlemleri, import, moderation, integration ve notification sonuçları izlenmelidir.
- Health, readiness ve mümkünse dependency health endpoint'leri bulunmalıdır.
- Cache yalnızca ölçülmüş veya açıkça pahalı okumalarda kullanılmalıdır. Cache key, TTL, invalidation, stale davranışı ve kapsamı belirtilmeyen cache eklenmemelidir.
- Kullanıcı yetkisine bağlı veriler yanlış kullanıcıya sızmayacak biçimde cache'lenmelidir.
- Dış API cevaplarında ETag/Last-Modified, rate limit, retry-after ve kontrollü kalıcı cache değerlendirilmelidir.
- Performans için ölçüm yapılmadan karmaşık cache katmanı veya erken dağıtık altyapı eklenmemelidir.

## Veri kaynakları ve entegrasyon araştırması

Uygulamadan önce her entegrasyonun güncel resmî belgeleri, kullanım koşulları, lisansı, kota/rate limitleri ve attribution şartları doğrulanmalıdır.

Öncelikli adaylar:

- EU Funding & Tenders Portal API.
- Grants.gov / Simpler.Grants.gov API.
- OpenAlex (works, authors, institutions, funders, awards).
- ORCID OAuth ve public/member API sınırları.
- ROR kurum kimlikleri.
- Crossref fon veren, DOI ve yayın metadata'sı.
- Google Calendar ve Microsoft Outlook/Graph.
- Telegram Bot API ve güvenilir e-posta sağlayıcısı.
- TÜBİTAK ve diğer ulusal kaynaklar; açık API yoksa robots.txt, kullanım şartları, düşük istek hızı, provenance ve zorunlu admin moderasyonuyla özel adapter.

Entegrasyonlar adapter/port yapısında olmalı; provider SDK'ları domain katmanına sızmamalıdır. Her provider için health, cursor/checkpoint, son başarılı çalışma, rate limit ve hata durumu takip edilmelidir.

## API ve veri modelleme ilkeleri

- Kimlikler opaque ve tahmin edilmesi zor olmalıdır; dış kaynak ID'leri ayrı alanlarda tutulmalıdır.
- Tarihler ISO 8601 olarak modellenmeli; timezone ve “date-only deadline” ayrımı açık olmalıdır.
- Para ISO currency koduyla saklanmalı; bilinmeyen ile ücretsiz aynı değer olmamalıdır.
- Kaynak, provenance, first-seen, last-seen, last-verified ve confidence ayrı kavramlar olmalıdır.
- Fırsat değişiklik geçmişi tutulmalı; deadline değişimi sessizce eski değerin üzerine yazılmamalıdır.
- Silme gereksiniminde audit ve referans bütünlüğü değerlendirilerek soft-delete/archive kullanılmalıdır; her tabloya refleks olarak soft delete eklenmemelidir.
- Liste endpoint'lerinde tutarlı filtre, sort ve cursor/page sözleşmesi olmalıdır.
- API hataları kararlı kod, kullanıcıya uygun mesaj ve correlation ID taşımalıdır.
- Public API, RSS ve webhook desteği post-MVP kapsamının parçası olarak tasarlanmalı fakat erişim kontrolü ve kota olmadan açılmamalıdır.

## Kurulum, dağıtım ve teslimat

Proje ZIP olarak başka birine verildiğinde mümkün olduğunca tek komutla kurulabilmelidir.

Teslimatta en az şunlar bulunmalıdır:

- `KURULUM.md`: sıfırdan kurulum, gereksinimler, sorun giderme, güncelleme, yedekleme, restore ve kaldırma.
- `install.sh`: Linux/VPS için yönlendirmeli kurulum sihirbazı.
- `install.ps1`: Windows PowerShell için eşdeğer kurulum sihirbazı.
- Gerekirse ayrı `update`, `backup`, `restore`, `doctor` ve `uninstall` komutları veya aynı sihirbazın alt komutları.

Kurulum sihirbazı:

- İşletim sistemi, dağıtım, mimari ve yetkileri algılamalıdır.
- Node.js, npm ve gerekli araçların varlığını/sürümünü kontrol etmelidir.
- Uygun kurulu sürümleri atlamalı; eksikleri güvenli kaynaktan kurmalı; eski sürümlerde açık onayla güvenli güncelleme yapmalıdır.
- Kullanıcı verisini, `.env` dosyasını, secrets veya mevcut `app.db` dosyasını ezmemelidir.
- Tekrar çalıştırıldığında idempotent olmalıdır.
- Environment/config değerlerini yönlendirmeli biçimde toplamalı ve doğrulamalıdır.
- Dizinleri, izinleri, otomatik migration'ları, ilk admin hesabını, build'i ve health check'i hazırlamalıdır.
- Uygun port kontrolü yapmalı ve çakışmayı anlaşılır biçimde çözmelidir.
- VPS kurulumunda process manager/systemd, reverse proxy ve HTTPS adımlarını güvenli şekilde ele almalıdır.
- Her adımı ve hatayı anlaşılır biçimde göstermeli; başarısızlıkta sistemi belirsiz yarım durumda bırakmamalıdır.
- İnternetten bilinmeyen uzun bir shell komutunu doğrudan çalıştırmak yerine ZIP içindeki incelenebilir script dosyasını çalıştırmalıdır.

## Dokümantasyon ve kalite kapısı

- README ürünün gerçek kapsamını ve güncel durumunu yansıtmalıdır.
- Mimari kararlar kısa ADR belgeleriyle kaydedilmelidir.
- Her modülün sorumluluğu, public API'si ve bağımlılıkları belgelenmelidir.
- Environment değişkenleri örnek ve açıklamalarıyla belgelenmelidir; gerçek secrets örneğe yazılmamalıdır.
- Bir özellik tamamlandı sayılmadan test, authorization, validation, error/loading/empty UI, responsive davranış, log/audit etkisi ve dokümantasyonu değerlendirilmelidir.
- Lint, type-check, unit, integration, E2E ve production build kalite kapıları kurulmalıdır.
- Kullanılmayan paketler, dosyalar, export'lar ve feature kalıntıları düzenli olarak temizlenmelidir.
