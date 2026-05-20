Place your app icon image(s) in this folder.

- Recommended main icon: `app-icon.png` (1024x1024 PNG, square, no transparency recommended for Android adaptive foreground).
- Expo will generate required sizes from this single `icon` entry in `app.json`.

Steps:
1. Save the provided image as `app-icon.png` and put it in this folder.
2. Run your Expo or native build (e.g. `expo start` or `eas build`) so the icon is bundled.

If you need Android adaptive icons, keep a square foreground image and set `android.adaptiveIcon.backgroundColor` in `app.json`.
