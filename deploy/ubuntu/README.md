# Ubuntu'da native deemix + Google Drive

Bu kurulum Docker kullanmaz. deemix, `systemd` altında `deemix` kullanıcısıyla
çalışır. İndirme tamamlanınca `/usr/local/bin/deemix-to-drive` çağrılır ve
dosya ya da albüm/playlist klasörü `rclone` ile Google Drive'a aktarılır.

## 1. Bağımlılıklar ve kullanıcı

Proje Node.js 24 veya daha yenisini gerektirir. Aşağıdaki komutlar NodeSource'un
Ubuntu deposundan Node.js 24'ü, ardından diğer bağımlılıkları kurar:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs git rclone coreutils util-linux build-essential python3
sudo corepack enable

sudo useradd --system --create-home --home-dir /var/lib/deemix \
  --shell /usr/sbin/nologin deemix
sudo install -d -o deemix -g deemix -m 0750 \
  /var/lib/deemix/config /srv/deemix/downloads
sudo install -d -o root -g deemix -m 0750 /etc/deemix
sudo install -o deemix -g deemix -m 0640 /dev/null \
  /var/log/deemix-to-drive.log
```

Kurulu Node sürümünü kontrol edin:

```bash
node --version
```

Çıktı `v24` veya daha yeni olmalıdır.

## 2. Projeyi kurma

Bu deponun Ubuntu sunucuda `/opt/deemix` konumunda olduğunu varsayıyoruz:

```bash
cd /opt/deemix
sudo pnpm install --frozen-lockfile
sudo pnpm build
sudo chown -R root:root /opt/deemix
sudo chmod -R a+rX /opt/deemix
```

Güncelleme sonrasında `pnpm install` ve `pnpm build` komutlarını yeniden
çalıştırıp servisi yeniden başlatın.

## 3. rclone ile Drive girişi

`deemix` kullanıcısının rclone ayarını oluşturun:

```bash
sudo -u deemix -H rclone config
sudo -u deemix -H rclone lsd gdrive:
```

İlk komutta Google Drive remote adını `gdrive` seçin. Sunucu başlıksızsa rclone
başka bir bilgisayardaki tarayıcıyla yetkilendirme için yönlendirme gösterir.
İkinci komut Drive klasörlerini listelemelidir.

## 4. Betik ve systemd servisi

```bash
cd /opt/deemix
sudo install -o root -g root -m 0755 \
  deploy/ubuntu/deemix-to-drive /usr/local/bin/deemix-to-drive
sudo install -o root -g root -m 0644 \
  deploy/ubuntu/deemix.service /etc/systemd/system/deemix.service
sudo install -o root -g deemix -m 0640 \
  deploy/ubuntu/deemix.env.example /etc/deemix/deemix.env

sudo systemctl daemon-reload
sudo systemctl enable --now deemix
sudo systemctl status deemix
```

Varsayılan olarak WebUI yalnızca sunucunun kendisinde `127.0.0.1:6595`
adresini dinler. Kendi bilgisayarınızdan güvenli biçimde açmak için:

```bash
ssh -L 6595:127.0.0.1:6595 ubuntu@SUNUCU_IP
```

Ardından tarayıcıda `http://127.0.0.1:6595` adresine gidin. API'de ayrıca
kimlik doğrulama katmanı olmadığı için portu doğrudan internete açmayın.

## 5. deemix ayarı

WebUI'de Deezer ARL ile oturum açın. Ardından:

1. `Settings > Other > Command to execute after download` alanına şunu yazın:

   ```text
   /usr/local/bin/deemix-to-drive %folder% %filename%
   ```

2. Ayarları kaydedin.
3. Albüm ve playlist indirmelerinde başka dosyaların yanlışlıkla aynı işleme
   girmemesi için albüm ve playlist klasörü oluşturma seçeneklerini açık tutun.

Tek şarkıda `%folder%/%filename%`, albüm ve playlistte ise `%folder%` Drive'a
aktarılır. `DTD_MODE=move` başarılı yüklemeden sonra yerel kopyayı siler.
Yerel dosyayı tutmak için `/etc/deemix/deemix.env` içinde `DTD_MODE=copy`
yapıp servisi yeniden başlatın:

```bash
sudo systemctl restart deemix
```

## Kontrol ve günlükler

```bash
sudo journalctl -u deemix -f
sudo tail -f /var/log/deemix-to-drive.log
sudo -u deemix -H rclone lsf gdrive:Music
```

Betik Google Drive API hızını sınırlar, aktarımı tekilleştiren bir kilit
kullanır ve geçici hatalarda yeniden dener. Yükleme başarısız olursa kaynak
yerel diskte kalır. deemix, komut tamamlanana kadar sonraki kuyruk işini
bekletebilir; bu, dosyanın yükleme sırasında değiştirilmesini önler.
