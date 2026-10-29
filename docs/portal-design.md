# Portal ve panel düzenlemesi

Kullanıcının güncel isteği: vitrin boyunca içerik çeşitliliği; ikonlu navbar, estetik header, kapsamlı footer; yönetici ve kullanıcı panelinde ekran yüksekliğinde, alt öğeli, açılır kapanır sidebar. Önceki tek liste ağırlıklı görünüm yeterli bulunmadı.

Renkler: mürekkep `#163046`, deniz `#087f8c`, açık mavi `#e8f3f7`, beyaz `#ffffff`, zemin `#f2f5f8`, vurgu `#c46a36`. Georgia yalnızca editoryal büyük başlıklarda; Aptos/Segoe UI gezinme ve içerikte. Küçük etiketler ile ana metin ayrılır, yoğunluk daha küçük yazıyla değil doğru gruplayarak sağlanır.

```
yardım / platform                         kurumlar için yayın
marka | ikonlu keşif menüleri | panel geçişi | hesap
başlık + arama + konu bağlantıları | bilimsel çizim / yakın çağrı
tür ikonları ve gerçek kayıt sayıları
yeni çağrılar: farklı türlerde kısa ilan özetleri
filtreler | arama sonuçları ve görünüm seçimi | takvim / çalışma alanı
konu dizini / ülke dizini / kurum keşfi
CMS içerikleri / başvuru rehberleri / yardım
platform | araştırmacılar | kurumlar | kaynaklar | CMS sayfaları
```

Panel: solda tam yükseklikte menü ve bağımsız scroll; sağda toolbar ve içerik. Menüde gerçek işlevler gruplandırılır. Aktif alt menü belirgin, ilgili grup açık; diğer gruplar kullanıcı tercihine göre açılıp kapanır. Dar ekranda modal menü klavye odağını korur ve Escape ile kapanır. Admin, araştırmacı ve kurum aynı navigasyon davranışını kendi görevlerine göre kullanır.

İlk taslakta uzun listeye daha çok kutu eklemek elendi: üstte keşif seçenekleri, ortada görev odaklı sonuçlar, altta konu/kurum/içerik dizinleri farklı görsel yapılarla birlikte tasarlanır. Eski sidebar ve footer stilleri temizlenerek CSS üst üste yığılmaz.

Kariyer.net ana sayfasına otomatik erişim 403 verdi. [Resmî yardım sayfası](https://www.kariyer.net/yardim/) keşif, rehber ve aday/işveren akışları için incelendi; tam görsel inceleme yapıldığı iddia edilmez. Kullanıcının kendi tarif ettiği portal düzeni tasarım brief'idir.

CMS: rehber, bağımsız sayfa ve ana sayfa içerikleri; metin, bağlantı çağrısı ve SSS bölümleri; sıralama, görünürlük, güvenli linkler, SEO açıklaması, sürüm geçmişi ve geri yükleme. Ana sayfa editoryal başlık/giriş ile ek bölümler CMS'den gelir; ilanlar ve sayıları gerçek katalog sorgusundan gelir. Site kimliği/iletişim/footer metni yetkili yönetici tarafından düzenlenir. Hedefler tamamlanma iddiası değildir; kalite kontrolleri ürün durumu belgesine ayrıca yazılır.
