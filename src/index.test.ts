import request from 'supertest';
import { createConnection, getConnection } from 'typeorm';

import app from './server';
import stripeClient from './utils/stripe';
import { PlanRequest } from './operations/create-plan';

jest.mock('./utils/stripe', () => () => ({
  plans: {
    create: jest.fn(),
  },
}));

describe('webhook', () => {
  beforeEach(() => {
    return createConnection({
      type: 'sqlite',
      database: 'memory',
      dropSchema: true,
      entities: [__dirname + '/entity/*{.js,.ts}'],
      synchronize: true,
    });
  });

  afterEach(() => {
    return getConnection().close();
  });

  describe('missing amount', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          currency: 'usd',
          interval: 'month',
          email: 'foo@bar.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual(
        "Plan must contain 'amount' field to specify price in cents per build"
      );
    });
  });

  describe('missing currency', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          amount: 5000,
          interval: 'month',
          email: 'foo@bar.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual("Plan must contain a currency, e.g. 'usd'");
    });
  });

  describe('missing interval', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          amount: 5000,
          currency: 'usd',
          email: 'foo@bar.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual("Plan must contain an interval of 'month' or 'year'");
    });
  });

  describe('invalid interval', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          amount: 5000,
          currency: 'usd',
          interval: 'day',
          email: 'foo@bar.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual("Plan must contain an interval of 'month' or 'year'");
    });
  });

  describe('missing email', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          amount: 5000,
          currency: 'usd',
          interval: 'month',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual(
        'Please specify an email for the salesperson requesting the plan'
      );
    });
  });

  describe('invalid email', () => {
    it('returns a 422', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({
          amount: 5000,
          currency: 'usd',
          interval: 'month',
          email: 'foobar',
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toEqual('foobar is not a valid email address');
    });
  });

  describe('a valid plan request', () => {
    it('should succeed', async () => {
      const client = stripeClient();
      client.plans.create = jest.fn().mockResolvedValue({});

      const req: PlanRequest = {
        amount: 5000,
        currency: 'usd',
        interval: 'month',
        email: 'foobar@example.com',
      };

      const res = await request(app)
        .post('/webhook')
        .send(req);

      expect(res.status).toBe(200);
      //const repo = getRepository(Plan);
      //const plans = await repo.find({ name: planName(req) });
      //console.log(plans);
      //expect(plans).toHaveLength(1);
    });
  });
});
