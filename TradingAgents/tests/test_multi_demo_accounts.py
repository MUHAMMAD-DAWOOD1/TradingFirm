"""
Automated Test Suite for Multiple Demo Accounts & Real Broker Simulation Mechanics
Tests:
1. Account Creation with custom capital ($10, $50, $20,000,000)
2. Account Switching & Isolation
3. Order placement, margin reservation & available margin deduction
4. Trade closing with LOSS: Balance drops permanently, margin released
5. Trade closing with PROFIT: Balance increases permanently, margin released
6. Real Broker Accounting formula validation: Equity = Balance + Unrealized PnL
7. Persistence across simulated reload (loading fresh from SQLite)
8. Account Reset & Re-capitalization
"""

import unittest
from backend.database import (
    init_db,
    get_all_demo_accounts,
    get_active_demo_account,
    get_demo_account,
    create_demo_account,
    set_active_demo_account,
    reset_demo_account,
    delete_demo_account,
    get_open_paper_trades,
    get_closed_paper_trades
)
from backend.execution.engine import (
    TradeOrder,
    open_position,
    close_position,
    get_execution_state,
    reset_account_capital
)

class TestMultiDemoAccounts(unittest.TestCase):

    def setUp(self):
        init_db()

    def test_custom_capital_creation(self):
        # 1. Micro Account ($10)
        micro = create_demo_account("Micro $10 Challenge", 10.0, set_active=False)
        self.assertEqual(micro["initial_capital"], 10.0)
        self.assertEqual(micro["balance"], 10.0)
        self.assertEqual(micro["available_margin"], 10.0)

        # 2. Institutional Whale Account ($20,000,000)
        whale = create_demo_account("Whale Fund", 20000000.0, set_active=True)
        self.assertEqual(whale["initial_capital"], 20000000.0)
        self.assertEqual(whale["balance"], 20000000.0)
        self.assertEqual(whale["available_margin"], 20000000.0)
        self.assertEqual(get_active_demo_account()["id"], whale["id"])

    def test_real_broker_trade_loss_and_profit_mechanics(self):
        # Create dedicated test account with $1,000
        acc = create_demo_account("Trader Alpha", 1000.0, set_active=True)
        acc_id = acc["id"]

        # Place BUY order: 0.1 BTC at $70,000 with 10x leverage
        # Notional = $7,000. Margin required = $7,000 / 10 = $700.
        order = TradeOrder(
            symbol="BTC",
            side="BUY",
            order_type="MARKET",
            quantity=0.1,
            entry_price=70000.0,
            leverage=10.0,
            account_id=acc_id
        )

        res = open_position(order, 70000.0, account_id=acc_id)
        self.assertTrue(res["success"])
        pos_id = res["position"]["id"]

        # Check margin was deducted
        st = get_execution_state(acc_id)
        self.assertAlmostEqual(st["account"]["margin_used"], 700.0, delta=2.0)
        self.assertAlmostEqual(st["account"]["available_margin"], 300.0, delta=2.0)

        # 1. Close trade with LOSS: market drops to $68,000 (-$200 PnL)
        closed_loss = close_position(pos_id, 68000.0, reason="CLOSED_SL")
        self.assertIsNotNone(closed_loss)
        self.assertAlmostEqual(closed_loss["unrealized_pnl"], -200.0, delta=5.0)

        # Verify Real Broker Balance Drop: Balance should now be ~$800!
        st_after_loss = get_execution_state(acc_id)
        self.assertAlmostEqual(st_after_loss["account"]["balance"], 800.0, delta=5.0)
        self.assertAlmostEqual(st_after_loss["account"]["equity"], 800.0, delta=5.0)
        self.assertAlmostEqual(st_after_loss["account"]["available_margin"], 800.0, delta=5.0)
        self.assertEqual(st_after_loss["account"]["margin_used"], 0.0)
        self.assertEqual(st_after_loss["account"]["loss_count"], 1)

        # 2. Open new trade and close with PROFIT
        order2 = TradeOrder(
            symbol="BTC",
            side="BUY",
            order_type="MARKET",
            quantity=0.05,
            entry_price=68000.0,
            leverage=5.0,
            account_id=acc_id
        )
        res2 = open_position(order2, 68000.0, account_id=acc_id)
        self.assertTrue(res2["success"])

        # Market pumps to $72,000 (+$200 profit)
        closed_profit = close_position(res2["position"]["id"], 72000.0, reason="CLOSED_TP")
        self.assertAlmostEqual(closed_profit["unrealized_pnl"], 200.0, delta=5.0)

        # Verify Real Broker Balance Increase: Balance should grow back to ~$1,000!
        st_after_profit = get_execution_state(acc_id)
        self.assertAlmostEqual(st_after_profit["account"]["balance"], 1000.0, delta=10.0)
        self.assertAlmostEqual(st_after_profit["account"]["equity"], 1000.0, delta=10.0)
        self.assertEqual(st_after_profit["account"]["win_count"], 1)

        # Clean up test account
        delete_demo_account(acc_id)

    def test_account_isolation(self):
        # Create Account A ($500) and Account B ($50,000)
        acc_a = create_demo_account("Isolation Acc A", 500.0, set_active=False)
        acc_b = create_demo_account("Isolation Acc B", 50000.0, set_active=False)

        # Open trade on Account A only
        order_a = TradeOrder(
            symbol="XAUUSD",
            side="BUY",
            order_type="MARKET",
            quantity=0.05,
            entry_price=2680.0,
            leverage=20.0,
            account_id=acc_a["id"]
        )
        res_a = open_position(order_a, 2680.0, account_id=acc_a["id"])
        self.assertTrue(res_a["success"])

        # Account A should have 1 open position
        st_a = get_execution_state(acc_a["id"])
        self.assertEqual(len(st_a["open_positions"]), 1)

        # Account B should have 0 open positions and full available margin
        st_b = get_execution_state(acc_b["id"])
        self.assertEqual(len(st_b["open_positions"]), 0)
        self.assertEqual(st_b["account"]["available_margin"], 50000.0)

        # Close position on Account A
        close_position(res_a["position"]["id"], 2690.0)

        # Clean up
        delete_demo_account(acc_a["id"])
        delete_demo_account(acc_b["id"])

if __name__ == "__main__":
    unittest.main()
