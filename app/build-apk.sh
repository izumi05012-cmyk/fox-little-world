#!/usr/bin/env bash
# Builds 小窝.apk: the Android shell around xiaowo.izumi-xixi.com.
# Run from app/ (CI does this; locally it needs JDK 21 and the Android SDK).
# The android/ project is generated fresh each time, so nothing native is
# kept in the repo except this script and the config next to it.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf android
npx cap add android
npx capacitor-assets generate --android \
  --iconBackgroundColor '#f7e4de' --splashBackgroundColor '#faf6f2'

# the site asks for the microphone (voice messages), location (the weather
# outside the window) and the vibration motor (望舒's heartbeat); a WebView
# can only pass those on if the app holds them too
manifest=android/app/src/main/AndroidManifest.xml
sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#&\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\n    <uses-permission android:name="android.permission.VIBRATE" />#' "$manifest"
grep -q RECORD_AUDIO "$manifest"

(cd android && ./gradlew --no-daemon assembleRelease)

# sign with the app's own key, so a new build installs over the old one
tools=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
unsigned=android/app/build/outputs/apk/release/app-release-unsigned.apk
"$tools/zipalign" -f -p 4 "$unsigned" aligned.apk
"$tools/apksigner" sign --ks xiaowo.keystore --ks-key-alias xiaowo \
  --ks-pass pass:xiaowo-fox --key-pass pass:xiaowo-fox --out xiaowo.apk aligned.apk
rm aligned.apk
"$tools/apksigner" verify xiaowo.apk
echo "built app/xiaowo.apk"
