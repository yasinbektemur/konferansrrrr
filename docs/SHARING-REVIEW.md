# Paylaşım kontrolü — 29 Ekim 2026

Proje klasörü doğrudan ZIP'lenmemelidir. `data/app.db`, WAL/SHM dosyaları, `data/backups/` ve `backups/` mevcut kullanıcıları, parola doğrulayıcılarını, oturum verilerini ve uygulama kayıtlarını taşıyabilir. `.next/` derleme çıktıları, Playwright izleri/ekran görüntüleri ve yerel loglar da paketten çıkarılır. `.env*`, özel anahtarlar, Git geçmişi ve kişisel araç ayarları paylaşılmaz.

Kaynak dosyalar; yaygın sağlayıcı anahtarı biçimleri, özel anahtar blokları, JWT, URL içine gömülü kimlik bilgileri ve sabit parola/token atamaları bakımından tarandı. Gerçek bir sağlayıcı anahtarı veya geliştirme yöneticisinin parolası bulunmadı. Testlerdeki parolalar geçici test veritabanları içindir; kurulumda bu hesaplar oluşturulmaz. Kaynak içindeki makineye özel kullanıcı yolu taşınabilir ev dizini gösterimine çevrildi.

Hazırlanan paylaşım arşivi yalnızca kaynak, yapılandırma, kurulum betikleri, belgeler, test kaynakları, statik dosyalar ve `data/conferences.json` örnek kataloğunu içerir. ZIP dosya listesi, sembolik bağlantılar ve hassas dosya uzantıları ayrıca kontrol edilir. Veritabanı ile oturum/yedek/test çıktıları dahil edilmez. İlk kullanıcı yeni bilgisayarda kayıt olarak yönetici olur.

Bu kontrol mevcut kaynak ve hazırlanan arşiv içindir; sonradan eklenen dosyalara veya farklı bir ZIP programının seçimlerine otomatik olarak uygulanmaz. Biçim tabanlı tarama her olası gizli değeri tespit edemez. Uygulamanın mevcut denetim kayıtlarını silmek tek başına güvenli bir paylaşım paketi oluşturmaz.
