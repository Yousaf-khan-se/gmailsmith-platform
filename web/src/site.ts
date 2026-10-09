// Single source of truth for the site's copy and links.
// purchaseUrl flips from '' to the Lemon Squeezy checkout when the store
// exists (docs/08 §8.3, P5 checklist) — until then pricing buttons render
// a disabled state instead of pointing buyers nowhere.
export const site = {
  name: 'GmailSmith',
  url: 'https://gmail.smith.app',
  tagline: 'Desktop mail merge for Gmail',
  description:
    'Send personalised email campaigns from your own Gmail. Your recipient ' +
    'lists never leave your laptop — no cloud, no middleman, no subscription.',
  supportEmail: 'support@gmail.smith.app',
  purchaseUrl: '',
  version: '1.0.0',
  releases: {
    manifest: '/releases/latest.json',
    base: '/releases/',
  },
};

export const pricing = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    devices: '1 device',
    period: '14 days · 25 emails/day',
    blurb: 'Finish a real campaign before you pay a cent.',
    features: [
      'Every feature, unlocked',
      'No credit card',
      'Your lists stay on your laptop',
    ],
    cta: 'Start the free trial',
    featured: false,
  },
  {
    id: 'personal',
    name: 'Personal',
    price: '$29',
    devices: '1 device',
    period: 'One-time payment',
    blurb: 'Buy it once. No monthly fee, ever.',
    features: [
      'Unlimited campaigns',
      'Lifetime updates',
      'One computer',
    ],
    cta: 'Buy Personal — $29',
    featured: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$59',
    devices: '3 devices',
    period: 'One-time payment',
    blurb: 'For the buyer who manages lists for clients.',
    features: [
      'Everything in Personal',
      'Install on three computers',
      'Lifetime updates',
    ],
    cta: 'Buy Agency — $59',
    featured: false,
  },
];
