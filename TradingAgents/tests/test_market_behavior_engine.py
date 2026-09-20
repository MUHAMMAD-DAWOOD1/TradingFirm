"""
Unit Test Suite for XAUUSD Market Behavior Operating System & Quantitative Decision Core
Tests:
1. Regime Classification (7 Parent Regimes: Trend, Range, Expansion, Sweep, Rejection, Reversion, Transition)
2. FVG Detection & 50% Consequent Encroachment (CE)
3. SMT Divergence (Gold vs Silver)
4. London Open Killzone (Judas Swing)
5. Strict NO-TRADE Mid-Range Gating
6. Bayesian Setup Scoring (0 - 100)
7. Integration with Trap Detector Service
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timezone

from backend.services.market_behavior_engine import (
    compute_atr,
    compute_adx,
    classify_parent_regime,
    detect_fair_value_gaps,
    detect_smt_divergence,
    detect_session_killzones,
    evaluate_no_trade_gate,
    calculate_bayesian_setup_score,
    map_active_scenario,
    analyze_market_operating_system
)
from backend.services.trap_detector_service import audit_signal


class TestMarketBehaviorEngine(unittest.TestCase):

    def setUp(self):
        # 50-candle synthetic trending dataset
        dates = pd.date_range(start="2026-06-01", periods=60, freq="1h")
        self.trend_df = pd.DataFrame({
            "Open": np.linspace(4000, 4200, 60),
            "High": np.linspace(4005, 4210, 60),
            "Low": np.linspace(3995, 4195, 60),
            "Close": np.linspace(4003, 4205, 60)
        }, index=dates)

        # 50-candle sideways range dataset
        self.range_df = pd.DataFrame({
            "Open": [4000 + (i % 4) * 2 for i in range(60)],
            "High": [4010 for _ in range(60)],
            "Low": [3990 for _ in range(60)],
            "Close": [4001 + (i % 4) * 2 for i in range(60)]
        }, index=dates)

    def test_1_regime_classifier(self):
        """Verify that strong trending data is classified into Parent 1 (DIRECTIONAL_TREND)"""
        regime = classify_parent_regime(self.trend_df)
        self.assertIn("parent_id", regime)
        self.assertEqual(regime["parent_id"], 1)
        self.assertEqual(regime["parent_name"], "DIRECTIONAL_TREND")
        self.assertEqual(regime["trend_direction"], "BULLISH")

    def test_2_fvg_detection_and_ce(self):
        """Verify 3-candle Fair Value Gap detection and 50% Consequent Encroachment midpoint"""
        # Inject an explicit bullish FVG: Low[t] > High[t-2]
        df = self.range_df.copy()
        df.iloc[-3, df.columns.get_loc('High')] = 4000.0
        df.iloc[-2, df.columns.get_loc('High')] = 4030.0
        df.iloc[-2, df.columns.get_loc('Low')] = 4000.0
        df.iloc[-1, df.columns.get_loc('Low')] = 4015.0  # Gap between 4000 and 4015 = 15 points
        
        atr = 5.0
        fvgs = detect_fair_value_gaps(df, atr=atr)
        self.assertGreater(len(fvgs), 0)
        top_fvg = fvgs[-1]
        self.assertEqual(top_fvg["type"], "BULLISH_FVG")
        self.assertEqual(top_fvg["bottom"], 4000.0)
        self.assertEqual(top_fvg["top"], 4015.0)
        # Midpoint CE 50% should be (4015 + 4000) / 2 = 4007.5
        self.assertEqual(top_fvg["ce_50_midpoint"], 4007.5)

    def test_3_smt_divergence(self):
        """Verify SMT Divergence identification between Gold and Silver"""
        dates = pd.date_range(start="2026-06-01", periods=15, freq="1h")
        # Gold makes Higher High: 2500 -> 2550
        gold_df = pd.DataFrame({
            "High": [2500] * 10 + [2510, 2520, 2530, 2540, 2560],
            "Low": [2480] * 15,
            "Close": [2490] * 15
        }, index=dates)
        # Silver fails to make Higher High: 32 -> 30 (Lower High)
        silver_df = pd.DataFrame({
            "High": [32.0] * 10 + [31.5, 31.0, 30.5, 30.0, 29.8],
            "Low": [28.0] * 15,
            "Close": [29.0] * 15
        }, index=dates)

        smt = detect_smt_divergence(gold_df, silver_df)
        self.assertTrue(smt["smt_active"])
        self.assertEqual(smt["type"], "BEARISH_SMT_DIVERGENCE")
        self.assertEqual(smt["signal"], "SHORT")

    def test_4_london_judas_killzone(self):
        """Verify session killzone categorization at 07:30 UTC"""
        kz = detect_session_killzones(utc_hour=7, utc_minute=30)
        self.assertTrue(kz["is_killzone"])
        self.assertEqual(kz["session"], "LONDON_OPEN_KILLZONE")
        self.assertEqual(kz["setup_affinity"], "LONDON_JUDAS_SWING")

    def test_5_no_trade_mid_range_gate(self):
        """Verify that price inside 50% equilibrium triggers strict NO-TRADE gate"""
        regime_info = {"parent_id": 2, "parent_name": "CONSOLIDATION_RANGE"}
        is_blocked, reason = evaluate_no_trade_gate(
            price=4000.0,
            range_low=3900.0,
            range_high=4100.0,
            regime_info=regime_info
        )
        self.assertTrue(is_blocked)
        self.assertIn("NO-TRADE", reason)
        self.assertIn("Mid-Range equilibrium", reason)

    def test_6_bayesian_scoring(self):
        """Verify multi-factor Bayesian setup scoring calculation"""
        high_score = calculate_bayesian_setup_score(
            regime_match=True,
            structure_aligned=True,
            sweep_present=True,
            fvg_present=True,
            smt_confirmed=True,
            risk_reward=2.5,
            is_killzone=True
        )
        self.assertGreaterEqual(high_score, 80)

        low_score = calculate_bayesian_setup_score(
            regime_match=False,
            structure_aligned=False,
            sweep_present=False,
            fvg_present=False,
            smt_confirmed=False,
            risk_reward=1.1,
            is_killzone=False
        )
        self.assertLessEqual(low_score, 30)

    def test_7_trap_detector_integration(self):
        """Verify that trap_detector_service incorporates Market OS audit"""
        dummy_signal = {
            "asset": "XAUUSD",
            "direction": "BUY",
            "entry_min": 4050.0,
            "entry_max": 4055.0,
            "stop_loss": 4030.0,
            "take_profit_targets": [4100.0]
        }
        res = audit_signal(dummy_signal)
        self.assertIn("market_os_audit", res)
        self.assertIn("trap_score", res)
        self.assertIn("trap_reasons", res)


if __name__ == "__main__":
    unittest.main()
