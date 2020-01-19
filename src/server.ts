import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';

import { PlanRequest, createPlanForSalesperson } from './operations/create-plan';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', async (req, res) => {
  /* Let's do some basic request validation. This assumes that the
   * interface that the salesperson is using has a way to surface
   * errors returned from this API. Although many of this possible
   * errors could be communicated via email, if the salesperson fails
   * to send an email address, then returning an error message from
   * the webhook is the only way to communicate that problem. So
   * we can do the most basic validation at this level, and then
   * communicate any other operational issues via email.
   */
  const plan = req.body as PlanRequest;
  if (!plan.amount) {
    return res.status(422).json({
      message: "Plan must contain 'amount' field to specify price in cents per build",
    });
  }

  if (!plan.currency) {
    return res.status(422).json({ message: "Plan must contain a currency, e.g. 'usd'" });
  }

  if (!plan.interval || !['month', 'year'].includes(plan.interval)) {
    return res.status(422).json({ message: "Plan must contain an interval of 'month' or 'year'" });
  }

  if (!plan.email) {
    return res
      .status(422)
      .json({ message: 'Please specify an email for the salesperson requesting the plan' });
  }

  try {
    createPlanForSalesperson(plan);
    res.status(200).end();
  } catch (e) {
    res.status(422).json({ message: e.message });
  }
});

export default app;
