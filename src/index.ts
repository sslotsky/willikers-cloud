import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { config } from 'dotenv';

import { PlanRequest, createPlanForSalesperson } from './operations/create-plan';

config();

createConnection({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'gee-willikers',
  entities: [__dirname + '/entity/*{.js,.ts}'],
  synchronize: true,
})
  .then(async connection => {
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
        return res
          .status(422)
          .json({ message: "Plan must contain an interval of 'month' or 'year'" });
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
        console.log(e);
        res.status(422).send(e.message);
      }
    });

    app.listen(3000);

    console.log('Express server has started on port 3000.');
  })
  .catch(error => console.log(error));
