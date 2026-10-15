// Single source of truth for the site's copy and links.
// Per-tier checkoutMonthly / checkoutYearly URLs (plus the site-wide
// purchaseUrl fallback) flip from '' to the Lemon Squeezy variant checkout
// links when the store exists (docs/08 §8.3, P5 checklist) — until then the
// paid pricing buttons render a disabled state instead of pointing buyers
// nowhere. The Free tier always links straight to the download.
export const site = {
  name: 'GmailSmith',
  url: 'https://gmailsmith.app',
  tagline: 'Desktop mail merge for Gmail',
  description:
    'Send personalised email campaigns from your own Gmail. Your recipient ' +
    'lists never leave your laptop — no cloud, no middleman, send-only access.',
  supportEmail: 'support@gmailsmith.app',
  purchaseUrl: '',
  version: '1.0.0',
  releases: {
    manifest: '/releases/latest.json',
    base: '/releases/',
  },
};

export type PricingTier = {
  id: string;
  name: string;
  price: string;
  devices: string;
  period: string;
  yearly?: { price: string; note: string };
  blurb: string;
  features: string[];
  cta: string;
  checkoutMonthly: string;
  checkoutYearly: string;
  featured: boolean;
};

export const pricing: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    devices: '1 device',
    period: 'forever · 25 emails/day',
    blurb: 'The full app, at a gentle pace. No card, no clock.',
    features: [
      'Every core feature',
      'No credit card, no time limit',
      'Your lists stay on your laptop',
    ],
    cta: 'Download the app',
    checkoutMonthly: '',
    checkoutYearly: '',
    featured: false,
  },
  {
    id: 'personal',
    name: 'Personal',
    price: '$4.99',
    devices: '1 device',
    period: 'per month, billed monthly',
    yearly: { price: '$39/year', note: 'save 35%' },
    blurb: 'For newsletters and regular campaigns at real volume.',
    features: [
      '500 emails/day',
      'Unlimited campaigns',
      'Cancel anytime — drops to Free',
    ],
    cta: 'Start Personal — $4.99/mo',
    checkoutMonthly: '',
    checkoutYearly: '',
    featured: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$12.99',
    devices: '3 devices',
    period: 'per month, billed monthly',
    yearly: { price: '$99/year', note: 'save 36%' },
    blurb: 'For the people who manage lists for clients.',
    features: [
      'Everything in Personal',
      'Three computers',
      'Priority support',
    ],
    cta: 'Start Agency — $12.99/mo',
    checkoutMonthly: '',
    checkoutYearly: '',
    featured: false,
  },
];
