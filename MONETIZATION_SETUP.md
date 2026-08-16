# Monetization & Store Setup — resume guide

This is the pick-up-later guide for shipping in-app purchases and ads. The **code is done**; what
remains is Google Play / RevenueCat **account setup** (things only you can do), then a ~5-minute code
finish. Read "Where we are" then work the checklist top to bottom.

---

## Where we are

| Step | Status |
|---|---|
| 1. Entitlements foundation (`Monetization`) | ✅ done |
| 2. Feature gating (Insights, Sandbox editor, Database editor) | ✅ done |
| 3. Store screen (Start-menu + Settings) | ✅ done |
| 4. Ads (AdMob interstitial at window close, EU consent, frequency cap) | ✅ done, builds natively |
| 5. Real IAP (RevenueCat) | ⏳ **blocked on account setup below** |
| 6. iOS | ⛔ not started |

Everything currently runs under **`DEV_UNLOCK_ALL = true`** (in `ui/js/monetization.js`), so in the
prototype **all features are unlocked and no ads show**. Going live = do the checklist, then flip that
flag to `false`.

### Already wired in the code (nothing to do here now)
- `ui/js/monetization.js` — entitlements, product catalog, `owns()/hasAds()/purchase()/restore()`, dev provider.
- `ui/js/ads.js` — interstitial orchestration + `AD_CONFIG` (currently **Google TEST ad ids**).
- `ui/js/revenuecat.js` — the real billing provider, **inert** until you paste an SDK key.
- `ui/js/screen-store.js` — the Store UI.
- `android/app/build.gradle` + `android/keystore.properties` — **release signing** is set up.
- `@capacitor-community/admob@8.0.0` installed; AdMob **App ID in the Android manifest** = Google TEST id.

### Build artifacts (rebuild anytime — see "Commands")
- **Signed release App Bundle** → `android/app/build/outputs/bundle/release/app-release.aab` ← upload this to Play.
- Debug APK → `android/app/build/outputs/apk/debug/app-debug.apk` ← for local playtesting.

### ⚠️ Keep these safe (gitignored, back them up)
- `android/upload-keystore.jks` and `android/keystore.properties` — your release signing key + passwords
  (password: `FootballAgent2026`). Losing them means you can't update the published app (resettable via
  Play App Signing, but back them up anyway).

---

## Your checklist (Google Play + RevenueCat)

Do these in order. Several have verification lag — start early.

### A. Google Play Developer account
- [ ] Finish sign-up at play.google.com/console ($25 one-time). *(Currently stuck on phone verification —
      retry with another number or contact Google support if the call/SMS never arrives.)*

### B. Merchant / payments profile — **start this first once you're in**
- [ ] Play Console → **Setup → Payments profile**. Identity + bank + tax verification can take **days** and
      blocks selling anything. Kick it off immediately.

### C. Create the app
- [ ] Create app **`ch.jens.footballagent`** (package name is **locked** once uploaded), type **Game**, **Free**.
- [ ] **Data safety** form — declare that the **AdMob** SDK collects data (Google provides the disclosure text).
- [ ] Privacy policy URL, content rating questionnaire, target audience, app category.

### D. Get a build onto Internal Testing
- [ ] Upload **`app-release.aab`** to the **Internal testing** track.
- [ ] Add your email as a **tester**, and also as a **License tester** (Setup → License testing) so test
      purchases don't charge real money.
- [ ] Install the app **via the internal-testing link** — a sideloaded APK can't see the products.

### E. Create the 8 in-app products
Play Console → **Monetize → Products → In-app products**. **Product IDs must match exactly** (the app keys
off them):

| Product ID | Type | Suggested price | Unlocks (for RevenueCat) |
|---|---|---|---|
| `remove_ads` | one-time, non-consumable | €1.99 | removeAds |
| `insights` | one-time, non-consumable | €1.99 | insights |
| `editor` | one-time, non-consumable | €1.99 | editor |
| `pro` | one-time, non-consumable | €5.99 | removeAds + insights + editor |
| `sandbox` | one-time, non-consumable | €9.99 | removeAds + insights + editor + sandbox |
| `supporter_2` | one-time, **consumable** | €1.99 | supporter |
| `supporter_5` | one-time, **consumable** | €4.99 | supporter |
| `supporter_10` | one-time, **consumable** | €9.99 | supporter |

