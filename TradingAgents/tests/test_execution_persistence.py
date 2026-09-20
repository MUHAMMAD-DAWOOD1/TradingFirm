"""
End-to-End Test Suite for Custom Capital Synchronization, Persistence & Mark-to-Market
Tests:
1. Persistent account_state table in SQLite.
2. Custom capital reset (e.g. $100).
3. Trade execution & persistence in paper_trades.
4. Mark-to-market TP trigger & automated balance increment.
5. Re-hydration on server restart (verifying nothing is lost).
"""

import unittest
from backend.database import (
    init_db,
    get_persisted_account_state,
    save_persisted_account_state,
    get_open_paper_trades,
    get_closed_paper_trades
)
from backend.execution.engine import (
    TradeOrder,
    open_position,
    update_positions_mark_to_market,
    get_execution_state,
    reset_account_capital,
    hydrate_state_from_db
)
from backend.services.capital_tailoring_service import calculate_tailored_plan


class TestExecutionPersistence(unittest.TestCase):

    def setUp(self):
        init_db()
        # Set custom capital to $100.0
        reset_account_capital(100.0, hard_reset=True)

    def test_1_capital_tailoring_micro_account(self):
        """Verify that $100 account gets tailored micro-lot (0.01) and strict risk <= $2.00"""
        plan = calculate_tailored_plan(
            user_capital=100.0,
            risk_pct=2.0,
            entry_price=4100.0,
            stop_loss=4090.0,
            take_profit=4130.0,
            symbol="XAUUSD"
        )
        self.assertEqual(plan["user_capital"], 100.0)
        self.assertEqual(plan["max_risk_usd"], 2.0)
        self.assertEqual(plan["lot_size_float"], 0.01)
        self.assertIn("0.01 Lots", plan["lot_size_str"])

    def test_2_order_execution_and_persistence(self):
        """Verify that opening a trade persists in SQLite and updates margin"""
        order = TradeOrder(
            symbol="XAUUSD",
            side="BUY",
            order_type="MARKET",
            quantity=0.01,
            entry_price=4100.0,
            stop_loss=4080.0,
            take_profit=4140.0,
            leverage=20.0
        )
        res = open_position(order, current_market_price=4100.0)
        self.assertTrue(res["success"])
        pos_id = res["position"]["id"]

        # Check DB directly
        open_db = get_open_paper_trades()
        self.assertTrue(any(p["id"] == pos_id for p in open_db))

        # Check execution state
        st = get_execution_state()
        self.assertEqual(len(st["open_positions"]), 1)
        self.assertEqual(st["account"]["initial_capital"], 100.0)

    def test_3_mark_to_market_tp_trigger_and_growth(self):
        """Verify that price hitting TP realizes profit, increments equity, and moves to closed history"""
        order = TradeOrder(
            symbol="XAUUSD",
            side="BUY",
            order_type="MARKET",
            quantity=0.1,  # 10 oz
            entry_price=4100.0,
            stop_loss=4080.0,
            take_profit=4130.0,
            leverage=20.0
        )
        res = open_position(order, current_market_price=4100.0)
        self.assertTrue(res["success"])

        # Market jumps to 4140 (exceeds TP of 4130)
        closed = update_positions_mark_to_market({"XAUUSD": 4140.0})
        self.assertEqual(len(closed), 1)
        self.assertEqual(closed[0]["status"], "CLOSED_TP")

        # Verify balance has grown!
        st = get_execution_state()
        self.assertGreater(st["account"]["equity"], 100.0)
        self.assertGreater(st["account"]["realized_pnl"], 0.0)
        self.assertEqual(st["account"]["win_count"], 1)
        self.assertEqual(len(st["open_positions"]), 0)
        self.assertGreaterEqual(len(st["closed_positions"]), 1)

    def test_4_rehydration_after_restart(self):
        """Simulate server restart by calling hydrate_state_from_db() and verify state is restored"""
        # Save a custom state: $250 equity
        save_persisted_account_state({
            "initial_capital": 250.0,
            "equity": 275.50,
            "margin_used": 0.0,
            "available_margin": 275.50,
            "realized_pnl": 25.50,
            "win_count": 3,
            "loss_count": 1
        })
        
        # Simulate restart
        hydrate_state_from_db()
        st = get_execution_state()
        self.assertEqual(st["account"]["initial_capital"], 250.0)
        self.assertEqual(st["account"]["equity"], 275.50)
        self.assertEqual(st["account"]["realized_pnl"], 25.50)
        self.assertEqual(st["account"]["win_count"], 3)


if __name__ == "__main__":
    unittest.main()
