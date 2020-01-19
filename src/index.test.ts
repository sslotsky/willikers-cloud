import request from 'supertest';
import { createConnection, getConnection } from 'typeorm';

import app from './server';

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
});
