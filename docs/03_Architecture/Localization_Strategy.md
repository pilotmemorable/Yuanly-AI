# Yuanly AI - Global Localization & Language Strategy

## 1. Language Detection & Initialization
Yuanly implements a "Zero-Friction" language entry system to ensure users feel welcome immediately.

### A. Auto-Detection (The Smart Start)
1. **System Locale Check:** Upon first launch, the app queries the device's system language.
2. **Priority Mapping:**
   - If System == `zh-CN` $\rightarrow$ Set default to **Simplified Chinese**.
   - If System == `en-US/GB` $\rightarrow$ Set default to **English**.
   - If System == `tr-TR` $\rightarrow$ Set default to **Turkish**.
   - Otherwise $\rightarrow$ Default to **English**.

### B. Manual Override (The User Choice)
- **Language Selector:** A prominent, easily accessible toggle in the Profile and Onboarding screens.
- **Supported Pairs:** Simplified Chinese $\leftrightarrow$ English $\leftrightarrow$ Turkish.
- **Persistence:** The selected language is saved to the user profile (DB) and synced across App and Web.

## 2. Real-Time Translation Layer
Beyond the UI, Yuanly provides a "Communication Bridge" for the tourist.

- **Text Translation:** In-app chat with merchants uses an AI-powered real-time translation engine.
- **Voice-to-Voice:** The AI Concierge can translate spoken phrases (e.g., "Where is the hotel?" $\rightarrow$ Turkish) for on-site use.

## 3. Technical Implementation
- **i18n Framework:** Use of standard i18n libraries (e.g., `react-i18next` or similar) for all UI strings.
- **Dynamic Content:** All experience descriptions in the DB are stored in multiple languages. If a translation is missing, the AI generates a high-quality one on-the-fly.
