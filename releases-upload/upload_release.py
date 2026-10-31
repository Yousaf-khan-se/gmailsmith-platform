#!/usr/bin/env python3
"""
upload_release.py -- push desktop build artifacts to Cloudflare R2.

Run after ``python tools/build.py`` in the app repo::

    python upload_release.py --dist ../../gmail-merge/dist

Uploads the installer ``.exe``, ``latest.json`` and ``SHA256SUMS.txt`` from
the given dist directory. The ``/releases/*`` Worker serves these objects
straight from the bucket through its R2 binding (private bucket, no public
URL), so the download-page snippet in docs/08 §8.1 keeps using relative
``/releases/`` URLs unchanged.

Credentials come from the environment only (never committed):
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
    R2_BUCKET  (optional, default "gmailsmith-releases")

R2 speaks the S3 API, so any S3 client works; boto3 keeps this script
Python-only, consistent with the rest of the tooling.
"""

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

DEFAULT_BUCKET = 'gmailsmith-releases'
ARTIFACT_PATTERNS = ('*.exe', 'latest.json', 'SHA256SUMS.txt')
VERSION_PATTERN = re.compile(r'^\d+(?:\.\d+){1,3}$')
INSTALLER_PATTERN = re.compile(
    r'^GmailSmithSetup-(\d+(?:\.\d+){1,3})\.exe$')
SHA256_PATTERN = re.compile(r'^[a-f0-9]{64}$', re.IGNORECASE)


def _sha256_file(path: Path, chunk_size=1 << 20):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def collect(dist: Path):
    """Every artifact in dist/ that should reach the bucket."""
    found = []
    for pattern in ARTIFACT_PATTERNS:
        found.extend(sorted(dist.glob(pattern)))
    return found


def _version_parts(value):
    if not isinstance(value, str) or not VERSION_PATTERN.fullmatch(value):
        raise ValueError(f'invalid version: {value!r}')
    return tuple(int(part) for part in value.split('.'))


def _compare_versions(left, right):
    a = _version_parts(left)
    b = _version_parts(right)
    for index in range(max(len(a), len(b))):
        left_part = a[index] if index < len(a) else 0
        right_part = b[index] if index < len(b) else 0
        if left_part != right_part:
            return -1 if left_part < right_part else 1
    return 0


def validate_release_manifest(manifest, dist: Path):
    """Validate the installer and optional update floor before any upload."""
    if not isinstance(manifest, dict):
        raise ValueError('latest.json must contain a JSON object')
    version = manifest.get('version')
    _version_parts(version)

    installer = manifest.get('installer')
    if not isinstance(installer, dict):
        raise ValueError('latest.json must identify a Windows installer')
    filename = installer.get('filename')
    match = (INSTALLER_PATTERN.fullmatch(filename)
             if isinstance(filename, str) else None)
    if not match or _compare_versions(match.group(1), version) != 0:
        raise ValueError('installer filename must match the release version')

    size = installer.get('bytes')
    if type(size) is not int or size <= 0:
        raise ValueError('installer bytes must be a positive integer')
    digest = installer.get('sha256')
    if not isinstance(digest, str) or not SHA256_PATTERN.fullmatch(digest):
        raise ValueError('installer sha256 must be a 64-character hex digest')

    installer_path = dist / filename
    if not installer_path.is_file():
        raise ValueError(f'installer is missing from dist/: {filename}')
    if installer_path.stat().st_size != size:
        raise ValueError('installer size does not match latest.json')
    actual_digest = _sha256_file(installer_path)
    if actual_digest.lower() != digest.lower():
        raise ValueError('installer checksum does not match latest.json')

    if 'force_below' in manifest:
        floor = manifest['force_below']
        _version_parts(floor)
        if _compare_versions(floor, version) > 0:
            raise ValueError('force_below cannot be newer than release version')

    return installer_path


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
        manifest_data = json.loads(manifest.read_text(encoding='utf-8'))
    except ValueError as exc:
        print(f'ERROR: latest.json is not valid JSON: {exc}', file=sys.stderr)
        return 1

    try:
        validate_release_manifest(manifest_data, dist)
    except (OSError, ValueError) as exc:
        print(f'ERROR: invalid release manifest: {exc}', file=sys.stderr)
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
