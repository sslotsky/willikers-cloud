import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { config } from 'dotenv';

import app from './server';

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
  .then(() => {
    app.listen(3000);

    console.log('Express server has started on port 3000.');
  })
  .catch(error => console.log(error));