(Unlocks are non-consumable = bought once, owned forever. Supporter packs are **consumable** so a fan can
donate again.)

### F. RevenueCat
- [ ] Create a RevenueCat account + project (free up to ~$2.5k/mo).
- [ ] Add the **Google Play app**: package name + a **Play service-account JSON** (Play Console →
      Setup → API access → create a service account, grant product/financial permissions, download the JSON,
      upload it to RevenueCat — this lets RC verify purchases).
- [ ] Create **Entitlements**: `removeAds`, `insights`, `editor`, `sandbox`, `supporter`.
- [ ] **Attach products to entitlements** per the table's last column (one product can grant several — that's
      how the bundles work).
- [ ] Copy the **Android public SDK key**.

---

## Finishing Step 5 (code — ~5 min, do this once E + F are done)

1. `npm i @revenuecat/purchases-capacitor` then `npx cap sync android`
2. In `ui/js/revenuecat.js` → `REVENUECAT_CONFIG.apiKeyAndroid` = your RevenueCat Android public key.
3. In `ui/js/monetization.js` → set `DEV_UNLOCK_ALL = false`.
4. Confirm the plugin's method names/return shapes against the installed version (the calls in
   `revenuecat.js` follow the documented API and are wrapped defensively).
5. Rebuild the AAB, upload a new version to Internal testing, and test a real purchase + **Restore**.

---

## Going live with ads (when ready to publish)

Currently ads use **Google test ids** and won't earn — that's required during development. To go live:
1. `ui/js/ads.js` → `AD_CONFIG.interstitial` = your real AdMob **interstitial ad-unit id**; set
   `AD_CONFIG.testing = false`.
2. `android/app/src/main/AndroidManifest.xml` → replace the AdMob **`APPLICATION_ID`** meta-data value with
   your real AdMob **App ID**.
3. Make sure the **EU consent (UMP)** message is configured in your AdMob console (required for your DACH
   audience — the app already requests it at init).

To **see the test ads while developing**: `DEV_UNLOCK_ALL = true` makes `removeAds` read as owned, which
suppresses ads. Flip it to `false` (features then unlock via the in-app Store, instantly) and advance to a
transfer-window close (twice a season).

---

## Step 6 — iOS (later)

The web codebase is shared, so the port is mostly config:
1. `npx cap add ios` (needs a **Mac + Xcode** and an **Apple Developer account**, $99/yr).
2. IAP: RevenueCat also covers StoreKit — add the **iOS app** in RevenueCat with its own key, put it in
   `REVENUECAT_CONFIG.apiKeyIos`, and create the matching products in **App Store Connect**.
3. AdMob iOS: add **`GADApplicationIdentifier`** + **SKAdNetwork** ids to `Info.plist`, and the **ATT**
   (App Tracking Transparency) prompt.
4. Audio: iOS blocks autoplay harder — verify music/SFX start on first user gesture.

---

## Commands (rebuild)

```bash
node tests/run.js                                     # full test suite
node scripts/build-mobile.js                          # bundle web -> dist/mobile
npx cap sync android                                  # link native + copy web

# from android/ , with JAVA_HOME set to Android Studio's JBR:
./gradlew assembleDebug     # debug APK  (playtesting)
./gradlew bundleRelease     # signed release AAB (upload to Play)
```

---

## Pricing / product model reference (from the plan)

- **Bundles:** Pro €5.99 (Remove Ads + Insights + Database Editor) · Full Sandbox €9.99 (everything + edit
  ages/names/abilities/your reputation & finances).
- **Individual unlocks** (players may want just one): Remove Ads · Enhanced Insights · Database Editor, €1.99 each.
- **Supporter packs** €1.99 / €4.99 / €9.99 — "buy me a coffee", adds a supporter badge (consumable so fans
  can give again).
- **Ads:** one interstitial at each transfer-window close (2×/season), frequency-capped, gone with Remove
  Ads/Pro. Kept minimal — the point is to nudge the €1.99 removal, not to earn from ads.
- Real club names/logos import stays **free** (legal, and it's what courts the paying customizer crowd).
