import { getRepository } from 'typeorm';
import StripeClient, { Stripe } from 'stripe';

import { Plan } from '../entity/Plan';

export default async function createPlan(plan: Plan) {
  const repo = getRepository(Plan);
  const planName = `${plan.amount}-${plan.currency}-${plan.interval}`;

  const matchingPlans = await repo.find({ name: planName });
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
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      product: { name: 'Willikers Cloud' },
      billing_scheme: 'per_unit',
      usage_type: 'metered',
      id: planName,
    });

    /* Stripe successfully created the plan, so let's save a reflection
     * of that plan to our database.
     */
    plan.name = planName;
    repo.save(plan);
    return;
  } catch (e) {
    if (e.raw.code === 'resource_already_exists') {
      /* This plan exists in stripe, but isn't reflected in our database.
       * Let's fix that and save it, and return successfully.
       */
      plan.name = planName;
      repo.save(plan);
      return;
    }

    // Something else went wrong, let's send the error back.
    throw e;
  }
}
