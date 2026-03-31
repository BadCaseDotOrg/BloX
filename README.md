# BloX Browser Extension

![BloX Logo](./badcases-blox/img/icon128.png) <!-- Replace with your actual icon path -->

**BloX** is a browser extension that tracks and showcases users who have blocked you on X (formerly Twitter). It provides a collapsible interface panel on all X pages, a Trophy Room for your top blockers, and tools to backup and restore your blocker data.  

---

## 📖 Table of Contents

- [Key Features](#key-features)  
- [Screenshots](#screenshots)  
- [Installation](#installation)  

---

- **Real-Time Block Tracking**: Automatically detects and logs encounters whenever a comment from a blocked user is identified.

- **Conversation Archive**: Instantly lookup and review your full interaction history with blocked users to maintain context.

- **The Trophy Room**: Showcase your "greatest hits" by adding your top 10 most notable blocks to a dedicated hall of fame.

- **Secure Data Portability**: Full backup and restore functionality for your complete blocker list and Trophy Room stats.

- **Platform Compatibility**: Optimized for a seamless experience across both desktop and mobile browsers.

---

## Screenshots

**Main Panel (Desktop)**  
<img src="./img/desktop_panel.png" alt="Desktop Main Panel" width="600">

**Trophy Room (Desktop)**  
<img src="./img/desktop_trophy.png" alt="Desktop Trophy Room" width="600">

**Trophy Room with Settings (Desktop)**  
<img src="./img/desktop_trophy_settings.png" alt="Desktop Trophy Room Settings" width="600">

**Main Panel (Mobile)**  
<img src="./img/mobile_panel.jpg" alt="Mobile Main Panel" width="300">

**Trophy Room (Mobile)**  
<img src="./img/mobile_trophy.jpg" alt="Mobile Trophy Room" width="300">

**Trophy Room with Settings (Mobile)**  
<img src="./img/mobile_trophy_settings.jpg" alt="Mobile Trophy Room Settings" width="300">

---

## Installation

### Chrome Desktop (Recommended for Desktop)

1. Download the latest ZIP release from [Releases](https://github.com/BadCaseDotOrg/BloX/releases).
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle top-right).
4. Click **Load unpacked** and select the extracted folder from the ZIP.

---

### Quetta Mobile (Recommended for Mobile)

1. Download the latest ZIP release from [Releases](https://github.com/BadCaseDotOrg/BloX/releases).
2. Open **[Quetta Mobile](https://play.google.com/store/apps/details?id=net.quetta.browser)**, go to **Settings → Extensions**, and scroll to the bottom and select **Developer options**.
3. Enable **Developer mode** (toggle in the upper right).
4. Tap **(from .zip/.crx/.user.js)** and select the downloaded ZIP file.
5. The extension will now be installed and appear in your Quetta extensions list.

---

### Firefox Nightly Desktop (using CRX Installer)

1. Download the latest CRX release from [Releases](https://github.com/BadCaseDotOrg/BloX/releases).
2. Download and install **Firefox Nightly**:  
   - **Desktop:** [Firefox Nightly for Windows/macOS/Linux](https://www.mozilla.org/firefox/channel/desktop/)
3. Install the **CRX Installer** add-on from [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/crxinstaller/).
4. Go to `about:config` in the address bar and disable `xpinstall.signatures.required` to allow unsigned extensions.
5. Open **CRX Installer** from the Firefox extension menu, tap **Choose File**, and select the downloaded CRX file, a prompt will appear to install the extension.
6. The extension will now appear in your add-ons list and is active.


### Firefox Nightly Mobile (using CRX Installer)

1. Download the latest CRX release from [Releases](https://github.com/BadCaseDotOrg/BloX/releases).
2. Download and install **Firefox Nightly**:  
   - **Android:** [Firefox Nightly for Developers on Google Play](https://play.google.com/store/apps/details?id=org.mozilla.fenix)
3. Install the **CRX Installer** add-on from [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/crxinstaller/).
4. Go to `about:config` in the address bar and disable `xpinstall.signatures.required` to allow unsigned extensions.
5. Open **CRX Installer** from the Firefox extension menu, tap **Choose File**, and select the downloaded CRX file — it will automatically create a `.xpi` file.
6. Enable the **Debug menu** in Firefox Nightly:  
   - Go to **Settings → About Firefox Nightly**.
   - Tap the **Firefox logo** multiple times until you see “Debug menu enabled”.
7. Go back to **Settings → Install extension from file**, and select the `.xpi` file that CRX Installer created.
8. The extension will now appear in your add-ons list and is active.

