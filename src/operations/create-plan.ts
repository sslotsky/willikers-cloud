import { getRepository } from 'typeorm';
import { validate as validateEmail } from 'email-validator';

import { Plan } from '../entity/Plan';
import stripeClient from '../utils/stripe';

/* I suspect this doesn't accurately represent the plan we want.
 * The way it was described to me, we have a base fee that allows
 * a certain number of builds per month, and any builds over that
 * limit will be charged. To me that sounds like a subscription that
 * contains two plans. The first plan represents the base fee, and the
 * second plan contains a tiered billing scheme with two tiers, where
 * the first tier represents the number of builds we won't charge them
 * for, and the second tier represents the price that we charge for
 * additional builds. For simplicity, however, we will express this as
 * one plan where they're charged an amount per build.
 */
export interface PlanRequest {
  amount?: number;
  currency?: string;
  interval?: 'month' | 'year';
  email?: string;
}

export function planName(req: PlanRequest) {
  return `${req.amount}-${req.currency}-${req.interval}`;
}

async function savePlan(req: PlanRequest) {
  const plan = new Plan();
  plan.amount = req.amount;
  plan.currency = req.currency;
  plan.interval = req.interval;
  plan.name = planName(req);
}

class EmailInvalidError extends Error {
  constructor(email: string) {
    super(`${email} is not a valid email address`);
    this.name = 'EmailInvalidError';
    Object.setPrototypeOf(this, EmailInvalidError.prototype);
  }
}

export function createPlanForSalesperson(req: PlanRequest) {
  if (!validateEmail(req.email)) {
    /* Fail fast if the email isn't valid */
    throw new EmailInvalidError(req.email);
  }

  /* Otherwise, this is an async operation */
  createPlan(req)
    .then(() => {
      /* Here we would email the salesperson, but for now we can log
       * this to the console.
       */

      console.log(`
      Thank you ${req.email}, the plan you requested is valid and
      available for use.

      Amount: ${req.amount}
      Currency: ${req.currency}
      Interval: ${req.interval}
    `);
    })
    .catch(e => {
      /* Any errors from createPlan can be communicated by email, so we don't need
       * to fail. We will email the salesperson informing them that their
       * request failed, and communicate the reason for failure.
       */

      console.log(`
      Sorry ${req.email}, we were unable to create your plan for the
      following reason:

      ${e.message}
    `);

      return;
    });
}

export async function createPlan(req: PlanRequest) {
  const repo = getRepository(Plan);

  const matchingPlans = await repo.find({ name: planName(req) });
  if (matchingPlans.length) {
    // This plan already exists, we can use it for our new customer!
    return;
  }

  const stripe = stripeClient();

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
