"""Verification test script for Signal Evaluator, Scorecard, and Memory Resolver."""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
os.environ.setdefault("OPENAI_API_KEY", "sk-dummy-testing-key-12345")

from tradingagents.agents.schemas import IncomingSignal, SignalVerdict, EvidenceScorecard
from tradingagents.graph.trading_graph import TradingAgentsGraph


def test_schemas():
    print("Testing Pydantic Schemas...")
    sig = IncomingSignal(
        ticker="XAUUSD",
        direction="Buy",
        entry_price=2380.0,
        target_price=2410.0,
        stop_loss=2360.0,
        source="VIP Telegram Mentor",
        reasoning="Bullish breakout after Fed comments",
    )
    assert sig.ticker == "XAUUSD"
    assert sig.direction == "Buy"

    verdict = SignalVerdict(
        verdict="APPROVED",
        confluence_score=87.5,
        alignment_summary="Technical RSI and Fed macro both support long position.",
        position_sizing_multiplier=1.0,
        warning_notes="Watch DXY resistance at 105.2.",
    )
    assert verdict.confluence_score == 87.5

    scorecard = EvidenceScorecard(
        technical_strength=85,
        sentiment_strength=70,
        macro_alignment=90,
        risk_level=35,
        overall_confidence=82,
    )
    assert scorecard.overall_confidence == 82
    print("[OK] All Schemas Validated Successfully!")


def test_graph_initialization():
    print("Testing Graph Initialization with 3-Tier Config...")
    ta = TradingAgentsGraph(debug=False)
    assert hasattr(ta, "cheap_thinking_llm")
    assert hasattr(ta, "quick_thinking_llm")
    assert hasattr(ta, "deep_thinking_llm")
    print("[OK] 3-Tier LLMs Initialized Successfully!")


if __name__ == "__main__":
    test_schemas()
    test_graph_initialization()
    print("\nALL VERIFICATION TESTS PASSED!")
