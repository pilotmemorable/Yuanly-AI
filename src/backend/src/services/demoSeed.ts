import prisma from '../config/db';
import { istanbulToDate } from '../utils/time';

const IMG = {
  paraglide: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Paragliding_over_the_Blue_Lagoon_in_%C3%96l%C3%BCdeniz%2C_Turkey_%2849070937152%29.jpg/960px-Paragliding_over_the_Blue_Lagoon_in_%C3%96l%C3%BCdeniz%2C_Turkey_%2849070937152%29.jpg',
  babadag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Paragliding_from_Babadag_Mountain_over_the_Blue_Lagoon_in_%C3%96l%C3%BCdeniz%2C_Turkey_%2849070938897%29.jpg/960px-Paragliding_from_Babadag_Mountain_over_the_Blue_Lagoon_in_%C3%96l%C3%BCdeniz%2C_Turkey_%2849070938897%29.jpg',
  balloon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Hot_air_balloon_at_sunrise_over_Cappadocia%2C_Turkey.JPG/960px-Hot_air_balloon_at_sunrise_over_Cappadocia%2C_Turkey.JPG',
  ephesus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Ephesus_-_Celsus_Library.jpg/960px-Ephesus_-_Celsus_Library.jpg',
};

const merchants = [
  {
    id: 'demo-merchant-azure', businessName: 'Azure Sky Paragliding', category: 'PARAGLIDING', location: 'Fethiye, Turkey',
    latitude: 36.5613, longitude: 29.1167, commissionRate: 0.15,
    description: 'Tandem paragliding over the Blue Lagoon of Ölüdeniz with certified pilots.',
    contact: { phone: '+90 530 142 45 15', email: 'pilotmemorable@gmail.com' },
  },
  {
    id: 'demo-merchant-cappadocia', businessName: 'Cappadocia Dreams Balloon', category: 'BALLOON', location: 'Cappadocia, Turkey',
    latitude: 38.6431, longitude: 34.8289, commissionRate: 0.12,
    description: 'Sunrise hot air balloon flights over the fairy chimneys of Cappadocia.',
    contact: { phone: '+90 530 142 45 15', email: 'pilotmemorable@gmail.com' },
  },
  {
    id: 'demo-merchant-ephesus', businessName: 'Ephesus VIP Tours', category: 'TOUR', location: 'Izmir, Turkey',
    latitude: 37.9395, longitude: 27.3417, commissionRate: 0.1,
    description: 'Private guided tours of ancient Ephesus with licensed guides.',
    contact: { phone: '+90 530 142 45 15', email: 'pilotmemorable@gmail.com' },
  },
];

