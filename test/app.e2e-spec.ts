import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/common/utils/hash.util.js';
import { DBService } from '../src/db/db.service.js';

describe('Central Office API (E2E Complete)', () => {
  let app: INestApplication;
  let db: DBService;

  let rootAccessToken: string;
  let managerAccessToken: string;
  let managerRefreshToken: string;
  let createdManagerId: string;
  let testOwnerId: string;
  let testShopId: string;
  let testTerminalId: string;
  let pendingApproveRequestId: string;
  let pendingRejectRequestId: string;

  const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';
  const INVALID_UUID = 'invalid-uuid-format';

  const resetState = async () => {
    const defaultManagerPassword = await hashPassword('ManagerPass123!');
    await db.admin.updateMany({
      where: { email: 'manager@kkm.local' },
      data: { password: defaultManagerPassword },
    });

    await db.terminalRequest.updateMany({
      where: { macAddress: { in: ['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02'] } },
      data: { status: 'PENDING' },
    });

    await db.terminal.deleteMany({
      where: { macAddress: 'AA:BB:CC:DD:EE:01' },
    });

    await db.shop.deleteMany({
      where: { login: { in: ['shop_arbat_99', 'shop_arbat_new_login_99', 'shop_plain_pass_99'] } },
    });
    await db.shopOwner.deleteMany({
      where: { name: 'IE Sidorov Sidor Sidorovich' },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    db = app.get(DBService);
    await resetState();
  });

  afterAll(async () => {
    await resetState();
    await app.close();
  });

  describe('Auth', () => {
    it('POST /auth/login - should return 400 when body is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);
    });

    it('POST /auth/login - should return 401 on incorrect credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'root@kkm.local', password: 'WrongPassword123!' })
        .expect(401);
    });

    it('POST /auth/login - should authenticate ROOT and omit password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'root@kkm.local', password: 'RootAdmin123!' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.admin.role).toBe('ROOT');
      expect(res.body.admin.password).toBeUndefined();

      rootAccessToken = res.body.accessToken;
    });

    it('POST /auth/login - should authenticate MANAGER', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(200);

      expect(res.body.admin.role).toBe('MANAGER');
      managerAccessToken = res.body.accessToken;
      managerRefreshToken = res.body.refreshToken;
    });

    it('GET /admins - should return 401 when token is missing or malformed', async () => {
      await request(app.getHttpServer()).get('/admins').expect(401);
      await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);
    });

    it('POST /auth/login - single session enforcement invalidates previous token', async () => {
      const previousToken = managerAccessToken;

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(200);

      managerAccessToken = res.body.accessToken;
      managerRefreshToken = res.body.refreshToken;

      await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${previousToken}`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);
    });

    it('POST /auth/refresh - should rotate token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: managerRefreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      managerAccessToken = res.body.accessToken;
      managerRefreshToken = res.body.refreshToken;
    });

    it('POST /auth/refresh - should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'not-a-valid-jwt' })
        .expect(401);
    });

    it('POST /auth/refresh - should return 401 Session expired when session was invalidated', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(200);

      const accessToken = login.body.accessToken;
      const refreshToken = login.body.refreshToken;

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(res.body.message).toBe('Session expired');

      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(200);

      managerAccessToken = secondLogin.body.accessToken;
      managerRefreshToken = secondLogin.body.refreshToken;
    });

    it('POST /auth/logout - should terminate current session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(200);

      managerAccessToken = res.body.accessToken;
      managerRefreshToken = res.body.refreshToken;
    });
  });

  describe('Admins', () => {
    it('GET /admins - should return admins list without leaking sensitive fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].tokenV).toBeUndefined();
      expect(res.body[0].password).toBeUndefined();
    });

    it('POST /admins - should return 403 when called by non-root', async () => {
      await request(app.getHttpServer())
        .post('/admins')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          email: 'unauthorized.manager@kkm.local',
          name: 'Unauthorized',
          password: 'SecretPass123!',
        })
        .expect(403);
    });

    it('POST /admins - should return 400 when password is weak', async () => {
      await request(app.getHttpServer())
        .post('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({
          email: 'weak.manager@kkm.local',
          name: 'Weak Pass',
          password: '123',
        })
        .expect(400);
    });

    it('POST /admins - should create a manager when called by root', async () => {
      const res = await request(app.getHttpServer())
        .post('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({
          email: 'new.operational.manager@kkm.local',
          name: 'Operational Manager',
          password: 'ManagerPass123!',
        })
        .expect(201);

      expect(res.body.role).toBe('MANAGER');
      expect(res.body.password).toBeUndefined();
      createdManagerId = res.body.id;
    });

    it('POST /admins - should ignore unknown fields and still create MANAGER', async () => {
      const res = await request(app.getHttpServer())
        .post('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({
          email: 'extra.field.manager@kkm.local',
          name: 'Extra Field Manager',
          password: 'ManagerPass123!',
          role: 'ROOT',
          phone: '+7 (999) 000-00-00',
        })
        .expect(201);

      expect(res.body.role).toBe('MANAGER');

      await request(app.getHttpServer())
        .delete(`/admins/${res.body.id}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(200);
    });

    it('POST /admins - should return 409 on duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({
          email: 'new.operational.manager@kkm.local',
          name: 'Duplicate',
          password: 'ManagerPass123!',
        })
        .expect(409);
    });

    it('GET /admins - should contain exactly one ROOT admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(200);

      const roots = res.body.filter((a: { role: string }) => a.role === 'ROOT');
      expect(roots).toHaveLength(1);
    });

    it('DELETE /admins/:id - should return 403 when called by manager', async () => {
      await request(app.getHttpServer())
        .delete(`/admins/${createdManagerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(403);
    });

    it('PATCH /admins/:id/password - should return 400 when new password is weak', async () => {
      await request(app.getHttpServer())
        .patch(`/admins/${createdManagerId}/password`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({ newPassword: 'weak' })
        .expect(400);
    });

    it('PATCH /admins/:id/password - should return 400 on invalid UUID and 404 if not found', async () => {
      await request(app.getHttpServer())
        .patch(`/admins/${INVALID_UUID}/password`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({ newPassword: 'NewPassword123!' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/admins/${NON_EXISTENT_UUID}/password`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({ newPassword: 'NewPassword123!' })
        .expect(404);
    });

    it('PATCH /admins/:id/password - should return 403 for non-root and 200 for root', async () => {
      await request(app.getHttpServer())
        .patch(`/admins/${createdManagerId}/password`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ newPassword: 'NewPassword123!' })
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/admins/${createdManagerId}/password`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .send({ newPassword: 'BrandNewPassword123!' })
        .expect(200);
    });

    it('DELETE /admins/:id - should return 400 when attempting to delete root', async () => {
      const admins = await request(app.getHttpServer())
        .get('/admins')
        .set('Authorization', `Bearer ${rootAccessToken}`);
      const rootId = admins.body.find((a: { role: string; id: string }) => a.role === 'ROOT').id;

      await request(app.getHttpServer())
        .delete(`/admins/${rootId}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(400);
    });

    it('DELETE /admins/:id - should delete manager when called by root', async () => {
      await request(app.getHttpServer())
        .delete(`/admins/${createdManagerId}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/admins/${createdManagerId}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(404);
    });
  });

  describe('Shop Owners', () => {
    it('POST /shops-owners - should return 400 on invalid payload and 201 on success', async () => {
      await request(app.getHttpServer())
        .post('/shops-owners')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ name: '', contacts: '' })
        .expect(400);

      const res = await request(app.getHttpServer())
        .post('/shops-owners')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'IE Sidorov Sidor Sidorovich',
          contacts: '+7 (911) 222-33-44, sidorov@test.local',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      testOwnerId = res.body.id;
    });

    it('GET /shops-owners - should list all shop owners with shop counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/shops-owners')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]._count).toBeDefined();
    });

    it('GET /shops-owners/:id - should return 400 on invalid UUID, 404 if not found, 200 on success', async () => {
      await request(app.getHttpServer())
        .get(`/shops-owners/${INVALID_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/shops-owners/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(404);

      const res = await request(app.getHttpServer())
        .get(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(res.body.id).toBe(testOwnerId);
      expect(Array.isArray(res.body.shops)).toBe(true);
    });

    it('PATCH /shops-owners/:id - should return 400 when body is empty', async () => {
      await request(app.getHttpServer())
        .patch(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({})
        .expect(400);
    });

    it('PATCH /shops-owners/:id - should update contact details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ contacts: '+7 (999) 000-00-00, new-contact@test.local' })
        .expect(200);

      expect(res.body.contacts).toBe('+7 (999) 000-00-00, new-contact@test.local');
    });

    it('PATCH /shops-owners/:id - should ignore null fields instead of failing', async () => {
      const original = await request(app.getHttpServer())
        .get(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      const jsonNull: unknown = JSON.parse('null');
      const res = await request(app.getHttpServer())
        .patch(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ name: jsonNull, contacts: original.body.contacts })
        .expect(200);

      expect(res.body.name).toBe(original.body.name);
      expect(res.body.contacts).toBe(original.body.contacts);
    });
  });

  describe('Shops', () => {
    it('POST /shops - should return 404 when ownerId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'Non Existent Owner Store',
          requisites: 'Tax ID 999999999',
          address: 'No Address',
          login: 'ghost_shop',
          password: 'ShopPassword123!',
          ownerId: NON_EXISTENT_UUID,
        })
        .expect(404);
    });

    it('POST /shops - should return 400 when password is weak', async () => {
      await request(app.getHttpServer())
        .post('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'Weak Password Store',
          requisites: 'Tax ID 111222333444',
          address: 'Moscow, Weak Str., 1',
          login: 'shop_weak_password_99',
          password: 'weak',
          ownerId: testOwnerId,
        })
        .expect(400);
    });

    it('POST /shops - should register a new store and omit password', async () => {
      const res = await request(app.getHttpServer())
        .post('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'Central Spot No. 99',
          requisites: 'Tax ID 781234567890',
          address: 'Moscow, Arbat, 12',
          login: 'shop_arbat_99',
          password: 'ShopPassword123!',
          ownerId: testOwnerId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.login).toBe('shop_arbat_99');
      expect(res.body.password).toBeUndefined();
      testShopId = res.body.id;
    });

    it('POST /shops - should accept a simple numeric password', async () => {
      const res = await request(app.getHttpServer())
        .post('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'Plain Password Store',
          requisites: 'Tax ID 555666777888',
          address: 'Moscow, Plain Str., 5',
          login: 'shop_plain_pass_99',
          password: 'password123',
          ownerId: testOwnerId,
        })
        .expect(201);

      expect(res.body.login).toBe('shop_plain_pass_99');
    });

    it('POST /shops - should return 409 when login is already taken', async () => {
      await request(app.getHttpServer())
        .post('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          name: 'Duplicate Login Store',
          requisites: 'Tax ID 111111',
          address: 'Moscow',
          login: 'shop_arbat_99',
          password: 'ShopPassword123!',
          ownerId: testOwnerId,
        })
        .expect(409);
    });

    it('GET /shops - should list shops with owner details', async () => {
      const res = await request(app.getHttpServer())
        .get('/shops')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].owner).toBeDefined();
      expect(res.body[0]._count).toBeDefined();
    });

    it('GET /shops/:id - should return 400 on invalid UUID, 404 if not found, 200 on success', async () => {
      await request(app.getHttpServer())
        .get(`/shops/${INVALID_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/shops/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(404);

      const res = await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(res.body.id).toBe(testShopId);
      expect(Array.isArray(res.body.terminals)).toBe(true);
      expect(Array.isArray(res.body.requests)).toBe(true);
    });

    it('PATCH /shops/:id/credentials - should return 400 when body is empty and 200 on update', async () => {
      await request(app.getHttpServer())
        .patch(`/shops/${testShopId}/credentials`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({})
        .expect(400);

      const res = await request(app.getHttpServer())
        .patch(`/shops/${testShopId}/credentials`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          login: 'shop_arbat_new_login_99',
          password: 'NewShopPassword123!',
        })
        .expect(200);

      expect(res.body.login).toBe('shop_arbat_new_login_99');
      expect(res.body.tokenV).toBeUndefined();
    });

    it('PATCH /shops/:id/credentials - should return 409 when login is already taken', async () => {
      await request(app.getHttpServer())
        .patch(`/shops/${testShopId}/credentials`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          login: 'shop_ivan',
          password: 'NewShopPassword123!',
        })
        .expect(409);
    });

    it('PATCH /shops/:id/credentials - should return 404 when shop does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/shops/${NON_EXISTENT_UUID}/credentials`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({
          login: 'shop_no_one',
          password: 'NewShopPassword123!',
        })
        .expect(404);
    });
  });

  describe('Terminals', () => {
    it('POST /terminals/alive - should return 400 on invalid MAC and 404 when unregistered', async () => {
      await request(app.getHttpServer())
        .post('/terminals/alive')
        .send({ macAddress: 'invalid-mac' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/terminals/alive')
        .send({ macAddress: 'FF:FF:FF:FF:FF:FF' })
        .expect(404);
    });

    it('POST /terminals/alive - should acknowledge heartbeat publicly without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/terminals/alive')
        .send({ macAddress: '00-1b-44-11-3a-b7' })
        .expect(200);

      expect(res.body.status).toBe('ACTIVE');
      testTerminalId = res.body.id;
    });

    it('GET /terminals - should return terminals list with shop details', async () => {
      const res = await request(app.getHttpServer())
        .get('/terminals')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].shop).toBeDefined();
    });

    it('GET /terminals/:id - should return 400 on invalid UUID, 404 if not found, 200 on success', async () => {
      await request(app.getHttpServer())
        .get(`/terminals/${INVALID_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/terminals/${NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(404);

      const res = await request(app.getHttpServer())
        .get(`/terminals/${testTerminalId}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(res.body.id).toBe(testTerminalId);
      expect(res.body.shop).toBeDefined();
    });

    it('PATCH /terminals/:id/status - should return 400 on invalid enum and 200 on manual override', async () => {
      await request(app.getHttpServer())
        .patch(`/terminals/${testTerminalId}/status`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      const res = await request(app.getHttpServer())
        .patch(`/terminals/${testTerminalId}/status`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      expect(res.body.status).toBe('INACTIVE');
    });

    it('PATCH /terminals/:id/status - should return 404 when terminal does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/terminals/${NON_EXISTENT_UUID}/status`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ status: 'ACTIVE' })
        .expect(404);
    });
  });

  describe('Requests', () => {
    it('GET /requests - should return requests list with attached shop details', async () => {
      const res = await request(app.getHttpServer())
        .get('/requests')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].shop).toBeDefined();

      const approveReq = res.body.find(
        (r: { status: string; macAddress: string; id: string }) =>
          r.status === 'PENDING' && r.macAddress === 'AA:BB:CC:DD:EE:01',
      );
      const rejectReq = res.body.find(
        (r: { status: string; macAddress: string }) =>
          r.status === 'PENDING' && r.macAddress === 'AA:BB:CC:DD:EE:02',
      );

      expect(approveReq).toBeDefined();
      expect(rejectReq).toBeDefined();

      pendingApproveRequestId = approveReq.id;
      pendingRejectRequestId = rejectReq.id;
    });

    it('POST /requests/:id/comment - should return 400 on empty comment, 404 if not found, 200 on success', async () => {
      await request(app.getHttpServer())
        .post(`/requests/${pendingApproveRequestId}/comment`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ comment: '' })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/requests/${NON_EXISTENT_UUID}/comment`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ comment: 'Some comment' })
        .expect(404);

      const res = await request(app.getHttpServer())
        .post(`/requests/${pendingApproveRequestId}/comment`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ comment: 'Approved by regional security director' })
        .expect(200);

      expect(res.body.comment).toBe('Approved by regional security director');
    });

    it('PATCH /requests/:id/approve - should atomically approve and create terminal', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${pendingApproveRequestId}/approve`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(res.body.request.status).toBe('APPROVED');
      expect(res.body.terminal.status).toBe('ACTIVE');
      expect(res.body.terminal.macAddress).toBe('AA:BB:CC:DD:EE:01');
    });

    it('PATCH /requests/:id/approve - should return 404 when request does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${NON_EXISTENT_UUID}/approve`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(404);
    });

    it('PATCH /requests/:id/approve - should return 400 when approving already approved request', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${pendingApproveRequestId}/approve`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(400);
    });

    it('PATCH /requests/:id/reject - should mark pending request as REJECTED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/requests/${pendingRejectRequestId}/reject`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      expect(res.body.status).toBe('REJECTED');
    });

    it('PATCH /requests/:id/reject - should return 404 when request does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${NON_EXISTENT_UUID}/reject`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(404);
    });

    it('PATCH /requests/:id/reject - should return 400 when rejecting already rejected request', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${pendingRejectRequestId}/reject`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(400);
    });
  });

  describe('Profile & Cleanup', () => {
    it('PATCH /profile/password - should return 400 on weak password and 200 on update', async () => {
      await request(app.getHttpServer())
        .patch('/profile/password')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ newPassword: '123' })
        .expect(400);

      await request(app.getHttpServer())
        .patch('/profile/password')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ newPassword: 'AnotherSuperPass123!' })
        .expect(200);
    });

    it('POST /auth/login - old password should be rejected after profile password change', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'ManagerPass123!' })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'manager@kkm.local', password: 'AnotherSuperPass123!' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
    });

    it('DELETE /shops-owners/:id - should delete owner and cascade delete attached shops', async () => {
      await request(app.getHttpServer())
        .delete(`/shops-owners/${testOwnerId}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/shops/${testShopId}`)
        .set('Authorization', `Bearer ${rootAccessToken}`)
        .expect(404);
    });
  });
});
