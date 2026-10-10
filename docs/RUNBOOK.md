# SchoolPro Enterprise Production Handover & Operational Runbook
## সংস্করণ: ১.০.০ | সেন্ট্রাল ক্লাউড প্ল্যাটফর্ম ও অফলাইন উইন্ডোজ ডেস্কটপ আর্কিটেকচার

---

## ১. ভূমিকা ও সিস্টেম আর্কিটেকচার (System Overview)

**SchoolPro** একটি দ্বি-স্তরবিশিষ্ট (Two-Tier) হাইব্রিড স্কুল ম্যানেজমেন্ট ইকোসিস্টেম:
1. **সেন্ট্রাল অনলাইন ক্লাউড প্ল্যাটফর্ম (Central Authority):**
   * সেন্ট্রাল ডাটাবেস: PostgreSQL 16
   * ইন-মেমোরি স্টোর: Redis 7
   * সেন্ট্রাল ব্যাকএন্ড এপিআই: NestJS (TypeScript, Node.js 20/22)
   * সুপার অ্যাডমিন পোর্টাল: Next.js + Tailwind CSS (সার্ভড ভায়া Nginx Alpine)
   * গেটওয়ে ও অটোমেটেড TLS: Caddy v2 (HTTP/2, HTTP/3 QUIC, Automatic Let's Encrypt)
2. **অফলাইন-ফার্স্ট উইন্ডোজ ডেস্কটপ ক্লায়েন্ট (Offline Client):**
   * রানটাইম: Electron + Embedded Chromium
   * লোকাল ডাটাবেস: SQLite (WAL মোড, ফুল অফলাইন অপারেশন)
   * টু-ওয়ে সিঙ্ক ইঞ্জিন: ব্যাকগ্রাউন্ড অ্যাসিনক্রোনাস ব্যাচ পুশ ও ডেল্টা পুল
   * হার্ডওয়্যার সিকিউরিটি: মাদারবোর্ড UUID, CPU ও MAC ভিত্তিক Ed25519 এনটাইটেলমেন্ট টোকেন ভ্যালিডেশন
   * অ্যান্টি-ট্যাম্পার: মোনোটোনিক আপটাইম ওয়াচডগ ও মেশিন-বাউন্ড HMAC সিল

---

## ২. প্রোডাকশন সার্ভার প্রোভিশনিং গাইড (VPS Setup Guide)

### ন্যূনতম সার্ভার কনফিগারেশন:
* **অপারেটিং সিস্টেম:** Ubuntu 22.04 LTS / 24.04 LTS (x86_64)
* **সিপিইউ:** ২ vCPU বা তদূর্ধ্ব
* **র‍্যাম:** ৪ জিবি বা তদূর্ধ্ব
* **ডিস্ক স্টোরেজ:** ৪০ জিবি NVMe SSD
* **নেটওয়ার্ক:** স্ট্যাটিক পাবলিক আইপি, ওপেন পোর্টস: `80` (HTTP), `443` (HTTPS/TCP), `443` (HTTP/3/UDP)

### ক. প্রারম্ভিক সার্ভার সেটআপ ও ফায়ারওয়াল কনফিগারেশন:
```bash
# ১. সিস্টেম প্যাকেজ আপডেট
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw net-tools htop jq

# ২. UFW ফায়ারওয়াল কনফিগারেশন
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # Caddy HTTP
sudo ufw allow 443/tcp   # Caddy HTTPS
sudo ufw allow 443/udp   # Caddy HTTP/3 (QUIC)
sudo ufw --force enable
sudo ufw status
```

### খ. Docker Engine ও Docker Compose V2 ইন্সটলেশন:
```bash
# Docker প্রাতিষ্ঠানিক রিপোজিটরি সেটআপ
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ডকার সার্ভিস চালু ও অটো-স্টার্ট সক্রিয়করণ
sudo systemctl enable --now docker
docker --version
docker compose version
```

---

## ৩. প্রোডাকশন ডেপ্লয়মেন্ট রানবুক (Step-by-Step Deployment)

### ধাপ ১: রিপোজিটরি ক্লোন ও ডিরেক্টরি পারমিশন
```bash
sudo mkdir -p /opt/schoolpro
sudo chown -R $USER:$USER /opt/schoolpro
git clone <YOUR_GIT_REPO_URL> /opt/schoolpro
cd /opt/schoolpro
```

### ধাপ ২: প্রোডাকশন পরিবেশ ভ্যারিয়েবল কনফিগারেশন
```bash
cp .env.production.example .env.production
nano .env.production
```
*অবশ্যই পরিবর্তন করুন:*
* `DOMAIN_NAME`: আপনার ডোমেন (যেমন: `cloud.schoolpro.edu.bd`)
* `ACME_EMAIL`: অ্যাডমিন ইমেইল অ্যাড্রেস
* `POSTGRES_PASSWORD`: শক্তিশালী এলোমেলো ৩২ অক্ষরের পাসওয়ার্ড
* `REDIS_PASSWORD`: শক্তিশালী এলোমেলো পাসওয়ার্ড
* `JWT_SECRET`: শক্তিশালী সিক্রেট কী
* `ED25519_PRIVATE_KEY` এবং `ED25519_PUBLIC_KEY`: ক্রিপ্টোগ্রাফিক কি-পেয়ার

### ধাপ ৩: কন্টেইনার স্ট্যাক চালু ও ডেটাবেস ইনিশিয়ালাইজেশন
```bash
# প্রোডাকশন কন্টেইনার বিল্ড ও ব্যাকগ্রাউন্ড রান
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# কন্টেইনার স্ট্যাটাস পর্যবেক্ষণ
docker compose -f docker-compose.prod.yml ps
```

### ধাপ ৪: হেলথ-চেক ও কানেক্টিভিটি যাচাই
```bash
# এপিআই স্বাস্থ্য যাচাই (HTTP 200 প্রত্যাশিত)
curl -i http://localhost:3000/api/v1/health

# পাবলিক ডোমেন ও এসএসএল সার্টিফিকেট ভ্যালিডেশন
curl -i https://<YOUR_DOMAIN_NAME>/api/v1/health
```

---

## ৪. মনিটরিং, অবজার্ভেবিলিটি ও হেলথ-চেক (Observability & Monitoring)

### হেলথ চেক এণ্ডপয়েন্ট: `GET /api/v1/health`
রেসপন্স স্ট্রাকচার:
```json
{
  "status": "healthy",
  "service": "schoolpro-central-api",
  "version": "1.0.0",
  "timestamp": "2026-10-03T14:00:00.000Z",
  "uptimeSeconds": 86400,
  "database": {
    "status": "connected"
  },
  "memory": {
    "rssMb": 98,
    "heapUsedMb": 54,
    "heapTotalMb": 72
  }
}
```

### মেট্রিক্স এণ্ডপয়েন্ট: `GET /api/v1/metrics`
* Prometheus বা ডেডিকেটেড স্ক্র্যাপার দ্বারা নোড আপটাইম, সিপিইউ ব্যবহার এবং মেমোরি কনজাম্পশন ট্র্যাক করা যায়।

### লাইভ কন্টেইনার লগ পর্যবেক্ষণ:
```bash
# সব কন্টেইনারের সমন্বিত লাইভ লগ
docker compose -f docker-compose.prod.yml logs -f

# নির্দিষ্ট এপিআই কন্টেইনার লগ
docker logs -f schoolpro-api --tail 100

# ক্যাডি রিভার্স প্রক্সি লগ (JSON এক্সেস লগ)
docker logs -f schoolpro-caddy --tail 100
```

---

## ৫. ডেটাবেস ব্যাকআপ ও ডিজাস্টার রিকভারি এসওপি (Database Backup & Disaster Recovery)

### ক. স্বয়ংক্রিয় দৈনিক ব্যাকআপ শিডিউল (Crontab):
```bash
sudo crontab -e
```
নিচের লাইনটি যুক্ত করুন (প্রতিদিন রাত ২:০০ টায় স্বয়ংক্রিয় ব্যাকআপ নিবে এবং ১৪ দিনের পুরোনো ব্যাকআপ প্রুন করবে):
```cron
0 2 * * * /opt/schoolpro/deploy/scripts/backup-db.sh >> /var/log/schoolpro_backup.log 2>&1
```

### খ. অন-ডিমান্ড ম্যানুয়াল ব্যাকআপ গ্রহণ:
```bash
chmod +x /opt/schoolpro/deploy/scripts/backup-db.sh
/opt/schoolpro/deploy/scripts/backup-db.sh
```
*ব্যাকআপ ফাইল গন্তব্য:* `/opt/schoolpro/backups/schoolpro_db_YYYYMMDD_HHMMSS.sql.gz`

### গ. ডেটাবেস রিস্টোরেশন পদ্ধতি (Disaster Recovery):
```bash
chmod +x /opt/schoolpro/deploy/scripts/restore-db.sh
/opt/schoolpro/deploy/scripts/restore-db.sh /opt/schoolpro/backups/schoolpro_db_20261003_120000.sql.gz
```
*স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে ব্যবহারকারীর নিশ্চয়তা (yes) গ্রহণ করবে, আনজিপ করে পোস্টগ্রেস এ ইনজেক্ট করবে এবং এপিআই সার্ভিস রিস্টার্ট দিয়ে সংযোগ সতেজ করবে।*

---

## ৬. উইন্ডোজ ডেস্কটপ ক্লায়েন্ট প্যাকেজিং ও রিলিজ ডিস্ট্রিবিউশন (Installer Build SOP)

### ক. ইনো সেটআপ স্ট্যান্ডার্ড ইনস্টলার (`.exe`):
1. উইন্ডোজ বিল্ড মেশিনে টার্মিনাল ওপেন করুন:
   ```powershell
   cd deploy
   powershell -ExecutionPolicy Bypass -File build-windows-installer.ps1 -Version "1.0.0"
   ```
2. স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে সমস্ত মডিউল `dist/win-unpacked` এ প্যাকেজ করবে এবং ইনো সেটআপ কম্পাইলারের মাধ্যমে `dist/installer/SchoolPro_Setup_v1.0.0.exe` তৈরি করবে।
3. তৈরি হওয়া ফাইলের SHA-256 হ্যাশ চেকসাম প্রিন্ট করবে।

### খ. উইন্ডোজ ১০/১১ আধুনিক MSIX প্যাকেজিং:
```powershell
cd deploy
powershell -ExecutionPolicy Bypass -File build-msix-package.ps1 -Version "1.0.0"
```
*MSIX প্যাকেজ `dist/msix/SchoolPro_1.0.0.0_x64.msix` হিসেবে সংকলিত হবে।*

### গ. সেন্ট্রাল ক্লাউডে অটো-আপডেট পাবলিশিং:
সুপার অ্যাডমিন প্যানেল (`/super-admin/releases`) অথবা এপিআই-এর মাধ্যমে:
```bash
curl -X POST https://<YOUR_DOMAIN>/api/v1/updates/publish \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.1",
    "channel": "STABLE",
    "installerUrl": "https://<YOUR_DOMAIN>/uploads/SchoolPro_Setup_v1.0.1.exe",
    "sha256": "4b5d...",
    "releaseNotes": "Emergency security updates and performance enhancements.",
    "isMandatory": true
  }'
```
*সকল কানেক্টেড ক্লায়েন্ট তাৎক্ষণিকভাবে ডিজিটাল Ed25519 সিগনেচার যাচাইপূর্বক স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ডে নতুন সংস্করণ ডাউনলোড ও ইন্সটল করবে।*

---

## ৭. ক্রিপ্টোগ্রাফিক কি-ম্যানেজমেন্ট ও রিমোট কন্ট্রোল এসওপি (Key Management & Remote Control)

### ক. সেন্ট্রাল Ed25519 অথরিটি কি জেনারেশন:
```bash
cd packages/crypto-utils
node dist/cli-keygen.js
```
*প্রাইভেট কীটি সেন্ট্রাল ক্লাউড সার্ভারের `.env.production` ফাইলে সংরক্ষিত থাকবে। পাবলিক কীটি ক্লায়েন্ট ডিস্ট্রিবিউশন প্যাকেজে বিল্ট-ইন থাকবে।*

### খ. জরুরি মুহূর্তে তাৎক্ষণিক স্কুল নিষ্ক্রিয়করণ (Emergency Suspension):
1. সুপার অ্যাডমিন প্যানেলে প্রবেশ করুন (`https://<YOUR_DOMAIN>/super-admin`)।
2. নির্দিষ্ট প্রতিষ্ঠানের পাশে **"Suspend School"** বাটনে ক্লিক করুন এবং কারণ লিপিবদ্ধ করুন।
3. ক্লায়েন্ট মেশিনের পরবর্তী হার্টবিটে (সর্বোচ্চ ৩০ সেকেন্ডের মধ্যে) ডেস্কটপ সফটওয়্যার তাৎক্ষণিক সেশন টার্মিনেট করে সফটওয়্যার লক স্ক্রিন সক্রিয় করবে।

### গ. সিস্টেম ক্লক ট্যাম্পারিং অ্যালার্ট ম্যানেজমেন্ট:
* কোনো ক্লায়েন্ট পিসির সিস্টেম টাইম পেছনে ঘুরিয়ে লাইসেন্স অপব্যবহার করার চেষ্টা করলে সফটওয়্যার **"Security Alert: Clock Tampering Detected"** দেখিয়ে লক হয়ে যাবে।
* সমাধান: ব্যবহারকারীকে উইন্ডোজ সেটিংসে গিয়ে "Set time automatically" চালু করে ইন্টারনেট টাইম সার্ভারের সাথে সিঙ্ক করতে হবে। সময় সঠিক হলে ডেস্কটপ শেলের মোনোটোনিক ওয়াচডগ অটোমেটিকালি ক্লক ভেরিফাই ও পুনরায় আনলক করবে।

---

## ৮. ট্রাবলশুটিং ও ইনসিডেন্ট রেসপন্স প্লেবুক (Incident Playbook)

| সমস্যা | সম্ভাব্য কারণ | তাৎক্ষণিক সমাধান |
|---|---|---|
| **API 502 Bad Gateway** | NestJS এপিআই ক্র্যাশ বা ডাটাবেস সংযোগ বিচ্ছিন্ন | `docker compose -f docker-compose.prod.yml restart api` এবং `docker logs schoolpro-api` পর্যবেক্ষণ করুন। |
| **Caddy SSL Error** | ডোমেন আইপি সার্ভারের পাবলিক আইপির সাথে অমিল | DNS এ 'A' রেকর্ড ঠিকঠাক পয়েন্ট করছে কিনা যাচাই করুন: `dig +short yourdomain.com`। |
| **PostgreSQL Out of Disk** | ব্যাকআপ বা লগ ফাইল দ্বারা ড্রাইভ পূর্ণ | `df -h` দিয়ে ডিস্ক স্পেস দেখুন; `find /opt/schoolpro/backups -mtime +14 -delete` দিয়ে পুরোনো ব্যাকআপ মুছুন। |
| **Client Sync Queue Backlog** | ইন্টারনেট বিচ্ছিন্ন বা সার্ভার আনরিচেবল | ইন্টারনেট সংযোগ পুনর্স্থাপন হলে স্বয়ংক্রিয় এক্সপোনেনশিয়াল ব্যাকঅফ সিঙ্ক কার্যকর হবে। ম্যানুয়াল সিঙ্কের জন্য ক্লায়েন্টে "Sync Now" চাপুন। |
| **Client Lockout after Battery Loss** | মাদারবোর্ড ব্যাটারি নষ্ট হয়ে উইন্ডোজ সময় ২০০০ সালে রিসেট | পিসির ডেট-টাইম বর্তমান সময়ে সেট করুন এবং "Verify & Re-Sync Clock" বাটনে ক্লিক করুন। |

---
**SchoolPro Technical Operations & Systems Engineering Team**
*স্বত্বাধিকার © ২০২৬ SchoolPro Management Systems. সর্বস্বত্ব সংরক্ষিত।*
