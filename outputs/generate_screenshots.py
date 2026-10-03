#!/usr/bin/env python3
"""
Yuanly AI — App Store Screenshot Generator
Creates screenshots for iPhone 6.7", iPhone 6.5", and iPad 12.9"
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Colors
PRIMARY = (64, 224, 208)      # #40E0D0 Celestial Turquoise
PRIMARY_DARK = (43, 175, 176) # #2BAFB0
GOLD = (212, 175, 55)         # #D4AF37
ACCENT = (196, 30, 58)        # #C41E3A
BG = (250, 251, 252)          # #FAFBFC
SURFACE = (240, 242, 245)     # #F0F2F5
TEXT = (26, 26, 46)           # #1A1A2E
TEXT2 = (107, 114, 128)       # #6B7280
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Font paths
def get_font(size, bold=False):
    try:
        if bold:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
    except:
        return ImageFont.load_default()

def try_cjk_font(size, bold=False):
    """Try to find a CJK font for Chinese characters"""
    paths = [
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except:
            continue
    return get_font(size, bold)

# Device sizes
DEVICES = {
    "iphone-6.7": (1290, 2796),
    "iphone-6.5": (1242, 2688),
    "ipad-12.9": (2048, 2732),
}

def draw_phone_frame(draw, w, h):
    """Draw a phone status bar"""
    # Status bar
    draw.rectangle([0, 0, w, 60], fill=WHITE)
    # Time
    font = get_font(24, bold=True)
    draw.text((40, 20), "9:41", fill=TEXT, font=font)
    # Battery
    draw.rounded_rectangle([w-80, 25, w-40, 45], radius=4, outline=TEXT, width=2)
    draw.rounded_rectangle([w-75, 30, w-50, 40], radius=2, fill=TEXT)
    # Signal
    draw.text((w-180, 18), "📶", fill=TEXT, font=get_font(20))

def draw_logo(draw, x, y, size=60):
    """Draw the Yuanly 缘 logo"""
    # Circle background
    draw.ellipse([x, y, x+size, y+size], fill=PRIMARY)
    # 缘 character (use CJK font if available)
    font = try_cjk_font(int(size*0.6), bold=True)
    # Center the text
    bbox = draw.textbbox((0,0), "缘", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x + (size-tw)//2, y + (size-th)//2 - 2), "缘", fill=WHITE, font=font)
    # Gold AI dot
    dot_size = size // 7
    draw.ellipse([x+size-dot_size-4, y+4, x+size-4, y+4+dot_size], fill=GOLD)

def create_screenshot(device_name, width, height, screen_type, title_cn, title_en, subtitle):
    """Create a single screenshot"""
    img = Image.new('RGB', (width, height), BG)
    draw = ImageDraw.Draw(img)

    if "ipad" in device_name:
        # iPad has more space
        pad = 80
    else:
        pad = 40

    if screen_type == "explore":
        create_explore_screen(draw, img, width, height, pad)
    elif screen_type == "detail":
        create_detail_screen(draw, img, width, height, pad)
    elif screen_type == "ai":
        create_ai_screen(draw, img, width, height, pad)
    elif screen_type == "calendar":
        create_calendar_screen(draw, img, width, height, pad)
    elif screen_type == "qr":
        create_qr_screen(draw, img, width, height, pad)
    elif screen_type == "payment":
        create_payment_screen(draw, img, width, height, pad)

    # Add marketing title at top
    if "ipad" in device_name:
        title_y = 80
        title_size = 72
        sub_size = 36
    else:
        title_y = 100
        title_size = 56
        sub_size = 28

    # Title background gradient effect (simple)
    font_title = get_font(title_size, bold=True)
    font_sub = get_font(sub_size)

    # Draw title
    bbox = draw.textbbox((0,0), title_en, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((width-tw)//2, title_y), title_en, fill=PRIMARY, font=font_title)

    # Subtitle
    bbox = draw.textbbox((0,0), subtitle, font=font_sub)
    sw = bbox[2] - bbox[0]
    draw.text(((width-sw)//2, title_y + title_size + 10), subtitle, fill=TEXT2, font=font_sub)

    return img

def create_explore_screen(draw, img, w, h, pad):
    """Explore feed screen"""
    # Header
    top_y = 200
    draw_logo(draw, w//2 - 30, top_y, 60)
    draw.text((pad, top_y + 80), "Explore Turkey", fill=TEXT, font=get_font(40, bold=True))
    draw.text((pad, top_y + 130), "Discover your fateful connection", fill=TEXT2, font=get_font(24))

    # Search bar
    search_y = top_y + 180
    draw.rounded_rectangle([pad, search_y, w-pad, search_y+60], radius=30, fill=SURFACE, outline=(229,231,235))
    draw.text((pad+20, search_y+18), "Search experiences...", fill=TEXT2, font=get_font(24))

    # Category chips
    cat_y = search_y + 80
    cats = ["All", "Adventure", "Romantic", "Cultural", "Balloon"]
    x = pad
    for i, cat in enumerate(cats):
        font = get_font(22, bold=True)
        bbox = draw.textbbox((0,0), cat, font=font)
        cw = bbox[2] - bbox[0] + 40
        color = PRIMARY if i == 0 else SURFACE
        text_color = WHITE if i == 0 else TEXT2
        draw.rounded_rectangle([x, cat_y, x+cw, cat_y+44], radius=22, fill=color, outline=(229,231,235))
        draw.text((x+20, cat_y+10), cat, fill=text_color, font=font)
        x += cw + 10

    # Experience cards
    card_y = cat_y + 70
    card_h = 400
    cards = [
        {"title": "Azure Sky Paragliding", "price": "800", "rating": "4.9", "badge": "Global Favorite", "color": (100, 150, 200)},
        {"title": "Cappadocia Balloon", "price": "2500", "rating": "5.0", "badge": "Most Romantic", "color": (200, 150, 100)},
    ]

    for card in cards:
        # Card background
        draw.rounded_rectangle([pad, card_y, w-pad, card_y+card_h], radius=30, fill=card["color"])

        # Gradient overlay (simplified - dark at bottom)
        overlay = Image.new('RGBA', (w-2*pad, card_h), (0,0,0,0))
        odraw = ImageDraw.Draw(overlay)
        for i in range(card_h):
            alpha = int(min(180, i * 0.6))
            odraw.line([(0, card_h-i-1), (w-2*pad, card_h-i-1)], fill=(0,0,0,alpha))
        img.paste(overlay, (pad, card_y), overlay)

        # Badge
        badge_font = get_font(20, bold=True)
        draw.rounded_rectangle([pad+20, card_y+20, pad+180, card_y+50], radius=15, fill=(64,224,208,230))
        draw.text((pad+30, card_y+24), card["badge"], fill=WHITE, font=badge_font)

        # Title and price at bottom
        title_font = get_font(30, bold=True)
        draw.text((pad+20, card_y+card_h-80), card["title"], fill=WHITE, font=title_font)
        rating_font = get_font(22)
        draw.text((pad+20, card_y+card_h-45), f"⭐ {card['rating']} · Fethiye", fill=GOLD, font=rating_font)

        # Price tag
        price_font = get_font(26, bold=True)
        bbox = draw.textbbox((0,0), f"¥{card['price']}", font=price_font)
        pw = bbox[2] - bbox[0] + 30
        draw.rounded_rectangle([w-pad-pw-10, card_y+card_h-70, w-pad-10, card_y+card_h-25], radius=18, fill=ACCENT)
        draw.text((w-pad-pw+5, card_y+card_h-65), f"¥{card['price']}", fill=WHITE, font=price_font)

        card_y += card_h + 20

    # Tab bar
    tab_y = h - 120
    draw.rectangle([0, tab_y, w, h], fill=WHITE)
    draw.line([(0, tab_y), (w, tab_y)], fill=(234,234,234), width=2)
    tabs = [("🔍", "Explore", True), ("📅", "Trips", False), ("💬", "AI", False), ("👤", "Profile", False)]
    tab_w = w // 4
    for i, (icon, label, active) in enumerate(tabs):
        color = PRIMARY if active else TEXT2
        draw.text((tab_w*i + tab_w//2 - 15, tab_y+15), icon, fill=color, font=get_font(28))
        draw.text((tab_w*i + tab_w//2 - 20, tab_y+55), label, fill=color, font=get_font(18, bold=True))

def create_detail_screen(draw, img, w, h, pad):
    """Detail screen with booking"""
    top_y = 180

    # Hero image area
    img_h = 400
    draw.rectangle([0, top_y, w, top_y+img_h], fill=(100, 150, 200))

    # Content card (overlapping)
    card_y = top_y + img_h - 30
    draw.rounded_rectangle([0, card_y, w, h-100], radius=30, fill=BG)

    # Title
    draw.text((pad, card_y+20), "Azure Sky Paragliding", fill=TEXT, font=get_font(36, bold=True))
    draw.text((pad, card_y+65), "¥800 CNY", fill=PRIMARY, font=get_font(32, bold=True))

    # Info row
    info_y = card_y + 120
    infos = [("Location", "Fethiye"), ("Duration", "45 min"), ("Rating", "⭐ 4.9")]
    col_w = (w - 2*pad) // 3
    for i, (label, value) in enumerate(infos):
        x = pad + col_w * i
        draw.text((x, info_y), label, fill=TEXT2, font=get_font(18))
        draw.text((x, info_y+25), value, fill=TEXT, font=get_font(22, bold=True))

    # Divider
    draw.line([(pad, info_y+70), (w-pad, info_y+70)], fill=SURFACE, width=2)

    # Description
    draw.text((pad, info_y+90), "Experience Details", fill=TEXT, font=get_font(28, bold=True))
    draw.text((pad, info_y+130), "Experience the ultimate thrill of flying", fill=TEXT2, font=get_font(22))
    draw.text((pad, info_y+160), "over the Blue Lagoon of Oludeniz.", fill=TEXT2, font=get_font(22))

    # Slots
    slot_y = info_y + 220
    draw.text((pad, slot_y), "Available Slots", fill=TEXT, font=get_font(28, bold=True))
    slots = ["Oct 4 · 08:00", "Oct 4 · 11:00", "Oct 4 · 14:00"]
    x = pad
    for i, slot in enumerate(slots):
        font = get_font(20, bold=True)
        bbox = draw.textbbox((0,0), slot, font=font)
        sw = bbox[2] - bbox[0] + 30
        color = PRIMARY if i == 0 else SURFACE
        text_c = PRIMARY if i == 0 else TEXT
        draw.rounded_rectangle([x, slot_y+40, x+sw, slot_y+85], radius=12, fill=color, outline=PRIMARY if i==0 else SURFACE, width=2)
        draw.text((x+15, slot_y+50), slot, fill=text_c if i > 0 else WHITE, font=font)
        x += sw + 10

    # Book button
    btn_y = h - 200
    draw.rounded_rectangle([pad, btn_y, w-pad, btn_y+70], radius=35, fill=PRIMARY)
    draw.text((w//2 - 80, btn_y+20), "🤖 Book Now with AI", fill=WHITE, font=get_font(26, bold=True))

def create_ai_screen(draw, img, w, h, pad):
    """AI Concierge with dual-language"""
    top_y = 180

    # Header
    draw.text((w//2 - 80, top_y), "Yuanly AI", fill=TEXT, font=get_font(36, bold=True))
    draw.text((w//2 - 110, top_y+45), "Your Personal Turkey Guide", fill=TEXT2, font=get_font(22))

    # Orb
    orb_y = top_y + 100
    orb_cx = w // 2
    orb_r = 60
    # Glow
    for r in range(orb_r+30, orb_r, -2):
        alpha = int(50 * (1 - (r - orb_r) / 30))
        draw.ellipse([orb_cx-r, orb_y+60-r, orb_cx+r, orb_y+60+r], outline=(*PRIMARY, alpha))

    # Main orb
    draw.ellipse([orb_cx-orb_r, orb_y+60-orb_r, orb_cx+orb_r, orb_y+60+orb_r], fill=PRIMARY)
    draw.ellipse([orb_cx-40, orb_y+20, orb_cx+40, orb_y+100], fill=(*WHITE, 100))

    # Toggle
    tog_y = orb_y + 140
    tog_w = 280
    draw.rounded_rectangle([w//2-tog_w//2, tog_y, w//2+tog_w//2, tog_y+36], radius=18, fill=SURFACE, outline=PRIMARY, width=2)
    draw.text((w//2-tog_w//2+20, tog_y+8), "✓ Show Original + Translation", fill=PRIMARY, font=get_font(18, bold=True))

    # Chat messages
    chat_y = tog_y + 60
    messages = [
        ("AI", "Welcome to Turkey! I am Yuanly, your guide. What would you like to explore?", False),
        ("USER", "I want to book paragliding in Fethiye", True),
        ("AI", "Great! Found 'Azure Sky Paragliding'. Price: ¥800. Available: Oct 4, 08:00", False),
    ]

    for sender, text, is_user in messages:
        font = get_font(22)
        lines = [text[i:i+40] for i in range(0, len(text), 40)]
        bubble_h = 30 + len(lines) * 28

        if is_user:
            # User message (right aligned)
            bbox = draw.textbbox((0,0), text, font=font)
            tw = min(bbox[2]-bbox[0], w-2*pad-80)
            bx = w - pad - tw - 40
            draw.rounded_rectangle([bx, chat_y, w-pad, chat_y+bubble_h], radius=18, fill=PRIMARY)
            draw.text((bx+15, chat_y+10), text, fill=WHITE, font=font)
        else:
            # AI message (left aligned)
            # Avatar
            draw.ellipse([pad, chat_y, pad+30, chat_y+30], fill=PRIMARY)
            cjk_font = try_cjk_font(16, bold=True)
            draw.text((pad+7, chat_y+5), "缘", fill=WHITE, font=cjk_font)
            # Bubble
            bx = pad + 40
            draw.rounded_rectangle([bx, chat_y, w-pad, chat_y+bubble_h], radius=18, fill=SURFACE)
            draw.text((bx+15, chat_y+10), text, fill=TEXT, font=font)

            # Original text (translation display)
            orig_y = chat_y + bubble_h + 5
            draw.line([(bx+15, orig_y), (w-pad-15, orig_y)], fill=(220,220,220), width=1)
            draw.text((bx+15, orig_y+5), "CN → EN (auto-translated)", fill=TEXT2, font=get_font(16, bold=True))
            draw.text((bx+15, orig_y+28), "好的！我找到了'蓝天滑翔伞'. 价格: ¥800", fill=TEXT2, font=get_font(18))

            chat_y = orig_y + 55
        chat_y += bubble_h + 15

    # Input bar
    in_y = h - 130
    draw.rectangle([0, in_y, w, h], fill=WHITE)
    draw.line([(0, in_y), (w, in_y)], fill=(238,238,238), width=2)
    draw.ellipse([pad, in_y+15, pad+40, in_y+55], fill=SURFACE)
    draw.text((pad+12, in_y+20), "🎤", fill=TEXT, font=get_font(20))
    draw.rounded_rectangle([pad+50, in_y+18, w-pad-60, in_y+52], radius=18, fill=SURFACE)
    draw.text((pad+65, in_y+25), "Type a message...", fill=TEXT2, font=get_font(20))
    draw.ellipse([w-pad-50, in_y+15, w-pad-10, in_y+55], fill=PRIMARY)
    draw.text((w-pad-38, in_y+22), "➤", fill=WHITE, font=get_font(20))

def create_calendar_screen(draw, img, w, h, pad):
    """Calendar with bookings"""
    top_y = 180
    draw.text((pad, top_y), "My Calendar", fill=TEXT, font=get_font(36, bold=True))
    draw.text((pad, top_y+45), "Booking Calendar + Share", fill=TEXT2, font=get_font(22))

    # Month navigation
    nav_y = top_y + 100
    draw.text((pad, nav_y), "‹", fill=PRIMARY, font=get_font(40, bold=True))
    draw.text((w//2 - 60, nav_y+5), "October 2026", fill=TEXT, font=get_font(28, bold=True))
    draw.text((w-pad-30, nav_y), "›", fill=PRIMARY, font=get_font(40, bold=True))

    # Calendar grid
    grid_y = nav_y + 60
    cell_w = (w - 2*pad) // 7
    days = ["S", "M", "T", "W", "T", "F", "S"]
    for i, d in enumerate(days):
        draw.text((pad + cell_w*i + cell_w//2 - 8, grid_y), d, fill=TEXT2, font=get_font(20, bold=True))

    # Calendar days
    cal_y = grid_y + 35
    # October 2026 starts on Thursday
    offsets = [4, 5, 6, 0, 1, 2, 3]  # Thu=4, Fri=5, Sat=6, Sun=0...
    booking_days = {5: PRIMARY, 7: GOLD, 16: PRIMARY}  # Days with bookings

    day = 1
    for row in range(5):
        for col in range(7):
            if row == 0 and col < 4:
                continue  # Previous month days
            if day > 31:
                break
            cx = pad + cell_w * col + cell_w // 2
            cy = cal_y + row * 55 + 20

            if day in booking_days:
                color = booking_days[day]
                draw.rounded_rectangle([cx-25, cy-18, cx+25, cy+18], radius=10, fill=(*color, 40))
                draw.text((cx-12, cy-12), str(day), fill=color, font=get_font(22, bold=True))
                # Dot indicator
                draw.ellipse([cx-4, cy+15, cx+4, cy+23], fill=color)
            elif day == 3:
                draw.text((cx-10, cy-12), str(day), fill=PRIMARY, font=get_font(22, bold=True))
            else:
                draw.text((cx-10, cy-12), str(day), fill=TEXT, font=get_font(22))
            day += 1

    # Events list
    ev_y = cal_y + 5 * 55 + 20
    draw.text((pad, ev_y), "Upcoming Trips", fill=TEXT, font=get_font(28, bold=True))

    events = [
        (PRIMARY, "Paragliding - Premium Flight", "Oct 5, 08:00 · Fethiye · ¥800"),
        (GOLD, "Cappadocia Balloon Safari", "Oct 7, 05:30 · Cappadocia · ¥2500"),
    ]

    for color, title, date in events:
        ev_y += 60
        # Event card
        draw.rounded_rectangle([pad, ev_y, w-pad, ev_y+55], radius=14, fill=WHITE, outline=(238,238,238))
        # Color dot
        draw.ellipse([pad+15, ev_y+20, pad+25, ev_y+30], fill=color)
        # Title and date
        draw.text((pad+40, ev_y+8), title, fill=TEXT, font=get_font(22, bold=True))
        draw.text((pad+40, ev_y+32), date, fill=TEXT2, font=get_font(18))
        # Share buttons
        share_x = w - pad - 130
        for i, icon in enumerate(["📧", "💬", "💚"]):
            draw.rounded_rectangle([share_x + i*38, ev_y+12, share_x + i*38 + 32, ev_y+44], radius=16, fill=SURFACE)
            draw.text((share_x + i*38 + 6, ev_y+16), icon, fill=TEXT, font=get_font(16))

def create_qr_screen(draw, img, w, h, pad):
    """QR Ticket screen"""
    top_y = 200

    # Ticket card
    card_y = top_y
    card_h = 700
    card_w = w - 2*pad

    # Card
    draw.rounded_rectangle([pad, card_y, pad+card_w, card_y+card_h], radius=24, fill=WHITE)

    # Header
    header_h = 80
    draw.rounded_rectangle([pad, card_y, pad+card_w, card_y+header_h], radius=24, fill=PRIMARY)
    draw.rectangle([pad, card_y+header_h-20, pad+card_w, card_y+header_h], fill=PRIMARY)

    draw_logo(draw, pad+20, card_y+15, 50)
    draw.text((pad+85, card_y+20), "Yuanly", fill=WHITE, font=get_font(30, bold=True))
    cjk_font = try_cjk_font(28, bold=True)
    draw.text((pad+card_w-60, card_y+22), "缘", fill=(*WHITE, 120), font=cjk_font)

    # QR code area
    qr_y = card_y + header_h + 30
    qr_size = 250
    qr_x = pad + (card_w - qr_size) // 2

    # QR border
    draw.rounded_rectangle([qr_x-15, qr_y-15, qr_x+qr_size+15, qr_y+qr_size+15], radius=12, fill=WHITE, outline=SURFACE, width=3)

    # Generate QR-like pattern
    cell = qr_size // 8
    seed = "yuanly_qr_booking_1"
    for i in range(8):
        for j in range(8):
            idx = i * 8 + j
            val = (ord(seed[idx % len(seed)]) + idx * 7) % 2
            if val:
                draw.rectangle([qr_x + j*cell, qr_y + i*cell, qr_x + (j+1)*cell, qr_y + (i+1)*cell], fill=TEXT)

    # Corner markers
    for (ci, cj) in [(0,0), (0,5), (5,0)]:
        draw.rectangle([qr_x + cj*cell, qr_y + ci*cell, qr_x + (cj+3)*cell, qr_y + (ci+3)*cell], fill=TEXT)
        draw.rectangle([qr_x + (cj+1)*cell, qr_y + (ci+1)*cell, qr_x + (cj+2)*cell, qr_y + (ci+2)*cell], fill=WHITE)

    # Ticket info
    info_y = qr_y + qr_size + 30
    draw.text((pad+20, info_y), "Azure Sky Paragliding", fill=TEXT, font=get_font(28, bold=True))
    draw.text((pad+20, info_y+35), "Azure Sky · Fethiye", fill=TEXT2, font=get_font(22))

    rows = [("Date", "Oct 5, 2026 08:00"), ("Guests", "1"), ("Status", "CONFIRMED ✓"), ("Booking", "booking-1")]
    for i, (label, value) in enumerate(rows):
        ry = info_y + 80 + i * 35
        draw.text((pad+20, ry), label, fill=TEXT2, font=get_font(20))
        vcolor = (76, 175, 80) if "CONFIRMED" in value else TEXT
        draw.text((pad+card_w-20-200, ry), value, fill=vcolor, font=get_font(20, bold=True))

    # Footer
    foot_y = card_y + card_h - 50
    draw.rectangle([pad, foot_y-10, pad+card_w, card_y+card_h], fill=SURFACE)
    draw.text((w//2 - 120, foot_y), "Show QR at venue · Yuanly AI", fill=TEXT2, font=get_font(18))

    # Share buttons
    share_y = card_y + card_h + 30
    btns = ["📧 Email", "💬 SMS", "💚 WeChat"]
    btn_w = (card_w - 20) // 3
    for i, btn in enumerate(btns):
        bx = pad + i * (btn_w + 10)
        draw.rounded_rectangle([bx, share_y, bx+btn_w, share_y+50], radius=14, fill=WHITE, outline=(229,231,235))
        draw.text((bx+btn_w//2-40, share_y+15), btn, fill=TEXT2, font=get_font(20))

def create_payment_screen(draw, img, w, h, pad):
    """Payment screen"""
    top_y = 200

    draw.text((pad, top_y), "Payment", fill=TEXT, font=get_font(40, bold=True))
    draw.text((pad, top_y+50), "Azure Sky Paragliding", fill=TEXT2, font=get_font(24))

    # Amount card
    amt_y = top_y + 110
    draw.rounded_rectangle([pad, amt_y, w-pad, amt_y+120], radius=20, fill=SURFACE)
    draw.text((w//2 - 50, amt_y+25), "Total", fill=TEXT2, font=get_font(24))
    draw.text((w//2 - 100, amt_y+55), "¥800 CNY", fill=PRIMARY, font=get_font(48, bold=True))

    # Payment methods
    pm_y = amt_y + 150
    draw.text((pad, pm_y), "Select Payment Method", fill=TEXT, font=get_font(28, bold=True))

    methods = [("💚", "WeChat Pay", True), ("💙", "Alipay", False)]
    for i, (icon, name, selected) in enumerate(methods):
        my = pm_y + 50 + i * 70
        outline = PRIMARY if selected else (229,231,235)
        fill = (*PRIMARY, 10) if selected else WHITE
        draw.rounded_rectangle([pad, my, w-pad, my+60], radius=14, fill=WHITE, outline=outline, width=3)

        draw.text((pad+20, my+15), icon, fill=TEXT, font=get_font(28))
        draw.text((pad+70, my+18), name, fill=TEXT, font=get_font(24, bold=True))

        # Radio
        cx = w - pad - 30
        cy = my + 30
        draw.ellipse([cx-12, cy-12, cx+12, cy+12], outline=outline, width=3)
        if selected:
            draw.ellipse([cx-6, cy-6, cx+6, cy+6], fill=PRIMARY)

    # Pay button
    btn_y = h - 250
    draw.rounded_rectangle([pad, btn_y, w-pad, btn_y+75], radius=35, fill=PRIMARY)
    draw.text((w//2 - 90, btn_y+22), "¥800 Pay Securely 🔒", fill=WHITE, font=get_font(28, bold=True))

def generate_all():
    """Generate all screenshots for all device sizes"""
    output_dir = "/sessions/jolly-sleepy-franklin/mnt/Yuanly-AI/screenshots"

    screens = [
        ("explore", "Discover Turkey", "AI-powered experience feed"),
        ("detail", "Book in Seconds", "AI concierge handles everything"),
        ("ai", "AI Voice Concierge", "Real-time translation CN ↔ EN ↔ TR"),
        ("calendar", "Smart Calendar", "Track & share your bookings"),
        ("qr", "QR Digital Ticket", "No paper needed"),
        ("payment", "WeChat Pay Ready", "Seamless payment experience"),
    ]

    for device_name, (w, h) in DEVICES.items():
        dev_dir = os.path.join(output_dir, device_name)
        os.makedirs(dev_dir, exist_ok=True)

        for screen_type, title_en, subtitle in screens:
            img = create_screenshot(device_name, w, h, screen_type, "", title_en, subtitle)
            filename = f"{screen_type}.png"
            filepath = os.path.join(dev_dir, filename)
            img.save(filepath, "PNG")
            print(f"  ✓ {device_name}/{filename} ({w}x{h})")

    print(f"\n✅ All screenshots generated in {output_dir}")

if __name__ == "__main__":
    generate_all()