import unittest


class DeliberateCiFailureProof(unittest.TestCase):
    def test_backend_quality_gate_rejects_broken_candidate(self):
        self.fail("deliberate backend quality-gate failure")
