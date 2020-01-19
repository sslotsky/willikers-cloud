import { createConnection, getConnection } from 'typeorm';
import { getRepository } from 'typeorm';

import stripeClient from '../utils/stripe';
import { Plan } from '../entity/Plan';
import { planName, PlanRequest } from './create-plan';
import { createPlan } from './create-plan';

jest.mock('../utils/stripe', () => () => ({
  plans: {
    create: jest.fn(),
  },
}));

describe('createPlan', () => {
  beforeEach(() => {
    return createConnection({
      type: 'sqlite',
      database: 'memory',
      dropSchema: true,
      entities: [Plan],
      synchronize: true,
    });
  });

  afterEach(() => {
    return getConnection().close();
  });

  describe('a valid plan request', () => {
    describe('when the plan does not already exist in our database', () => {
      it('should create a new plan', async () => {
        const client = stripeClient();
        client.plans.create = jest.fn().mockResolvedValue({});

        const req: PlanRequest = {
          amount: 5000,
          currency: 'usd',
          interval: 'month',
          email: 'foobar@example.com',
        };

        await createPlan(req);

        const repo = getRepository(Plan);
        const plans = await repo.find({ name: planName(req) });
        console.log(plans);
        expect(plans).toHaveLength(1);
      });
    });

    describe('when the plan already exists in our database', () => {
      const req: PlanRequest = {
        amount: 5000,
        currency: 'usd',
        interval: 'month',
        email: 'foobar@example.com',
      };

      beforeEach(() => {
        const repo = getRepository(Plan);
        const existingPlan = new Plan();
        existingPlan.amount = req.amount;
        existingPlan.currency = req.currency;
        existingPlan.interval = req.interval;
        existingPlan.name = planName(req);
        return repo.save(existingPlan);
      });

      it('should not create a new plan', async () => {
        const client = stripeClient();
        client.plans.create = jest.fn().mockResolvedValue({});

        await createPlan(req);

        const repo = getRepository(Plan);
        const plans = await repo.find({ name: planName(req) });
        console.log(plans);
        expect(plans).toHaveLength(1);
      });
    });

    describe('when the plan already exists in stripe', () => {
      it('saves it to the database', async () => {
        const client = stripeClient();
        client.plans.create = jest.fn().mockRejectedValue({
          raw: {
            code: 'resource_already_exists',
          },
        });

        const req: PlanRequest = {
          amount: 5000,
          currency: 'usd',
          interval: 'month',
          email: 'foobar@example.com',
        };

        await createPlan(req);

        const repo = getRepository(Plan);
        const plans = await repo.find({ name: planName(req) });
        console.log(plans);
        expect(plans).toHaveLength(1);
      });
    });
  });
});
