# Mobile (design fix)

Bu versiyada `@react-navigation/bottom-tabs` istifadə etmirik.
Alt menyu `react-native-paper` BottomNavigation ilə qurulub.

## Quraşdırma və Run
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

## Watchman recrawl warning (opsional)
```bash
watchman watch-del '/Users/khayyammammadli/Desktop/mobile'
watchman watch-project '/Users/khayyammammadli/Desktop/mobile'
```
