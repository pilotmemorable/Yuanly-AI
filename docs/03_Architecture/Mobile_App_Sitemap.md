# Yuanly AI - Mobile App Information Architecture

The app is designed as a "Super App" hybrid: Discovery-focused on the front, Utility-focused on the back.

## 1. Main Navigation (Tab Bar)

### Tab 1: Explore (The "Rednote" Feed)
- **Home Feed:** Infinite scroll of AI-curated activity cards (Photo/Video).
- **Search/Filter:** Search by activity (Paragliding, Hot Air Balloon, etc.), City, or "Vibe".
- **Trending:** What's popular among Chinese tourists right now.
- **Detail Page:**
    - High-res Gallery.
    - AI-generated summary of the experience.
    - Reviews & Ratings.
    - **Action:** [Book Now] $\rightarrow$ Triggers AI Agent or Direct Booking.

### Tab 2: AI Concierge (The "Brain")
- **Chat/Voice Interface:** Central hub for talking to the AI.
- **Quick Actions:** "Find me a tour for tomorrow", "Change my booking", "Translate this".
- **Booking Status:** Real-time updates on current and upcoming trips.

### Tab 3: My Trips (The "Wallet")
- **Upcoming:** List of confirmed bookings with QR Tickets.
- **History:** Past experiences and a "Re-book" option.
- **Wishlist:** Saved experiences from the Explore tab.

### Tab 4: Profile & Membership
- **User Profile:** Name, Membership Level (Guest/Silver/Gold), Bio.
- **Payment Methods:** Linked WeChat Pay / Alipay / Cards.
- **Settings:** Language (CN/EN), Security (2FA), Notifications.
- **Merchant Mode (Toggle):** Switch to B2B Dashboard if the user is a provider.

## 2. The B2B Dashboard (Merchant View)
*Accessible via Profile $\rightarrow$ Switch to Business*
- **Dashboard:** Total earnings, Today's bookings.
- **Inventory/Calendar:** Date/Time slot management.
- **AI Agent Settings:** Configure the voice agent's personality and rules.
- **Digital Portfolio:** Upload/Edit photos, videos, and descriptions.
- **Analytics:** Where are my customers coming from? (Rednote, WeChat, etc.)

## 3. Core Overlays & Modals
- **Booking Flow:** Selection $\rightarrow$ Date/Time $\rightarrow$ AI Confirmation $\rightarrow$ Payment $\rightarrow$ Success.
- **2FA Prompt:** Biometric or SMS verification for secure actions.
- **Sharing Sheet:** Native integration with WeChat, Rednote, Instagram.
