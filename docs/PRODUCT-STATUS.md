# Ürün durumu

## Bu geliştirmede doğrulanan akışlar

- Yönetim ve kurum için CSV şablonu/dışa aktarma; zorunlu sütun ve format kuralları, UTF-8/BOM/ayraç kontrolü, satır bazlı hata ve çözüm raporu, ekran içinde CSV düzeltme, filtreli/sayfalı önizleme ve açık onay. Bir hatada tüm aktarım engellenir; kaydetme atomiktir. Önizleme aktöre/kuruma bağlı ve 30 dakika geçerlidir. Aynı referans/içerik atlanır; mevcut ilanlar sessizce güncellenmez.
- Role göre kullanım sihirbazı; ileri/geri, hepsini atla, yeniden açma ve tarayıcıda tercih saklama.
- Katalog ilanını düzenleme, arşivden çıkarma, çöp kutusu ve geri alma; kurum ilanında taslağa dönüş ve yeniden inceleme. Koleksiyon/görev/hazırlık/CMS için geri alınabilir silme, görev yeniden açma ve bildirim okundu/okunmadı/kaldırma/geri alma.
- Kurum profili düzenleme, yayından kaldırma ve yeniden onay isteme. Kimlik alanı değiştiğinde yeniden onay gerekir.
- Geri çekilmiş başvuruyu yeni paylaşım onayıyla yeniden gönderme; sonuçlanmış başvuruyu gerekçe ve araştırmacıya bildirimle yeniden değerlendirmeye açma.
- Linux temiz kurulum doğrulaması; Node 24+ kontrolü ve resmi yerel runtime indirme betikleri, bağımlılık değişmediyse atlama, ortak kurulum doğrulaması. Bakım komutları Next ortam dosyalarını okur. Migration öncesi yedek/kilit/başarısızlık kaydı, salt okunur doctor ve yeni dosyaya güvenli restore bulunur. Windows/macOS üzerinde gerçek işletim sistemi testi yapılmadı.

- Tam portal vitrini: ikonlu açılır navbar, arama başlığı, fırsat türleri, yeni eklenenler, konu/ülke dizinleri, kurum keşfi, rehberler ve çok kolonlu footer. Birleşik filtreler, aktif filtre kaldırma, liste/kart/kompakt görünüm ve sayfalama korunur.
- Kurum dizini ve herkese açık kurum profilleri; ayrı kurum çalışma alanı. Normal kullanıcı kurum yöneticisi olabilir, platform yönetim yetkisi kazanmaz.
- Kurum oluşturma ve yönetici doğrulaması; ilan taslağı, düzenleme, incelemeye gönderme, yönetici yayını/düzeltme kararı ve ilan kapatma.
- Platform başvurusu: açık paylaşım onayı, başvuru mesajı, isim/e-posta snapshot'ı, tek kullanıcı/ilan başvurusu, kurum kapsamına göre aday görüntüleme, arama, durum filtresi ve SQL sayfalaması.
- Başvuruyu değerlendirmeye alma, kabul/ret, araştırmacıya uygulama içi bildirim, sonuç geçmişi ve geri çekme. Kişisel hazırlık panosu gerçek gönderimden ayrıdır.
- Kurum onayı geri alındığında ilan, detay, arama ve facet görünürlüğü kapanır. Taslaklar ve incelemedeki ilanlar doğrudan bağlantıyla da açılamaz.
- Araştırmacı çalışma masasında gerçek gönderimler; yönetici kullanıcı dosyasında mesaj içeriğini açmadan kurum/ilan/durum geçmişi.
- Vitrin, araştırmacı alanı ve yönetim arasında masaüstü/mobil geçiş; owner dahil rol kontrolü.
- Araştırmacı çalışma masası, başvuru özeti, takipli fırsat tarihleri, koleksiyonlar, profil ve bildirim okunma durumu.
- Başvuru görevlerini modal üzerinden oluşturma ve tamamlama; üyelik sınırı ve audit kaydı.
- Yönetici, araştırmacı ve kurum panellerinde ekran yüksekliğinde, bağımsız kayan, açılır gruplu ve alt bağlantılı sidebar; mobilde klavye/Escape destekli drawer. Seçili bağlantı menü içinde görünür tutulur.
- CMS içerik stüdyosu: ana sayfa başlığı/giriş metni/ek bölümler, bağımsız site sayfaları ve rehberler. Metin, bağlantılı çağrı ve soru-cevap bölümleri eklenir, sıralanır ve önizlenir.
- Taslak/yayın/arşiv, sürüm geçmişi, eski sürümü yeni bir sürüm olarak geri yükleme ve eşzamanlı editör çakışması kontrolü.
- Yayınlanmış sayfaları üst menü ve footer'a ekleme; site adı, kısa açıklama, footer metni ve iletişim e-postası yönetimi. Genel site ayarları admin/owner rolüne açıktır.
- Araştırmacı görev ve kişisel tarih ekranları; yönetici için gerçek veritabanı bütünlüğü ve migration geçmişini gösteren sistem ekranı.
- Kart/liste/kompakt fırsat görünümü, mobil açılır filtreler.

