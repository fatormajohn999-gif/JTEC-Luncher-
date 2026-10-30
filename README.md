# JTEC Launcher

A minimalist, high-performance Android launcher built with React, TypeScript, Vite, and Capacitor, featuring native Kotlin integration and automated GitHub Actions APK builds.

---

## Reproducible Builds & GitHub Actions Setup

To prevent CI/CD failures such as:
```
Dependencies lock file is not found. Supported file patterns: package-lock.json, npm-shrinkwrap.json, yarn.lock.
```

`package-lock.json` has been generated locally via `npm install` and **must be tracked and committed to your Git repository**.

### 1. Commit `package-lock.json` to Git

Run the following commands in your terminal:

```bash
# Check status to confirm package-lock.json is detected
git status

# Stage package.json, package-lock.json, and the workflow
git add package.json package-lock.json .github/workflows/build-apk.yml

# Commit changes
git commit -m "chore: add package-lock.json and configure reproducible CI build"

# Push to your repository
git push origin main
```

> **Why this is critical:**
> GitHub Actions uses `actions/setup-node@v4` with `cache: 'npm'`. It requires `package-lock.json` to compute cache hashes and executes `npm ci` for deterministic, zero-drift installations.

---

## Local Development & Build Workflow

### Prerequisites
- Node.js 20+
- npm 10+
- JDK 17 (for native Android builds)
- Android SDK (API 30+ recommended)

### 1. Install Dependencies
```bash
npm ci
```

### 2. Run Dev Server
```bash
npm run dev
```

### 3. Build Web Bundle
```bash
npm run build
```

### 4. Sync with Capacitor Android
```bash
npx cap sync android
```
This copies the compiled assets from `dist/` to `android/app/src/main/assets/public/` and updates the native Capacitor plugin bindings.

### 5. Build Android APK Locally (Optional)
```bash
cd android
./gradlew assembleDebug
```
The resulting debug APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Native Android Architecture

- **HOME Intent Registration:** Configured in `android/app/src/main/AndroidManifest.xml` with:
  - `android.intent.category.HOME`
  - `android.intent.category.DEFAULT`
  - `android.permission.QUERY_ALL_PACKAGES`
  - `android:launchMode="singleTask"`
- **Native Kotlin Plugin:** `android/app/src/main/java/com/jteclauncher/app/JTECLauncherPlugin.kt`
  - Queries installed apps via Android `PackageManager`
  - Launches native activities
  - Opens Android App Info & Default Home settings
  - Delivers tactile haptic feedback
- **Native Activity:** `android/app/src/main/java/com/jteclauncher/app/MainActivity.kt` registers `JTECLauncherPlugin`.

---

## Automated GitHub Actions CI/CD

The workflow at `.github/workflows/build-apk.yml` runs on every push to `main`:
1. Checks out the repository
2. Configures Node.js 20 with `cache: 'npm'` and `cache-dependency-path: 'package-lock.json'`
3. Sets up JDK 17 and Android SDK
4. Runs `npm ci` for clean dependency resolution
5. Compiles the production bundle via `npm run build`
6. Syncs Capacitor Android (`npx cap sync android`)
7. Compiles the debug APK via Gradle (`./gradlew assembleDebug`)
8. Uploads the built APK as a workflow artifact named `jtec-launcher-debug-apk`
