import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import { config } from "dotenv";

config();

createConnection({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "gee-willikers",
  entities: [__dirname + "/entity/*{.js,.ts}"],
  synchronize: true
})
  .then(async connection => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post("/webhook", (req, res) => {
      console.log(req.headers["content-type"], req.body);
      res.json(req.body);
    });

    app.listen(3000);

    console.log("Express server has started on port 3000.");
  })
  .catch(error => console.log(error));