SQLite migration 6, mevcut kurum ve fırsat tablolarına ilişkili kurum hesapları/üyelikler, kurumsal ilanlar ve başvuru gönderimlerini ekler. Foreign key, benzersiz gönderim ve sürüm denetimleri vardır. Mevcut kullanıcı verisi korunur. Test verisi gerçek veritabanına yazılmaz; Playwright geçici SQLite dosyası kullanır.

Migration 7, CMS sayfa/bölüm/menü alanları ve site ayarlarını ekler. Başlangıç kullanım rehberleri bir kez oluşturulur; sonraki başlangıçlarda editörün değişiklikleri ve yayın kararları üzerine yazılmaz. CMS bölümleri bağlı oldukları sayfanın sürümüyle atomik saklanır; yazar ve revizyon ilişkileri foreign key ile korunur.

Migration 8, aktöre/kuruma bağlı CSV önizlemelerini ve benzersiz ilan referanslarını; migration 9, geri alınabilir kaldırma alanlarını ekler. Ayrıntılı kurulum ve geri dönüş davranışları [KURULUM.md](../KURULUM.md) dosyasındadır.

## Açık ürün işleri

Platformun tamamı henüz post-MVP tamamlandı sayılmaz. Canlı dış kaynak adapter'ları, dış kaynaktan gelen kayıtların moderasyonu/birleştirilmesi, gerçek e-posta/Telegram teslimatı, parola kurtarma, kurum/ekip davetleri, dosya yönetimi ve programlı yayınlama henüz uçtan uca tamamlanmadı. CMS'de görsel yükleme, serbest şablon oluşturma ve ana sayfanın otomatik katalog bölümlerini yeniden sıralama yoktur. Profilde ORCID kimliği saklanır; OAuth doğrulaması yapılmaz. Başvuru bildirimleri uygulama içinde üretilir; dış kanallara gönderim yoktur. Başlangıç kataloğu canlı doğrulanmış veri değildir. Kurum onayı manuel incelemeye dayanır; otomatik alan adı doğrulaması yapılmaz. Harita ekranı tam bir harita sağlayıcısı entegrasyonu değildir. CSV mevcut ilanları topluca güncellemez; katalog ve kurum düzenleme ekranları kullanılır. CSV’deki düzeltme editörü metin tabanlıdır; XLSX içe aktarma bulunmaz.

## Araştırma ve tasarım kararları

Payload'ın [taslak/yayın ayrımı](https://payloadcms.com/docs/versions/drafts) ve [sürüm modeli](https://payloadcms.com/docs/versions/overview) incelendi. Bu projede yayın durumuna göre herkese açık okuma sınırı ve optimistik sürüm kontrolü uygulandı. Başka ürünün tamamının uygulandığı iddia edilmez.

Frontend-design rehberi uygulandı. Kurum iş akışı kararları [ilk tasarım belgesinde](marketplace-design.md), güncel portal/CMS/panel tasarımı [portal belgesinde](portal-design.md). Araştırmacı: açık renk kişisel çalışma masası; kurum: yayın/başvuru çalışma alanı; yönetim: yoğun operasyon ekranı. Ortak üst menü bağlamı korur. Masaüstü ve mobil ekran görüntüleriyle yoğunluk ve taşma kontrol edilir.

## Doğrulama

`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

`npm run test:e2e` için önce build alınır. Playwright owner, kurum yayıncısı ve başvuran hesapları oluşturup CMS yayınlama, yüzey geçişleri, koleksiyon izolasyonu, admin koruması, görev modalı, kurum/ilan onayı, başvuru gönderimi, değerlendirme bildirimi, arama/filtre birlikteliği ve mobil görünümü denetler. Ekran görüntüleri `test-results/` içindedir. Bu dosyalar Git'e dahil değildir.
