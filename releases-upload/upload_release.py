#!/usr/bin/env python3
"""
upload_release.py -- push desktop build artifacts to Cloudflare R2.

Run after ``python tools/build.py`` in the app repo::

    python upload_release.py --dist ../../gmail-merge/dist

Uploads the installer ``.exe``, ``latest.json`` and ``SHA256SUMS.txt`` from
the given dist directory. The site's ``/releases/*`` Worker 302-redirects to
these objects, so the download-page snippet in docs/08 §8.1 keeps using
relative ``/releases/`` URLs unchanged.

Credentials come from the environment only (never committed):
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
    R2_BUCKET  (optional, default "gmailsmith-releases")

R2 speaks the S3 API, so any S3 client works; boto3 keeps this script
Python-only, consistent with the rest of the tooling.
"""

import argparse
import json
import os
import sys
from pathlib import Path

DEFAULT_BUCKET = 'gmailsmith-releases'
ARTIFACT_PATTERNS = ('*.exe', 'latest.json', 'SHA256SUMS.txt')


def collect(dist: Path):
    """Every artifact in dist/ that should reach the bucket."""
    found = []
    for pattern in ARTIFACT_PATTERNS:
        found.extend(sorted(dist.glob(pattern)))
    return found


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--dist', default='../../gmail-merge/dist',
                        help='directory produced by tools/build.py')
    parser.add_argument('--bucket', default=os.environ.get('R2_BUCKET',
                                                           DEFAULT_BUCKET))
    parser.add_argument('--dry-run', action='store_true',
                        help='list uploads without touching the network')
    args = parser.parse_args(argv)

    dist = Path(args.dist)
    if not dist.is_dir():
        print(f'ERROR: dist directory not found: {dist}', file=sys.stderr)
        return 1

    files = collect(dist)
    if not files:
        print(f'ERROR: no release artifacts in {dist}', file=sys.stderr)
        return 1

    # latest.json must exist and parse -- a broken manifest is worse than a
    # missing one (docs/08 §8.1).
    manifest = dist / 'latest.json'
    if manifest not in files:
        print('ERROR: latest.json missing from dist/', file=sys.stderr)
        return 1
    try:
        json.loads(manifest.read_text(encoding='utf-8'))
    except ValueError as exc:
        print(f'ERROR: latest.json is not valid JSON: {exc}', file=sys.stderr)
        return 1

    total = sum(f.stat().st_size for f in files)
    print(f'Uploading {len(files)} file(s), {total / 1048576:.1f} MB, '
          f'to bucket "{args.bucket}"')

    if args.dry_run:
        for path in files:
            print(f'  would upload: {path.name} '
                  f'({path.stat().st_size / 1048576:.1f} MB)')
        return 0

    missing = [name for name in ('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID',
                                 'R2_SECRET_ACCESS_KEY')
               if not os.environ.get(name)]
    if missing:
        print(f'ERROR: missing environment variables: {", ".join(missing)}',
              file=sys.stderr)
        return 1

    try:
        import boto3
    except ImportError:
        print('ERROR: boto3 is required -- pip install -r requirements.txt',
              file=sys.stderr)
        return 1

    endpoint = f'https://{os.environ["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com'
    client = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        region_name='auto',
    )

    for path in files:
        extra = {}
        if path.suffix == '.json':
            extra['ContentType'] = 'application/json'
        elif path.suffix == '.txt':
            extra['ContentType'] = 'text/plain'
        print(f'  uploading {path.name} ...')
        client.upload_file(str(path), args.bucket, path.name, ExtraArgs=extra)

    print('Done. Verify with the download page against '
          '/releases/latest.json.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
