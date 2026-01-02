# Mobil quraşdırma (npm ERESOLVE fix)

Səndə npm səhvən `react-native@0.83.x` çəkməyə çalışır (bu da React 19 istəyir).
Bu layihədə `react-native` **dəqiq** `0.74.5` olmalıdır (Expo SDK 51).

## Addımlar
```bash
cd mobile
rm -rf node_modules package-lock.json
npm cache clean --force

# npm sərt peer check edirsə:
npm install --legacy-peer-deps

# sonra expo tərəfdə uyğunlaşdırma:
npx expo install --fix

npx expo start
```

## Əgər yenə react-native 0.83 görürsənsə
Bu əmrlə yoxla:
```bash
npm ls react-native
```

`react-native@0.74.5` görməlisən.

## Server URL
`src/config.ts`:
- Android emulator: http://10.0.2.2:4000
- iOS simulator: http://localhost:4000
- Real telefon: http://<PC_LAN_IP>:4000
