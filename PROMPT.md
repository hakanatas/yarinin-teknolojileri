# Prompt · İstem

Bu animasyonu üretmek için Claude'a verilen istemler, hiç değiştirilmeden.
The prompts given to Claude to produce this animation, unedited.

## Bağlam / Context

Serinin 25. filmi (BTY.6.1.1). Seri tek bir istemle başladı; ilk film (BTY.5.1.1) pilot olarak yapıldı, ardından filmler yavaşlatıldı ve sese kavuştu, sonra "tüm konuları sırasıyla yap" istemiyle müfredat sırasıyla bütün öğrenme çıktılarının filmleri üretildi. Bu film o son istemle yapıldı; önceki istemlerdeki beklentiler (birebir öğrenme çıktısı, kolay takip, çini-piksel görsel dili, Karo, ses, yayın düzeni) sürüyor.

Film 25 of the series (BTY.6.1.1). The series began with a single brief; the first film (BTY.5.1.1) was a pilot, then the films were slowed down and given sound, and finally the prompt "do all the topics in order" produced a film for every learning outcome. This film comes from that last prompt; everything asked earlier still applies.

## 1. İstem (seri özeti) / Prompt 1 (series brief)

```text
# Bilişim Filmleri — seri özeti

Ben Hakan Ataş (GitHub: hakanatas), matematik ve bilişim öğretmeniyim. Daha önce "Nokta'nın Filmleri" serisini yaptık: ortaokul matematiğin her öğrenme çıktısı için JavaScript ile prosedürel çizilen 92 saniyelik animasyonlar (https://hakanatas.github.io/nokta-filmleri). Şimdi aynı üretim düzeniyle ama yepyeni bir görsel dil ve karakterle ortaokul Bilişim Teknolojileri ve Yazılım dersi için bir seri istiyorum.

## İçerik
- Kaynak: MEB Türkiye Yüzyılı Maarif Modeli, ortaokul Bilişim Teknolojileri ve Yazılım öğretim programı (tymm.meb.gov.tr). Öğrenme çıktılarını ve alt maddelerini oradan birebir al; özetleme, uydurma.
- Her öğrenme çıktısı için bir film; müfredat sırasıyla, sınıf sınıf.
- Öğrencinin takip etmesi kolay olsun: sahne başına tek fikir, kısa cümleler, somut ve öğrencinin hayatından örnekler, sonda "aklında kalsın" özeti.

## Görsel dil (Nokta serisinden bilerek farklı)
- Nokta serisinin krem kâğıt, siyah mürekkep, tek amber vurgu ve el çizimi çizgi estetiğini tekrar etme.
- Bu seri renkli olsun: kendine özgü, tutarlı bir palet (token olarak tanımlanmış), net şekiller. Bilişime uygun ama klişe olmayan tek bir estetik yön seç ve tutarlı kullan.
- Karakter yeni ve özgün olsun; bilinen bir maskota, robota ya da çizgi film karakterine benzemesin. Konuşmadan, jest ve yüz ifadesiyle anlatabilsin. Pozları ve ifadeleri zamanın fonksiyonu olarak çizilsin.
- Font: Türkçe karakterleri tam destekleyen, karakterli bir yazı tipi; Inter, Roboto, Arial gibi jenerik fontlar olmasın.

## Teknik düzen (Nokta serisinde işe yarayan)
- Her film tek HTML sayfası ve saf JavaScript, Canvas 2D. Her kare renderFrame(t) ile zamanın saf fonksiyonu, rastgelelik tohumlu; ekran kaydı yok.
- 92 saniye, 6 sahne (yaklaşık 10 sn giriş, 3–4 ana sahne, özet). 16:9 ve 9:16 düzen.
- Altyazılar Türkçe, İngilizce ya da ikisi birlikte seçilebilsin; captions.js'de öğretmen için seslendirme notları olsun.
- Playwright ile kare kare MP4 (yatay ve dikey) ve SRT dışa aktarımı.
- Her film ayrı bir GitHub deposu ve GitHub Pages sayfası. README'de TR özet, birebir öğrenme çıktısı, sahne tablosu ve çalıştırma bilgisi olsun; PROMPT.md verilen istemi birebir içersin. v1.0 sürümünde 6 dosya: yatay ve dikey 720p MP4, TR SRT, EN SRT, iki dilli SRT, seslendirme notları.
- Bütün filmleri toplayan, sınıf seçicili bir hub sayfası (ayrı depo).
- Lisans: CC BY-NC 4.0 (atıf zorunlu, ticari olmayan kullanım). README'de iki dilli lisans bölümü ve hazır atıf metni olsun.

## Yayınlama (öğrendiklerimiz)
- Yükleme Chrome ile değil, Mac'imdeki gh ile yapılsın (kurulu ve girişli). Sen depoları ve bir betiği bağlı klasöre koy, ben Terminal'de tek komutla çalıştırayım. Betikler tekrar çalıştırılabilir olsun, biten işleri atlasın.
- MP4 üretimi Mac'te yapılsın: Playwright yüklü Google Chrome'u channel: 'chrome' ile kullansın (kendi Chromium indirmesi Mac'imde takılıyor), ffmpeg -nostdin ile çalışsın, komut caffeinate -dis ile başlasın.
- Her filmde yatay ve dikey önizleme karelerini üret ve kendin bak: üst üste binen yazı, kenardan taşan metin, okunmayan küçük yazı kalmasın.
```

Claude'un soruları ve yanıtlar: önce bir pilot film, görsel dil onaylanınca müfredat sırasıyla devam; hub sayfasında FTC 24230 AG Robotik takım atfı ve logosu.

## 2. İstem / Prompt 2

Yanıtlar: film yaklaşık 2,5 dakikaya yavaşlatılsın; ses olarak efektler ve hafif fon müziği.

```text
videolar çok hızlı çocuklar bunları okuyamaz daha yavaş hale getirelim videoyu . Ayrıca hiç ses yok sanki efektler olsa çok güzel olur gibi.
```

## 3. İstem / Prompt 3

```text
çok güzel oldu şimdi tüm konuları sırasıyla yap.
```
