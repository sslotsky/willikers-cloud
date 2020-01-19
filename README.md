# Willikers Cloud

Steps to run this project:

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
