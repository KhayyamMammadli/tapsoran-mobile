# Mobil quraşdırma (fix)

**Vacib:** Expo layihələrində `npm install` yerinə çox vaxt `npx expo install` istifadə etmək lazımdır (versiyaları Expo uyğunlaşdırır).

## Addımlar
```bash
cd mobile
rm -rf node_modules package-lock.json
npm cache clean --force
npx expo install
npx expo start
```

## Local backend-ə qoşulmaq
Default olaraq production API-yə gedir. Local üçün belə run elə:

**Fiziki telefon (LAN):**
```bash
EXPO_PUBLIC_API_URL=http://<KOMP_IP>:4000 npm run start:lan
```

**Android emulator:**
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npm run start
```

**iOS simulator:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start
```

> Qeyd: Android-də HTTP local üçün `usesCleartextTraffic` artıq `app.json`-da açıqdır.

## Chat: şəkil + səs mesajı
Bu layihədə chat üçün şəkil və səs mesajı dəstəyi əlavə olunub.
Əgər dependency çatışmırsa, işlət:
```bash
npx expo install expo-av
```

## Əgər Android emulator-dasansa
`mobile/src/config.ts`:
- Android emulator: `http://10.0.2.2:4000`
