import importlib.util
import io
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).parents[1] / "scripts" / "export_waitlist.py"
SPEC = importlib.util.spec_from_file_location("export_waitlist", SCRIPT)
export_waitlist = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(export_waitlist)


class ExportWaitlistTests(unittest.TestCase):
    def test_finds_wrapped_d1_results(self):
        payload = [{"success": True, "results": [{"email": "a@example.com"}]}]
        self.assertEqual(export_waitlist.find_result_rows(payload), [{"email": "a@example.com"}])

    def test_retention_uses_a_calendar_year(self):
        now = datetime(2026, 10, 18, tzinfo=timezone.utc)
        self.assertTrue(export_waitlist.is_within_retention("2025-10-19T00:00:00Z", now))
        self.assertFalse(export_waitlist.is_within_retention("2025-10-17T23:59:59Z", now))

    def test_export_contains_only_active_and_in_retention_columns(self):
        payload = [{"results": [
            {"email": "a@example.com", "consented_at": "2026-10-18T00:00:00Z", "source": "site", "launch_notice_sent_at": None},
            {"email": "b@example.com", "consented_at": "2026-10-18T00:00:00Z", "source": None, "launch_notice_sent_at": "2026-10-19T00:00:00Z"},
            {"email": "old@example.com", "consented_at": "2024-10-18T00:00:00Z", "source": None, "launch_notice_sent_at": None},
        ]}]
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "waitlist.csv"
            with patch.object(sys, "stdin", io.StringIO(json.dumps(payload))), \
                 patch.object(sys, "argv", [str(SCRIPT), str(output)]):
                self.assertEqual(export_waitlist.main(), 0)
            content = output.read_text(encoding="utf-8-sig")
            self.assertIn("email,consented_at,source", content)
            self.assertIn("a@example.com,2026-10-18T00:00:00Z,site", content)
            self.assertNotIn("b@example.com", content)
            self.assertNotIn("old@example.com", content)
            self.assertNotIn("launch_notice_sent_at", content)


if __name__ == "__main__":
    unittest.main()
