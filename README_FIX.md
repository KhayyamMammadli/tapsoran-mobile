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

## Əgər Android emulator-dasansa
`mobile/src/config.ts`:
- Android emulator: `http://10.0.2.2:4000`
