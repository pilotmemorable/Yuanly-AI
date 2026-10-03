import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Yuanly AI database (SQLite dev mode)...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.userInteraction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  // Admin user
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      email: 'admin@yuanly.ai',
      fullName: 'Yuanly Admin',
      role: 'ADMIN',
      membershipLevel: 'VIP',
      preferredLanguage: 'EN',
      trustScore: 10.0,
    },
  });

  // Test users
  const user1 = await prisma.user.create({
    data: {
      id: 'user-1',
      wechatId: 'wx_test_001',
      fullName: 'Zhang Wei',
      membershipLevel: 'SILVER',
      preferredLanguage: 'CN',
      travelStyle: 'adventure',
      trustScore: 5.0,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-2',
      wechatId: 'wx_test_002',
      fullName: 'Li Na',
      membershipLevel: 'GOLD',
      preferredLanguage: 'CN',
      travelStyle: 'romantic',
      trustScore: 7.5,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-3',
      email: 'ahmet@yuanly.ai',
      fullName: 'Ahmet Yılmaz',
      membershipLevel: 'SILVER',
      preferredLanguage: 'TR',
      travelStyle: 'cultural',
      trustScore: 3.0,
    },
  });

  // Merchants
  const merchant1 = await prisma.merchant.create({
    data: {
      id: 'merchant-1',
      businessName: 'Azure Sky Paragliding',
      category: 'PARAGLIDING',
      location: 'Fethiye, Turkey',
      latitude: 36.5613,
      longitude: 29.1167,
      description: 'Premium paragliding experience over the Blue Lagoon of Oludeniz. Certified pilots, 4K drone video available.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1533900298318-6b8da0857577?w=400']),
      rating: 4.9,
      reviewCount: 120,
      isVerified: true,
      isActive: true,
      commissionRate: 0.15,
      contactInfo: JSON.stringify({ phone: '+90 555 123 45 67', email: 'info@azuresky.com' }),
      operatingHours: JSON.stringify({ start: '08:00', end: '18:00' }),
    },
  });

  const merchant2 = await prisma.merchant.create({
    data: {
      id: 'merchant-2',
      businessName: 'Cappadocia Dreams Balloon',
      category: 'BALLOON',
      location: 'Cappadocia, Turkey',
      latitude: 38.6431,
      longitude: 34.8289,
      description: 'Unforgettable hot air balloon rides over the magical landscapes of Cappadocia. Sunrise flights with breakfast.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1520440229748-677be5f3bd57?w=400']),
      rating: 5.0,
      reviewCount: 350,
      isVerified: true,
      isActive: true,
      commissionRate: 0.12,
      contactInfo: JSON.stringify({ phone: '+90 555 234 56 78', email: 'fly@cappadociadreams.com' }),
      operatingHours: JSON.stringify({ start: '05:30', end: '08:00' }),
    },
  });

  const merchant3 = await prisma.merchant.create({
    data: {
      id: 'merchant-3',
      businessName: 'Ephesus VIP Tours',
      category: 'TOUR',
      location: 'Izmir, Turkey',
      latitude: 37.9395,
      longitude: 27.3417,
      description: 'Private guided tours of ancient Ephesus, House of Virgin Mary, and surrounding historical sites.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1516483638261-f48fbc869872?w=400']),
      rating: 4.7,
      reviewCount: 89,
      isVerified: true,
      isActive: true,
      commissionRate: 0.10,
      contactInfo: JSON.stringify({ phone: '+90 555 345 67 89', email: 'info@ephesusvip.com' }),
      operatingHours: JSON.stringify({ start: '09:00', end: '17:00' }),
    },
  });

  // Experiences
  const exp1 = await prisma.experience.create({
    data: {
      id: 'exp-1',
      merchantId: merchant1.id,
      title: 'Azure Sky Paragliding - Premium Flight',
      titleCn: '蓝天滑翔伞 - 尊享飞行',
      titleTr: 'Azure Sky Paragliding - Premium Uçuş',
      description: 'Experience the ultimate thrill of flying over the Blue Lagoon of Oludeniz. Professional pilots, safety equipment, and optional 4K drone video included.',
      descriptionCn: '体验在厄吕代尼兹蓝色礁湖上空飞行的极致刺激。专业飞行员，安全设备，可选4K无人机视频。',
      descriptionTr: 'Ölüdeniz Mavi Lagünün üzerinde uçmanın nihai heyecanını yaşayın.',
      priceCny: 800,
      priceUsd: 110,
      duration: '45 mins',
      capacity: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1533900298318-6b8da0857577?w=400', 'https://images.unsplash.com/photo-1506744038136-46286d3aee96?w=400']),
      tags: JSON.stringify(['adventure', 'fethiye', 'sky', 'paragliding']),
      rating: 4.9,
      reviewCount: 120,
    },
  });

  const exp2 = await prisma.experience.create({
    data: {
      id: 'exp-2',
      merchantId: merchant1.id,
      title: 'Sunset Glide Experience',
      titleCn: '日落滑翔体验',
      titleTr: 'Gün Batımı Kayış Deneyimi',
      description: 'The most romantic way to see the Turkish coast during sunset. Tandem paragliding with champagne landing.',
      descriptionCn: '日落时分欣赏土耳其海岸的最浪漫方式。双人滑翔伞，香槟着陆。',
      descriptionTr: 'Gün batımında Türk sahiline bakmanın en romantik yolu.',
      priceCny: 1000,
      priceUsd: 140,
      duration: '60 mins',
      capacity: 1,
      images: JSON.stringify(['https://images.unsplash.com/photo-1506744038136-46286d3aee96?w=400']),
      tags: JSON.stringify(['romantic', 'sunset', 'fethiye', 'paragliding']),
      rating: 4.8,
      reviewCount: 65,
    },
  });

  const exp3 = await prisma.experience.create({
    data: {
      id: 'exp-3',
      merchantId: merchant2.id,
      title: 'Cappadocia Hot Air Balloon Safari',
      titleCn: '卡帕多奇亚热气球之旅',
      titleTr: 'Kapadokya Sıcak Hava Balonu Safarisi',
      description: 'Witness the magical sunrise over Cappadocia from a hot air balloon. Includes pre-flight breakfast and celebratory champagne.',
      descriptionCn: '在热气球上见证卡帕多奇亚的神奇日出。包含飞行前早餐和庆祝香槟。',
      descriptionTr: 'Sıcak hava balonundan Kapadokya\'nın büyülü gün doğumuna tanık olun.',
      priceCny: 2500,
      priceUsd: 350,
      duration: '90 mins',
      capacity: 16,
      images: JSON.stringify(['https://images.unsplash.com/photo-1520440229748-677be5f3bd57?w=400']),
      tags: JSON.stringify(['balloon', 'cappadocia', 'romantic', 'sunrise', 'adventure']),
      rating: 5.0,
      reviewCount: 350,
    },
  });

  const exp4 = await prisma.experience.create({
    data: {
      id: 'exp-4',
      merchantId: merchant3.id,
      title: 'Ephesus VIP Private Tour',
      titleCn: '以弗所VIP私人游',
      titleTr: 'Efes VIP Özel Tur',
      description: 'Private guided tour of ancient Ephesus with licensed archaeologist. Includes House of Virgin Mary and Terrace Houses.',
      descriptionCn: '持证考古学家带领的以弗所古城私人导览。包含圣母玛利亚之家和露台房屋。',
      descriptionTr: 'Lisanslı arkeolog eşliğinde antik Efes özel turu.',
      priceCny: 600,
      priceUsd: 85,
      duration: '4 hours',
      capacity: 8,
      images: JSON.stringify(['https://images.unsplash.com/photo-1516483638261-f48fbc869872?w=400']),
      tags: JSON.stringify(['cultural', 'ephesus', 'izmir', 'tour', 'history']),
      rating: 4.7,
      reviewCount: 89,
    },
  });

  // Create slots for the next 7 days
  const now = new Date();
  let slotCount = 0;
  for (const exp of [exp1, exp2, exp3, exp4]) {
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 3; hour++) {
        const slotStart = new Date(now);
        slotStart.setDate(slotStart.getDate() + day);
        slotStart.setHours(8 + hour * 3, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 2);

        await prisma.slot.create({
          data: {
            experienceId: exp.id,
            merchantId: exp.merchantId,
            startTime: slotStart,
            endTime: slotEnd,
            capacity: exp.capacity,
            bookedCount: 0,
            status: 'AVAILABLE',
            priceCny: exp.priceCny,
          },
        });
        slotCount++;
      }
    }
  }

  // Sample booking
  const firstSlot = await prisma.slot.findFirst({
    where: { experienceId: exp1.id, status: 'AVAILABLE' },
  });

  if (firstSlot) {
    const booking = await prisma.booking.create({
      data: {
        id: 'booking-1',
        userId: user1.id,
        experienceId: exp1.id,
        slotId: firstSlot.id,
        slotTime: firstSlot.startTime,
        guestCount: 1,
        status: 'CONFIRMED',
        totalAmount: firstSlot.priceCny,
        currency: 'CNY',
        paymentRef: 'wx_pay_test_001',
        qrCode: 'qr_test_001_yuanly',
      },
    });

    await prisma.payment.create({
      data: {
        id: 'payment-1',
        bookingId: booking.id,
        method: 'WECHAT_PAY',
        amount: booking.totalAmount,
        currency: 'CNY',
        status: 'SUCCESS',
        transactionId: 'wx_pay_test_001',
        idempotencyKey: 'seed_key_001',
        webhookReceived: true,
      },
    });

    await prisma.slot.update({
      where: { id: firstSlot.id },
      data: { status: 'BOOKED', bookedCount: 1 },
    });

    await prisma.review.create({
      data: {
        id: 'review-1',
        bookingId: booking.id,
        userId: user1.id,
        experienceId: exp1.id,
        rating: 5,
        comment: 'Amazing experience! The views were breathtaking and the pilot was very professional.',
        mediaUrls: JSON.stringify([]),
        isVerified: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user1.id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your paragliding experience in Fethiye is confirmed. QR ticket is ready in My Trips.',
        data: JSON.stringify({ bookingId: booking.id }),
      },
    });
  }

  console.log(`✅ Seeding completed!`);
  console.log(`   Users: 3, Merchants: 3, Experiences: 4, Slots: ${slotCount}, Sample booking: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });