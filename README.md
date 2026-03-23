# BloX Chrome Extension

![BloX Logo](./assets/icon.png) <!-- Replace with your actual icon path -->

**BloX** is a Chrome extension that tracks and showcases users who have blocked you on X (formerly Twitter). It provides a **dark-mode interface**, a Trophy Room for your top blockers, and tools to backup and restore your blocker data.  

---

## 📖 Table of Contents

- [Key Features](#key-features)  
- [Screenshots](#screenshots)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Development](#development)  
- [Contributing](#contributing)  
- [License](#license)  
- [Support](#support)  
- [Changelog](#changelog)  

---

## Key Features

- Tracks users when a comment from a blocker is encountered  
- Lookup conversation history with blockers  
- Add blockers to the **Trophy Room** to showcase top 10 blocks  
- Backup and restore your blocker list and Trophy Room  
- Works on both desktop and mobile layouts  

---

## Screenshots

**Main Panel (Desktop)**  
![Desktop Main Panel](./img/desktop_panel.png)

**Trophy Room (Desktop)**  
![Desktop Trophy Room](./img/desktop_trophy.png)

**Trophy Room with Settings (Desktop)**  
![Desktop Trophy Room Settings](./img/desktop_trophy_settings.png)

**Main Panel (Mobile)**  
![Mobile Main Panel](./img/mobile_panel.jpg)

**Trophy Room (Mobile)**  
![Mobile Trophy Room](./img/mobile_trophy.jpg)

**Trophy Room with Settings (Mobile)**  
![Mobile Trophy Room Settings](./img/mobile_trophy_settings.jpg)

---

## Installation

### Chrome Desktop

1. Download the latest ZIP release from [Releases](https://github.com/YOUR_USERNAME/BloX/releases)  
2. Open Chrome and navigate to `chrome://extensions/`  
3. Enable **Developer mode** (toggle top-right)  
4. Click **Load unpacked** and select the extracted folder from the ZIP  

---

## Usage

- Open the BloX panel from the Chrome toolbar  
- View users who have blocked you  
- Add users to your Trophy Room to track top blockers  
- Use backup and restore to save or reload your data  

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher  
- npm  

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/BloX.git
cd BloX/badcases-blox
npm ci
