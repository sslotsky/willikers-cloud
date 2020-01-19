import StripeClient from 'stripe';

export default function stripe() {
  return new StripeClient(process.env.STRIPE_SECRET, {
    apiVersion: '2019-12-03',
    typescript: true,
  });
}
