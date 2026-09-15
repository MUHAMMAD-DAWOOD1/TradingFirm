"""Signal Evaluator: evaluates external signals against AI multi-layer analysis."""

from __future__ import annotations

import functools
import json

from langchain_core.messages import AIMessage

from tradingagents.agents.schemas import SignalVerdict, render_signal_verdict
from tradingagents.agents.utils.agent_utils import (
    get_instrument_context_from_state,
    get_language_instruction,
)
from tradingagents.agents.utils.structured import (
    NO_EXTERNAL_TOOLS,
    bind_structured,
    invoke_structured_or_freetext,
)


def create_signal_evaluator(llm):
    structured_llm = bind_structured(llm, SignalVerdict, "Signal Evaluator")

    def signal_evaluator_node(state, name):
        incoming_signal = state.get("incoming_signal")
        if not incoming_signal:
            return {"signal_verdict": None, "sender": name}

        company_name = state["company_of_interest"]
        instrument_context = get_instrument_context_from_state(state)
        investment_plan = state.get("investment_plan", "")
        market_report = state.get("market_report", "")
        sentiment_report = state.get("sentiment_report", "")
        news_report = state.get("news_report", "")
        fundamentals_report = state.get("fundamentals_report", "")

        signal_str = json.dumps(incoming_signal, indent=2)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert Signal Evaluator and Risk Confluence Auditor in a quantitative trading firm. "
                    "Your job is to independently evaluate an incoming third-party trading signal against the AI team's "
                    "multi-layer research (technical, fundamental, sentiment, macro). "
                    "Determine whether to APPROVE, PARTIALLY APPROVE, or REJECT the signal. "
                    "Assign a numeric Confluence Score (0-100%) and a position sizing multiplier (0.0 to 1.5x). "
                    "Provide specific warning notes if there is a conflict. "
                    + NO_EXTERNAL_TOOLS
                    + get_language_instruction()
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Evaluate this incoming trading signal for {company_name}.\n"
                    f"{instrument_context}\n\n"
                    f"**INCOMING THIRD-PARTY SIGNAL:**\n{signal_str}\n\n"
                    f"**AI MULTI-LAYER RESEARCH SUMMARY:**\n"
                    f"- Technical Market Analysis: {market_report[:600]}\n"
                    f"- Sentiment Analysis: {sentiment_report[:400]}\n"
                    f"- News & Macro Analysis: {news_report[:600]}\n"
                    f"- Fundamentals: {fundamentals_report[:400]}\n"
                    f"- Research Manager Plan: {investment_plan}\n\n"
                    f"Compare the signal direction, entry target, TP, and SL against these reports. "
                    f"Output a structured SignalVerdict."
                ),
            },
        ]

        verdict_rendered = invoke_structured_or_freetext(
            structured_llm,
            llm,
            messages,
            render_signal_verdict,
            "Signal Evaluator",
        )

        return {
            "messages": [AIMessage(content=verdict_rendered)],
            "signal_verdict": verdict_rendered,
            "sender": name,
        }

    return functools.partial(signal_evaluator_node, name="Signal Evaluator")
