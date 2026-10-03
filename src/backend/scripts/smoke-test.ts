/* End-to-end API smoke test. Usage: BASE_URL=http://localhost:5000 ADMIN_PASSWORD=... npm test */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'pilotmemorable@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const run = Date.now().toString(36);

let failures = 0;
function check(name: string, cond: any, extra?: any) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.log(`  ✗ ${name}`, extra !== undefined ? JSON.stringify(extra) : '');
  }
}

async function api(method: string, path: string, body?: any, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* not json */ }
  return { status: res.status, data };
}

async function main() {
  console.log('Health & public pages');
  check('health', (await api('GET', '/health')).status === 200);
  for (const p of ['/privacy', '/terms', '/support']) {
    check(`page ${p}`, (await fetch(BASE + p)).status === 200);
  }

  console.log('Auth');
  const userEmail = `user_${run}@example.com`;
  const pw = `P@ss--w'ord1`; // quotes / dashes must survive
  const reg = await api('POST', '/v1/auth/register', { email: userEmail, password: pw, fullName: 'Test <b>User</b>', preferredLanguage: 'EN' });
  check('register user', reg.status === 201 && reg.data.user.role === 'USER', reg.data);
  check('name sanitised', reg.data?.user?.fullName === 'Test User', reg.data?.user?.fullName);
  check('duplicate email 409', (await api('POST', '/v1/auth/register', { email: userEmail, password: pw })).status === 409);
  check('admin email reserved', (await api('POST', '/v1/auth/register', { email: ADMIN_EMAIL, password: 'whatever123' })).status === 403);
  check('short password rejected', (await api('POST', '/v1/auth/register', { email: `x${run}@example.com`, password: '123' })).status === 400);
  check('wrong password 401', (await api('POST', '/v1/auth/login', { email: userEmail, password: 'nope-nope' })).status === 401);
  const login = await api('POST', '/v1/auth/login', { email: userEmail, password: pw });
  check('login', login.status === 200 && !!login.data.token, login.data);
  const userToken: string = login.data.token;
  check('me', (await api('GET', '/v1/auth/me', undefined, userToken)).data?.user?.email === userEmail);
  check('no token 401', (await api('GET', '/v1/auth/me')).status === 401);
  check('wechat-login removed', (await api('POST', '/v1/auth/wechat-login', { wechat_token: 'x' })).status === 404);
  check('user cannot use admin api', (await api('GET', '/v1/admin/stats', undefined, userToken)).status === 403);
  check('user cannot use merchant api', (await api('GET', '/v1/merchant/me', undefined, userToken)).status === 403);

  console.log('Admin');
  if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD env required');
  const adminLogin = await api('POST', '/v1/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check('admin login', adminLogin.status === 200 && adminLogin.data.user.role === 'ADMIN', adminLogin.data);
  const admin: string = adminLogin.data.token;
  check('stats', (await api('GET', '/v1/admin/stats', undefined, admin)).data?.totals !== undefined);

  const repEmail = `rep_${run}@example.com`;
  const created = await api('POST', '/v1/admin/users', {
    email: repEmail, password: 'RepPassw0rd!', fullName: 'Rep One', role: 'MERCHANT',
    merchant: { businessName: `Test Co ${run}`, category: 'TOUR', location: 'Fethiye, Turkey', contactPhone: '+900000000' },
  }, admin);
  check('create company rep', created.status === 201 && created.data.user.role === 'MERCHANT' && !!created.data.user.merchant, created.data);
  const merchantId: string = created.data?.user?.merchant?.id;
  const repUserId: string = created.data?.user?.id;
  check('cannot grant ADMIN', (await api('PUT', `/v1/admin/users/${reg.data.user.id}/role`, { role: 'ADMIN' }, admin)).status === 403);
  const adminRow = (await api('GET', '/v1/admin/users?q=pilotmemorable', undefined, admin)).data?.users || [];
  check('admin hidden from user list', adminRow.length === 0, adminRow);

  const exp = await api('POST', '/v1/admin/experiences', {
    merchantId, title: `Test Tour ${run}`, titleCn: '测试', description: 'A tour', priceCny: 100, duration: '2 hours', capacity: 3,
    images: ['https://example.com/a.jpg'], tags: ['adventure'],
  }, admin);
  check('create experience', exp.status === 201, exp.data);
  const expId: string = exp.data?.experience?.id;
  const date = new Date(Date.now() + 2 * 86400000 + 3 * 3600000).toISOString().slice(0, 10);
  const slots = await api('POST', `/v1/admin/experiences/${expId}/slots/bulk`, { startDate: date, endDate: date, times: ['10:00', '15:00'] }, admin);
  check('bulk slots', slots.status === 201 && slots.data.created === 2, slots.data);

  console.log('Catalogue');
  const detail = await api('GET', `/v1/experiences/${expId}`);
  check('detail has 2 slots', detail.status === 200 && detail.data.experience.slots.length === 2, detail.data);
  check('explore lists it', (await api('GET', '/v1/experiences/explore?limit=50')).data.experiences.some((e: any) => e.id === expId));
  const slotId: string = detail.data.experience.slots[0].id;
  const slot2: string = detail.data.experience.slots[1].id;
  check('slot remaining = 3', detail.data.experience.slots[0].remaining === 3);

  console.log('Reservations (user)');
  check('booking needs auth', (await api('POST', '/v1/bookings', { experienceId: expId, slotId, guestCount: 1 })).status === 401);
  const b1 = await api('POST', '/v1/bookings', { experienceId: expId, slotId, guestCount: 2, guestName: 'Zhang', guestPhone: '+86 1', notes: 'window' }, userToken);
  check('create booking PENDING', b1.status === 201 && b1.data.booking.status === 'PENDING' && b1.data.booking.totalAmount === 200, b1.data);
  const bookingId: string = b1.data?.booking?.id;
  const over = await api('POST', '/v1/bookings', { experienceId: expId, slotId, guestCount: 2 }, userToken);
  check('over capacity 409', over.status === 409 && over.data.error_code === 'ERR_CAPACITY_FULL', over.data);
  const stillOne = await api('GET', `/v1/experiences/${expId}`);
  check('remaining decreased', stillOne.data.experience.slots.find((s: any) => s.id === slotId)?.remaining === 1);
  check('qr unavailable while pending', (await api('GET', `/v1/bookings/${bookingId}/qr`, undefined, userToken)).status === 404);
  check('my bookings', (await api('GET', '/v1/bookings', undefined, userToken)).data.bookings.length === 1);

  console.log('Reservations (company rep)');
  const repLogin = await api('POST', '/v1/auth/login', { email: repEmail, password: 'RepPassw0rd!' });
  const rep: string = repLogin.data.token;
  check('rep login role', repLogin.data.user.role === 'MERCHANT' && repLogin.data.user.merchant.id === merchantId);
  check('rep company', (await api('GET', '/v1/merchant/me', undefined, rep)).data?.experiences?.length === 1);
  const list = await api('GET', '/v1/merchant/bookings?status=PENDING', undefined, rep);
  check('rep sees pending booking + counts', list.data.bookings.length === 1 && list.data.counts.PENDING === 1, list.data);
  check('notified rep', ((await api('GET', '/v1/auth/me/notifications', undefined, rep)).data.notifications || []).length >= 1);
  const conf = await api('PUT', `/v1/merchant/bookings/${bookingId}/status`, { status: 'CONFIRMED' }, rep);
  check('confirm', conf.status === 200 && conf.data.booking.status === 'CONFIRMED' && !!conf.data.booking.qrCode, conf.data);
  check('user gets qr', (await api('GET', `/v1/bookings/${bookingId}/qr`, undefined, userToken)).status === 200);
  check('user notified', ((await api('GET', '/v1/auth/me/notifications', undefined, userToken)).data.notifications || []).length >= 1);
  check('invalid transition 409', (await api('PUT', `/v1/merchant/bookings/${bookingId}/status`, { status: 'REJECTED' }, rep)).data?.error_code === 'ERR_INVALID_TRANSITION');
  const manualTime = `${date}T10:00:00+03:00`;
  const manual = await api('POST', '/v1/merchant/bookings', { experienceId: expId, startTime: manualTime, guestCount: 1, guestName: 'Walk-in Ali' }, rep);
  check('manual booking CONFIRMED (fills slot)', manual.status === 201 && manual.data.booking.status === 'CONFIRMED' && manual.data.booking.source === 'MANUAL', manual.data);
  const full = await api('POST', '/v1/merchant/bookings', { experienceId: expId, startTime: manualTime, guestCount: 1, guestName: 'Late' }, rep);
  check('slot now full', full.status === 409 && full.data.error_code === 'ERR_CAPACITY_FULL', full.data);
  check('past time rejected', (await api('POST', '/v1/merchant/bookings', { experienceId: expId, startTime: '2020-01-01T10:00:00+03:00', guestCount: 1, guestName: 'x' }, rep)).status === 400);
  const b2 = await api('POST', '/v1/bookings', { experienceId: expId, slotId: slot2, guestCount: 1 }, userToken);
  check('second booking', b2.status === 201);
  const rej = await api('PUT', `/v1/merchant/bookings/${b2.data.booking.id}/status`, { status: 'REJECTED', reason: 'Full day' }, rep);
  check('reject releases seat', rej.data?.booking?.status === 'REJECTED' && (await api('GET', `/v1/experiences/${expId}`)).data.experience.slots.find((s: any) => s.id === slot2)?.remaining === 3);
  const cancel = await api('POST', `/v1/bookings/${bookingId}/cancel`, { reason: 'Plans changed' }, userToken);
  check('user cancels own confirmed booking', cancel.status === 200 && cancel.data.booking.status === 'CANCELLED', cancel.data);
  check('other user cannot see booking', (await api('GET', `/v1/bookings/${bookingId}`, undefined, rep)).status === 404);
  const other = await api('POST', '/v1/auth/register', { email: `other_${run}@example.com`, password: 'OtherPass123' });
  check('other user cannot cancel', (await api('POST', `/v1/bookings/${manual.data.booking.id}/cancel`, {}, other.data.token)).status === 404);

  console.log('Admin reservations & roles');
  const all = await api('GET', `/v1/admin/bookings?merchantId=${merchantId}`, undefined, admin);
  check('admin sees company bookings', all.data.bookings.length === 3, all.data.bookings?.length);
  const roleBack = await api('PUT', `/v1/admin/users/${repUserId}/role`, { role: 'USER' }, admin);
  check('demote rep to USER', roleBack.data?.user?.role === 'USER' && roleBack.data.user.merchant === null, roleBack.data);
  check('demoted rep loses merchant api', (await api('GET', '/v1/merchant/me', undefined, rep)).status === 403);
  const regrant = await api('PUT', `/v1/admin/users/${repUserId}/role`, { role: 'MERCHANT', merchantId }, admin);
  check('re-grant MERCHANT', regrant.data?.user?.role === 'MERCHANT', regrant.data);

  console.log('Account deletion');
  check('wrong password refused', (await api('DELETE', '/v1/auth/me', { password: 'wrong-wrong' }, userToken)).status === 401);
  check('delete account', (await api('DELETE', '/v1/auth/me', { password: pw }, userToken)).status === 200);
  check('deleted user cannot login', (await api('POST', '/v1/auth/login', { email: userEmail, password: pw })).status === 401);
  check('admin cannot be deleted', (await api('DELETE', '/v1/auth/me', { password: ADMIN_PASSWORD }, admin)).status === 403);

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
