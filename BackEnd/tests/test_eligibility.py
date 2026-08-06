import unittest

import numpy as np

from service.eligibility import build_eligibility_mask


class BuildEligibilityMaskTests(unittest.TestCase):
    def test_private_essays_are_ineligible(self):
        mask = build_eligibility_mask([True, False], [False, False], ["PS", "PS"], None)
        np.testing.assert_array_equal(mask, np.array([True, False]))

    def test_deleted_essays_are_ineligible(self):
        mask = build_eligibility_mask([True, True], [False, True], ["PS", "PS"], None)
        np.testing.assert_array_equal(mask, np.array([True, False]))

    def test_type_filter_excludes_other_types(self):
        mask = build_eligibility_mask(
            [True, True], [False, False], ["PS", "Supplemental"], ["PS"]
        )
        np.testing.assert_array_equal(mask, np.array([True, False]))

    def test_all_keyword_disables_type_filter(self):
        mask = build_eligibility_mask(
            [True, True], [False, False], ["PS", "Supplemental"], ["all"]
        )
        np.testing.assert_array_equal(mask, np.array([True, True]))

    def test_empty_type_list_disables_type_filter(self):
        mask = build_eligibility_mask(
            [True, True], [False, False], ["PS", "Supplemental"], []
        )
        np.testing.assert_array_equal(mask, np.array([True, True]))

    def test_multiple_types_are_unioned(self):
        mask = build_eligibility_mask(
            [True, True, True], [False, False, False],
            ["PS", "Supplemental", "University of California"],
            ["PS", "University of California"],
        )
        np.testing.assert_array_equal(mask, np.array([True, False, True]))

    def test_visibility_and_type_are_combined(self):
        mask = build_eligibility_mask(
            [True, False], [False, False], ["PS", "PS"], ["PS"]
        )
        np.testing.assert_array_equal(mask, np.array([True, False]))

    def test_empty_index_returns_empty_mask(self):
        mask = build_eligibility_mask([], [], [], ["PS"])
        self.assertEqual(mask.shape, (0,))
        self.assertEqual(mask.dtype, np.bool_)

    def test_short_flag_lists_fail_closed(self):
        mask = build_eligibility_mask([True], [], ["PS", "PS"], None)
        np.testing.assert_array_equal(mask, np.array([True, False]))


if __name__ == "__main__":
    unittest.main()
