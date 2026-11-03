// Single source of truth for the site's copy and links.
// Per-tier checkoutMonthly / checkoutYearly URLs (plus the site-wide
// purchaseUrl fallback) flip from '' to the Paddle checkout links when the
// store is approved (docs/08 §8.3, P5 checklist). Public acquisition copy and
// CTAs follow the availability setting below.
export const site = {
  name: 'GmailSmith',
  url: 'https://gmailsmith.app',
  tagline: 'Desktop mail merge for Gmail',
  // Keep the default description at or below 155 characters so Google does
  // not truncate it. Page-level descriptions can be more specific.
  description:
    'GmailSmith is a Windows desktop mail merge app for Gmail. Personalize ' +
    'messages from a CSV while your recipient list stays on your computer.',
  ogImage: '/og-image.png',
  ogImageAlt: 'GmailSmith — mail merge for Gmail from a CSV on Windows',
  themeColor: '#100e0b',
  supportEmail: 'support@gmailsmith.app',
  purchaseUrl: '',
  refundPolicyUrl: '/refund-policy',
  contactUrl: '/contact',
  availability: 'download' as 'waitlist' | 'download',
  waitlistConsentVersion: 'v1',
  version: '1.0.2',
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
