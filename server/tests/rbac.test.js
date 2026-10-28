import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Case from '../models/Case.js';
import BailApplication from '../models/BailApplication.js';
import JudgeProfile from '../models/JudgeProfile.js';
import { ROLES, APP_STATUS } from '../config/constants.js';

let mongoServer;
let adminToken, citizenToken, judge1Token, judge2Token;
let judge1User, judge2User, assignedAppId;

const createToken = (user) => {
  const secret = process.env.JWT_ACCESS_SECRET || 'access_secret_bail_reckoner_bnss_2023_secure_key_12345';
  return jwt.sign({ userId: user._id, role: user.role, email: user.email }, secret, { expiresIn: '1h' });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create Admin
  const admin = await User.create({
    fullName: 'Admin Test',
    email: 'admin.rbac@test.com',
    passwordHash: 'hash',
    role: ROLES.ADMIN,
    isVerified: true,
    isActive: true
  });
  adminToken = createToken(admin);

  // Create Citizen
  const citizen = await User.create({
    fullName: 'Citizen Test',
    email: 'citizen.rbac@test.com',
    passwordHash: 'hash',
    role: ROLES.CITIZEN,
    isVerified: true,
    isActive: true
  });
  citizenToken = createToken(citizen);

  // Create Judge 1
  judge1User = await User.create({
    fullName: 'Judge One',
    email: 'judge1.rbac@test.com',
    passwordHash: 'hash',
    role: ROLES.JUDGE,
    isVerified: true,
    isActive: true
  });
  judge1Token = createToken(judge1User);
  await JudgeProfile.create({
    userId: judge1User._id,
    court: 'Court 1',
    bench: 'Bench A',
    isInviteAccepted: true
  });

  // Create Judge 2
  judge2User = await User.create({
    fullName: 'Judge Two',
    email: 'judge2.rbac@test.com',
    passwordHash: 'hash',
    role: ROLES.JUDGE,
    isVerified: true,
    isActive: true
  });
  judge2Token = createToken(judge2User);
  await JudgeProfile.create({
    userId: judge2User._id,
    court: 'Court 2',
    bench: 'Bench B',
    isInviteAccepted: true
  });

  // Create a Case and Application assigned to Judge 1
  const testCase = await Case.create({
    citizenId: citizen._id,
    caseNumber: 'BR-RBAC-2026-001',
    personDetails: {
      fullName: 'Accused Undertrial',
      age: 28,
      gender: 'Male',
      relationship: 'Self',
      contactPhone: '9840123456',
      address: 'Chennai'
    },
    firNumber: '123/2026',
    policeStation: 'Egmore PS',
    district: 'Chennai',
    court: 'Metropolitan Magistrate Court',
    offences: [
      {
        offenceId: new mongoose.Types.ObjectId(),
        section: 'Section 303(2) BNS',
        act: 'BNS 2023',
        title: 'Theft',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: 'Category A'
      }
    ],
    arrestDate: new Date('2026-01-01'),
    remandDate: new Date('2026-01-02'),
    status: APP_STATUS.ASSIGNED
  });

  const appDoc = await BailApplication.create({
    caseId: testCase._id,
    citizenId: citizen._id,
    applicationNumber: 'BA-RBAC-001',
    status: APP_STATUS.ASSIGNED,
    assignedJudgeId: judge1User._id
  });

  assignedAppId = appDoc._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Role-Based Access Control (RBAC) Security Tests', () => {
  test('Test 1: Unauthenticated request to protected endpoint returns 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 2: Citizen role cannot access Admin analytics (returns 403)', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("restricted to [admin] role");
  });

  test('Test 3: Citizen role cannot access Judge queue (returns 403)', async () => {
    const res = await request(app)
      .get('/api/judge/queue')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("restricted to [judge] role");
  });

  test('Test 4: Judge role cannot access Admin user management (returns 403)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${judge1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Test 5: Judge cannot view unassigned case (returns 403 Forbidden)', async () => {
    // Judge 2 attempts to view application assigned strictly to Judge 1
    const res = await request(app)
      .get(`/api/judge/cases/${assignedAppId}`)
      .set('Authorization', `Bearer ${judge2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('You are not assigned to this case file');
  });

  test('Test 6: Judge can access their own assigned case (returns 200 OK)', async () => {
    // Judge 1 views case assigned to them
    const res = await request(app)
      .get(`/api/judge/cases/${assignedAppId}`)
      .set('Authorization', `Bearer ${judge1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.caseFile.application._id).toBe(assignedAppId);
  });

  test('Test 7: Admin can access Admin analytics (returns 200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });
});
