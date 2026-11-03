// Structured-data builders and URL helpers for the site's SEO foundation.
// Every claim here must match the live product: the Free plan is the only
// available tier while paid checkout is disabled (docs/08 §8.3).
import { site } from '../site';

export type JsonLd = Record<string, unknown>;

export type Crumb = { name: string; path: string };

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/`,
    logo: absoluteUrl('/mark.png'),
    email: site.supportEmail,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: site.supportEmail,
        url: absoluteUrl(site.contactUrl),
        availableLanguage: ['English'],
      },
    ],
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: `${site.url}/`,
    name: site.name,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export function softwareApplicationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${site.url}/#software`,
    name: site.name,
    url: `${site.url}/`,
    description: site.description,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Mail merge',
    operatingSystem: 'Windows 10, Windows 11',
    softwareVersion: site.version,
    isAccessibleForFree: true,
    downloadUrl: absoluteUrl('/#download'),
    installUrl: absoluteUrl('/install'),
    featureList: [
      'Import recipients from a CSV file',
      'Personalize subject lines and message bodies with merge fields',
      'Attach files to every message',
      'Send through Gmail OAuth or a Gmail App Password',
      'Preview and test a message before sending',
      'Track per-recipient delivery results and export campaign history',
      'Keep recipient lists and campaign history on your computer',
      'No browser extension and no Google Workspace requirement',
    ],
    offers: {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl('/#download'),
    },
    publisher: { '@id': `${site.url}/#organization` },
    inLanguage: 'en',
  };
}

export function breadcrumbSchema(crumbs: Crumb[]): JsonLd {
  const items: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

// Escape `<` so a future content-driven value cannot close the script tag.
export function jsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
