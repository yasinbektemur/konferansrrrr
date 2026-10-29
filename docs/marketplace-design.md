# Akademik fırsat pazarı

29 Ekim 2026: Kullanıcı kurum, araştırmacı ve yönetici çalışma alanları olan, LinkedIn/Kariyer kapsamından esinlenen bir ürün yönünü onayladı. Tam makale gönderimi ve hakemlik bu kapsama dahil değil.

## Görsel karar

Renkler: mürekkep `#183046`, deniz `#096f82`, açık mavi `#e7f2f7`, zemin `#f3f6f8`, beyaz `#ffffff`, uyarı `#a34425`. Başlıklarda Georgia, işlevsel metinde yerel sistem sans-serif; küçük metin en az 12px. Büyük dekoratif radar yerine kısa bir araştırma çağrısı başlığı ve doğrudan arama. Sayısal güven puanları yerine kaynak ve başvuru bilgileri öncelikli.

```
marka      keşfet / araştırmacı / kurum / yönetim       hesap
başlık + arama                                  ilan yayımla
konferans | hibe | burs | çalıştay | diğer türler
filtreler   | ilan akışı + görünüm + sayfalama | yaklaşan tarihler
            | kurum, konu, başvuru türü        | çalışma alanı
            |                                 | yayıncı daveti
```

İlk taslaktaki eşit boyutlu kartlar elendi: ortada taranabilir ilan listesi, yanda küçük zaman çizelgesi, üstte tek renkli kısa başlık. Böylece kurumsal dashboard görünümü yerine araştırma fırsatlarını keşfetmeye odaklanılır. Masaüstünde üç kolon; tablette yan bilgi aşağıda; telefonda filtre açılır, içerik tek kolon. Mevcut içerik örnek katalog olarak açıkça etiketlenir; sahte kurum veya ilan sayıları eklenmez.

## İş akışı ve araştırma

[LinkedIn ilan yönetimi](https://www.linkedin.com/help/recruiter/answer/a520582/) ilan bilgisi, aday listesi ve ilan kapatma işlerini aynı yönetim alanında topluyor. Bu etkileşim örüntüsünü akademik çağrılara uyarlıyoruz; LinkedIn entegrasyonu yapılmıyor.

Kurum oluşturma → yönetici incelemesi → ilan taslağı → yayın incelemesi → katalog → araştırmacı başvurusu → kurum değerlendirmesi → araştırmacı bildirimleri. Kurum üyeliği platform yönetim rolü vermez. Kişisel hazırlık alanı kuruma gönderilen başvurudan ayrıdır. Dış başvurulu ilanlarda gerçek gönderim yalnızca resmî sitede gerçekleşir.

Kurum, üyelik, ilan ve başvuru kayıtları foreign key ile bağlıdır. Her araştırmacı/ilan için tek gönderim vardır. Form tekrarları anahtar ve içerik özetiyle deduplicate edilir; güncellemeler sürüm denetimlidir. Başvuru sırasında isim/e-posta snapshot'ı saklanır ve paylaşım açıkça belirtilir. E-posta gönderimi henüz yoktur; karar bildirimi uygulama içinde atomik oluşturulur.
