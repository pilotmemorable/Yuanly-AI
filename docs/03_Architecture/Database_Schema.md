# Yuanly AI - Database Schema

## 1. Overview
The database is designed for high concurrency (especially during peak tourism seasons) and fast read access for the "Discovery" feed. A hybrid approach (SQL for transactions, NoSQL for the feed/logs) is recommended.

## 2. Core Tables (Relational)

### Table: `Users`
- `user_id` (PK, UUID)
- `wechat_id` (Unique, String)
- `email` (String)
- `full_name` (String)
- `membership_level` (Enum: GUEST, SILVER, GOLD, VIP)
- `preferred_language` (Enum: CN, EN, TR)
- `created_at` (Timestamp)

### Table: `Merchants`
- `merchant_id` (PK, UUID)
- `business_name` (String)
- `category` (Enum: PARAGLIDING, BALLOON, TOUR, HOTEL)
- `location` (Geography/String)
- `rating` (Float)
- `is_verified` (Boolean)
- `commission_rate` (Float)
- `contact_info` (JSON)

### Table: `Experiences` (The "Products")
- `experience_id` (PK, UUID)
- `merchant_id` (FK)
- `title` (String)
- `description` (Text)
- `price_cny` (Decimal)
- `duration` (String)
- `images` (Array/JSON)
- `tags` (Array)

### Table: `Bookings`
- `booking_id` (PK, UUID)
- `user_id` (FK)
- `experience_id` (FK)
- `booking_date` (Date)
- `slot_time` (Timestamp)
- `status` (Enum: PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `total_amount` (Decimal)
- `payment_ref` (String - WeChat/Alipay ID)

### Table: `Reviews`
- `review_id` (PK, UUID)
- `booking_id` (FK)
- `user_id` (FK)
- `rating` (Integer 1-5)
- `comment` (Text)
- `media_urls` (Array)

## 3. AI & Log Tables (NoSQL/Document)
- **`User_Interactions`**: Logs of every AI interaction to refine the recommendation engine.
- **`AI_Agent_States`**: Stores the current state of ongoing voice bookings.
- **`Discovery_Cache`**: Pre-calculated "Trending" activities for the Rednote feed.