const experiences = [
  {
    id: 'demo-exp-paraglide', merchantId: 'demo-merchant-azure',
    title: 'Ölüdeniz Blue Lagoon Paragliding', titleCn: '厄吕代尼兹蓝色礁湖滑翔伞', titleTr: 'Ölüdeniz Mavi Lagün Yamaç Paraşütü',
    description: 'Fly tandem with a certified pilot from Babadağ mountain and land on the turquoise Ölüdeniz beach. Safety gear and transfer included.',
    descriptionCn: '与认证飞行员双人滑翔，从巴巴达山起飞，降落在碧蓝的厄吕代尼兹海滩。含安全装备和接送。',
    descriptionTr: 'Sertifikalı pilotla Babadağ’dan tandem uçuş yapın ve turkuaz Ölüdeniz plajına inin. Güvenlik ekipmanı ve transfer dahildir.',
    priceCny: 800, priceUsd: 110, duration: '45 mins', capacity: 4, images: [IMG.paraglide, IMG.babadag],
    tags: ['adventure', 'fethiye', 'sky', 'paragliding'], times: ['09:00', '11:00', '13:00', '15:00'],
  },
  {
    id: 'demo-exp-sunset', merchantId: 'demo-merchant-azure',
    title: 'Sunset Glide over Ölüdeniz', titleCn: '厄吕代尼兹日落滑翔', titleTr: 'Ölüdeniz Gün Batımı Uçuşu',
    description: 'The most romantic way to see the Turkish coast: a calm tandem flight at golden hour.',
    descriptionCn: '欣赏土耳其海岸最浪漫的方式：黄金时刻的平稳双人飞行。',
    descriptionTr: 'Türk sahilini görmenin en romantik yolu: altın saatte sakin bir tandem uçuş.',
    priceCny: 1000, priceUsd: 140, duration: '60 mins', capacity: 2, images: [IMG.babadag, IMG.paraglide],
    tags: ['romantic', 'sunset', 'fethiye', 'paragliding'], times: ['17:30'],
  },
  {
    id: 'demo-exp-balloon', merchantId: 'demo-merchant-cappadocia',
    title: 'Cappadocia Sunrise Balloon Flight', titleCn: '卡帕多奇亚日出热气球', titleTr: 'Kapadokya Gün Doğumu Balon Uçuşu',
    description: 'Watch the sun rise over the valleys of Cappadocia from a hot air balloon. Breakfast and hotel pick-up included.',
    descriptionCn: '乘热气球欣赏卡帕多奇亚山谷的日出。含早餐和酒店接送。',
    descriptionTr: 'Sıcak hava balonundan Kapadokya vadilerinde gün doğumunu izleyin. Kahvaltı ve otel transferi dahildir.',
    priceCny: 2500, priceUsd: 350, duration: '90 mins', capacity: 16, images: [IMG.balloon],
    tags: ['balloon', 'cappadocia', 'romantic', 'sunrise', 'adventure'], times: ['05:30'],
  },
  {
    id: 'demo-exp-ephesus', merchantId: 'demo-merchant-ephesus',
    title: 'Ephesus Private Guided Tour', titleCn: '以弗所私人导览', titleTr: 'Efes Özel Rehberli Tur',
    description: 'A private tour of ancient Ephesus, the Library of Celsus and the Terrace Houses with a licensed guide.',
    descriptionCn: '持证导游带领的以弗所古城、塞尔萨斯图书馆和露台住宅私人游。',
    descriptionTr: 'Lisanslı rehber eşliğinde antik Efes, Celsus Kütüphanesi ve Yamaç Evler özel turu.',
    priceCny: 600, priceUsd: 85, duration: '4 hours', capacity: 8, images: [IMG.ephesus],
    tags: ['cultural', 'ephesus', 'izmir', 'tour', 'history'], times: ['09:00', '14:00'],
  },
];

// Idempotent: creates the demo catalogue if missing and keeps 30 days of slots available.
export async function ensureDemoCatalog(days = 30) {
  for (const m of merchants) {
    const { contact, ...rest } = m;
    await prisma.merchant.upsert({
      where: { id: m.id },
      create: { ...rest, images: JSON.stringify([]), contactInfo: JSON.stringify(contact), isVerified: true, isActive: true },
      update: {},
    });
  }
  for (const e of experiences) {
    const { times: _times, images, tags, ...rest } = e;
    await prisma.experience.upsert({
      where: { id: e.id },
      create: { ...rest, images: JSON.stringify(images), tags: JSON.stringify(tags) },
      update: {},
    });
  }

  const now = Date.now();
  const data: any[] = [];
  for (const e of experiences) {
    const durationMin = e.duration.includes('hour') ? parseFloat(e.duration) * 60 : parseInt(e.duration, 10);
    for (let d = 0; d <= days; d++) {
      const dateStr = new Date(now + d * 86400000 + 3 * 3600000).toISOString().slice(0, 10);
      for (const time of e.times) {
        const startTime = istanbulToDate(dateStr, time);
        if (startTime.getTime() <= now) continue;
        data.push({
          experienceId: e.id, merchantId: e.merchantId, startTime,
          endTime: new Date(startTime.getTime() + durationMin * 60000),
          capacity: e.capacity, priceCny: e.priceCny,
        });
      }
    }
  }
  const result = await prisma.slot.createMany({ data, skipDuplicates: true });
  console.log(`[demo] catalogue ready (${result.count} new slots)`);
}
