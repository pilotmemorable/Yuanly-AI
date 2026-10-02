# Yuanly AI - Payment Engine Specifications

## 1. Payment Architecture
Yuanly utilizes a hybrid payment gateway to support the specific needs of Chinese tourists while maintaining global compatibility.

### A. Supported Gateways
- **WeChat Pay:** Primary for Mainland China users.
- **Alipay:** Secondary for Mainland China users.
- **Stripe/PayPal:** For international users or corporate payments.

## 2. Transaction Flow (User Experience)
1. **Intent:** User confirms a booking via AI Agent.
2. **Session:** AI Agent calls `/payment/initiate` $\rightarrow$ System creates a unique `transaction_id`.
3. **Redirect:** Mobile app opens a secure WebView or deep-links directly to the WeChat/Alipay app.
4. **Verification:** User completes biometric authentication in the payment app.
5. **Webhook:** Payment gateway sends a secure server-to-server notification to Yuanly.
6. **Completion:** AI Agent notifies the user: *"Payment received! Your magic journey is now secured."*

## 3. Financial Logic
- **Currency Handling:** All internal pricing is stored in USD/EUR but displayed in CNY (Chinese Yuan) based on real-time exchange rates.
- **Commission Model:** 
    - `Total Amount` = `Experience Price` + `Service Fee`.
    - `Merchant Payout` = `Experience Price` - `Yuanly Commission`.
- **Refund Policy:**
    - Automated refunds based on merchant-defined tiers (e.g., 100% refund if cancelled 48h prior).

## 4. Security Measures
- **PCI-DSS Compliance:** No credit card data is stored on Yuanly servers.
- **Idempotency Keys:** Every payment request has a unique key to prevent double-charging.
- **Fraud Detection:** AI monitors for unusual payment patterns (e.g., multiple high-value bookings from different IPs in short intervals).
