import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const databaseId = config.d1_databases?.[0]?.database_id;
if (!databaseId || databaseId === '00000000-0000-0000-0000-000000000000') {
  console.error('Set the D1 database_id in wrangler.jsonc before deploying or applying remote migrations.');
  process.exit(1);
}

if (config.vars?.WAITLIST_OPEN !== 'true' && config.vars?.WAITLIST_OPEN !== 'false') {
  console.error('Set WAITLIST_OPEN to either "true" or "false" in wrangler.jsonc.');
  process.exit(1);
}
