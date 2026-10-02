# Yuanly AI - Detailed API Specifications

## 1. General API Guidelines
- **Protocol:** RESTful API with JSON payloads.
- **Authentication:** JWT (JSON Web Token) for users/merchants; API Keys for system-to-system (AI Agent $\rightarrow$ Backend).
- **Versioning:** `/v1/` prefix for all endpoints.
- **Localization:** `Accept-Language` header used to return content in CN, EN, or TR.

## 2. Core Endpoints

### A. Authentication
`POST /v1/auth/wechat-login`
- **Request:** `{ "wechat_token": "string", "device_info": "json" }`
- **Response:** `{ "token": "jwt_string", "user": { "id": "uuid", "level": "SILVER" } }`

### B. Experience Discovery
`GET /v1/experiences/explore`
- **Query Params:** `vibe=adventure&location=fethiye&page=1`
- **Response:** 
  ```json
  {
    "experiences": [
      {
        "id": "uuid",
        "title": "Azure Sky Paragliding",
        "price": 800,
        "currency": "CNY",
        "rating": 4.9,
        "thumbnail": "url",
        "ai_badge": "Top Recommended for You"
      }
    ],
    "cursor": "string"
  }
  ```

### C. AI Booking (The " la la la la " Logic)
`POST /v1/booking/hold`
- **Request:** `{ "user_id": "uuid", "experience_id": "uuid", "slot_id": "uuid" }`
- **Response:** `{ "hold_id": "uuid", "expires_at": "timestamp", "status": "success" }`

`POST /v1/payment/initiate`
- **Request:** `{ "hold_id": "uuid", "payment_method": "wechat_pay" }`
- **Response:** `{ "payment_url": "https://api.wechat.com/pay/...", "transaction_id": "uuid" }`

## 3. Error Handling
Standardized error response:
`{ "error_code": "ERR_SLOT_TAKEN", "message": "This slot was just booked by another traveler. Would you like to see alternatives?", "suggested_slots": [...] }`
