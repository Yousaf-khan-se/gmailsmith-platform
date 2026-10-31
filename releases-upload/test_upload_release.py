"""Tests for release upload manifest validation."""

import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from upload_release import validate_release_manifest  # noqa: E402


class ReleaseManifestValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(prefix='gmailsmith-release-')
        self.dist = Path(self.temp_dir.name)
        self.installer_bytes = b'installer-fixture'
        self.installer_name = 'GmailSmithSetup-1.2.0.exe'
        (self.dist / self.installer_name).write_bytes(self.installer_bytes)
        self.manifest = {
            'version': '1.2.0',
            'installer': {
                'filename': self.installer_name,
                'bytes': len(self.installer_bytes),
                'sha256': hashlib.sha256(self.installer_bytes).hexdigest(),
            },
        }

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_accepts_valid_forced_update_manifest(self):
        self.manifest['force_below'] = '1.1.0'
        path = validate_release_manifest(self.manifest, self.dist)
        self.assertEqual(path.name, self.installer_name)

    def test_rejects_floor_newer_than_release(self):
        self.manifest['force_below'] = '1.3.0'
        with self.assertRaises(ValueError):
            validate_release_manifest(self.manifest, self.dist)

    def test_rejects_path_traversal_installer(self):
        self.manifest['installer']['filename'] = '../GmailSmithSetup-1.2.0.exe'
        with self.assertRaises(ValueError):
            validate_release_manifest(self.manifest, self.dist)

    def test_rejects_missing_or_mismatched_installer(self):
        self.manifest['installer']['filename'] = 'GmailSmithSetup-1.1.0.exe'
        with self.assertRaises(ValueError):
            validate_release_manifest(self.manifest, self.dist)

    def test_rejects_checksum_mismatch(self):
        self.manifest['installer']['sha256'] = '0' * 64
        with self.assertRaises(ValueError):
            validate_release_manifest(self.manifest, self.dist)


if __name__ == '__main__':
    unittest.main()
