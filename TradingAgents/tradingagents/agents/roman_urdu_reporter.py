"""
Roman Urdu Reporting Agent
Formats institutional multi-agent analytical decisions into structured, accessible Roman Urdu.
Compliant with BRD Sections 27 & 28.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import json
import logging

logger = logging.getLogger(__name__)

class RomanUrduReport(BaseModel):
    asset: str
    overall_view: str = Field(description="Bullish, Bearish, or Neutral/Sideways")
    confidence_score: int = Field(description="Confidence score 0-100%")
    risk_level: str = Field(description="Low, Medium, or High")
    market_regime: str = Field(description="Market environment e.g. Strong Uptrend, Sideways Range, Volatile")
    technical_summary: str = Field(description="Technical summary in natural Roman Urdu using standard English financial terms")
    macro_summary: str = Field(description="Macro analysis summary in Roman Urdu (DXY, yields, news impact)")
    bull_case: str = Field(description="Core bullish argument in Roman Urdu")
    bear_case: str = Field(description="Core bearish risk argument in Roman Urdu")
    action: str = Field(description="BUY, SELL, or WAIT")
    entry_level: Optional[str] = Field(default=None, description="Suggested entry price or zone")
    stop_loss: Optional[str] = Field(default=None, description="Key invalidation / Stop Loss")
    take_profit: Optional[str] = Field(default=None, description="Target price / Take Profit")
    risk_reward: Optional[str] = Field(default=None, description="Risk/Reward ratio e.g. 1:2.5")
    simple_baat: str = Field(description="Simple executive summary in friendly Roman Urdu for beginners")

def generate_roman_urdu_report(
    asset_symbol: str,
    analyst_reports: Dict[str, Any],
    bull_case: str,
    bear_case: str,
    trader_decision: Dict[str, Any],
    risk_evaluation: Dict[str, Any],
    llm_client: Any = None
) -> RomanUrduReport:
    """
    Synthesize research into Roman Urdu.
    If an LLM client is available, it performs grounded structured transformation.
    Otherwise, it utilizes deterministic rule-based synthesis.
    """
    direction = trader_decision.get("direction", "WAIT").upper()
    confidence = int(trader_decision.get("confidence", 70))
    risk_lvl = risk_evaluation.get("risk_level", "Medium")
    regime = analyst_reports.get("market_regime", "Trending")

    # If LLM client is provided, prompt it for high fidelity natural Roman Urdu
    if llm_client:
        prompt = f"""
You are the Chief Investment Communicator for an institutional trading firm.
Translate and synthesize the following trading intelligence into fluent, natural Roman Urdu, strictly matching the platform requirements.

Asset: {asset_symbol}
Trader Decision: {direction}
Confidence: {confidence}%
Risk Assessment: {risk_lvl}
Technical Analysis: {analyst_reports.get('technical', 'Price action at support/resistance')}
Macro Context: {analyst_reports.get('macro', 'DXY and yield movements impacting momentum')}
Bull Argument: {bull_case}
Bear Argument: {bear_case}
Entry: {trader_decision.get('entry', 'Current Market Price')}
Stop Loss: {trader_decision.get('stop_loss', 'Invalidation Level')}
Take Profit: {trader_decision.get('take_profit', 'Target Level')}

Strict Requirements:
1. Use natural Roman Urdu (e.g. "Gold ka trend abhi positive hai aur support se bounce hui hai").
2. Keep standard trading terms in English (e.g. Bullish, Bearish, Support, Resistance, Breakout, Stop-Loss, DXY).
3. Include a very clear, friendly 'simple_baat' section summarizing the bottom-line action for beginners.
4. Output valid JSON matching the RomanUrduReport schema.
"""
        try:
            response = llm_client.predict(prompt)
            data = json.loads(response)
            return RomanUrduReport(**data)
        except Exception as e:
            logger.warning(f"LLM Roman Urdu generation failed ({e}), falling back to deterministic template.")

    # High-quality deterministic fallback
    is_gold = "XAU" in asset_symbol.upper()
    asset_name = "Gold (XAU/USD)" if is_gold else asset_symbol

    entry_str = str(trader_decision.get("entry", "Market Price"))
    sl_str = str(trader_decision.get("stop_loss", "Tight Support"))
    tp_str = str(trader_decision.get("take_profit", "Target Resistance"))

    if "BUY" in direction or "BULL" in direction:
        overall = "Bullish"
        action = "BUY setup"
        tech = f"{asset_name} ka live market rate {entry_str} hai. Trend abhi positive momentum show kar raha hai aur price key dynamic support ({sl_str}) se bounce hui hai."
        macro = "Dollar Index (DXY) aur bond yields ka setup is waqt asset ko upside support provide kar raha hai." if is_gold else "Crypto market liquidity aur broad sentiment buyers ke favor mein hai."
        simple = f"{asset_name} abhi {entry_str} par trade ho raha hai. Is ke target {tp_str} tak upar jane ke chances zyada lag rahe hain, lekin Stop-Loss ({sl_str}) ke baghair trade na lein."
    elif "SELL" in direction or "BEAR" in direction:
        overall = "Bearish"
        action = "SELL setup"
        tech = f"{asset_name} {entry_str} resistance zone par reject ho chuka hai aur momentum indicators downside pressure indicate kar rahe hain."
        macro = "DXY mein strength aur yields mein rise gold par selling pressure create kar rahi hai." if is_gold else "Bitcoin dominance aur market liquidity outflows downside risk barha rahe hain."
        simple = f"{asset_name} ({entry_str}) mein price niche girne ka khatra hai. Aggressive buying se bachein aur downside targets watch karein."
    else:
        overall = "Neutral / Sideways"
        action = "WAIT / NO TRADE"
        tech = f"{asset_name} abhi {entry_str} ke aas paas ek tight consolidation range mein trade kar raha hai, breakout confirmation ka intezar zaroori hai."
        macro = "Macro economic data mixed hai aur market clarity ka wait kar rahi hai."
        simple = f"{asset_name} ({entry_str}) par trade lena risky ho sakta hai kyunke market clear direction nahi de rahi. Sabr karein aur clean breakout ka intezar karein."

    return RomanUrduReport(
        asset=asset_symbol,
        overall_view=overall,
        confidence_score=confidence,
        risk_level=risk_lvl,
        market_regime=regime,
        technical_summary=tech,
        macro_summary=macro,
        bull_case=bull_case or f"{asset_name} support levels hold kar raha hai with positive momentum.",
        bear_case=bear_case or f"Higher timeframes par resistance aur overhead selling volume ka risk barkarar hai.",
        action=action,
        entry_level=str(trader_decision.get("entry", "Market Price")),
        stop_loss=str(trader_decision.get("stop_loss", "Tight Support")),
        take_profit=str(trader_decision.get("take_profit", "Target Resistance")),
        risk_reward=str(trader_decision.get("risk_reward", "1:2.2")),
        simple_baat=simple
    )
