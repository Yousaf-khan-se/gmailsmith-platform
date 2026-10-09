import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Legal documents are copied from gmail-merge/docs/legal/ (the source of
// truth — see the platform README). No schema: the pages supply titles.
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
});

export const collections = { legal };
