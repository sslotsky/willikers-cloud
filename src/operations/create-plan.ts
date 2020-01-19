import { getRepository } from 'typeorm';
import StripeClient, { Stripe } from 'stripe';

import { Plan } from '../entity/Plan';

export interface PlanRequest {
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  email: string;
}

function planName(req: PlanRequest) {
  return `${req.amount}-${req.currency}-${req.interval}`;
}

async function savePlan(req: PlanRequest) {
  const plan = new Plan();
  plan.amount = req.amount;
  plan.currency = req.currency;
  plan.interval = req.interval;
  plan.name = planName(req);
}

export default async function createPlan(req: PlanRequest) {
  const repo = getRepository(Plan);

  const matchingPlans = await repo.find({ name: planName(req) });
  if (matchingPlans.length) {
    // This plan already exists, we can use it for our new customer!
    return;
  }

  const stripe = new StripeClient(process.env.STRIPE_SECRET, {
    apiVersion: '2019-12-03',
    typescript: true,
  });

  try {
    await stripe.plans.create({
      amount: req.amount,
      currency: req.currency,
      interval: req.interval,
      product: { name: 'Willikers Cloud' },
      billing_scheme: 'per_unit',
      usage_type: 'metered',
      id: planName(req),
    });

    /* Stripe successfully created the plan, so let's save a reflection
     * of that plan to our database.
     */
    await savePlan(req);
    return;
    return;
  } catch (e) {
    if (e.raw.code === 'resource_already_exists') {
      /* This plan exists in stripe, but isn't reflected in our database.
       * Let's fix that and save it, and return successfully.
       */
      await savePlan(req);
      return;
    }

    if (e.raw.code === 'parameter_invalid_integer' && e.param === 'amount') {
      throw new Error('Please specify the price in cents (no decimals).');
    }

    // Something else went wrong, let's send the error back.
    throw e;
  }
}
