# Willikers Cloud

## Running the project

First, you'll have to create a `.env` file with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASS=your_password
STRIPE_SECRET=your_stripe_api_secret
```

Then you can run the project:

1. Run `npm i` command
1. Run `npm start` command

## Testing

To run tests:

```
npm test
```

There are two test files:

1. `src/index.test.ts` is a set of integration tests which execute requests against the webhook route using supertest.
1. `src/operations/create-plan.test.ts` is a set of unit tests that verify the creation of database records under different scenarios.

**Note:** Tests currently run in band instead of concurrently, because the db connection was otherwise locked and I could not get multiple connections working properly.
