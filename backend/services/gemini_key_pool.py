"""
Nexus Capital — Institutional Multi-Key Gemini Pool & Load Balancer
Manages 3 dedicated API keys across 3 distinct projects for:
- Role 'MACRO': ForexFactory & News Intelligence
- Role 'AGENTS': Committee Reasoning, Bull vs Bear Debate, Roman Urdu Risk Officer
- Role 'SIGNALS': External Signal Auditing & Trap Detection NLP
Features seamless Automatic Failover: if one key hits a rate limit, the request is instantly routed to another key.
"""

import os
import time
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment is loaded from root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("GeminiKeyPool")

PREFERRED_MODEL = "gemini-3.6-flash"

class KeySlot:
    def __init__(self, key: str, role: str, label: str):
        self.key = key
        self.role = role
        self.label = label
        self.calls_count = 0
        self.errors_count = 0
        self.last_used = 0.0
        self.is_rate_limited = False
        self.cooldown_until = 0.0

    def is_available(self) -> bool:
        if self.is_rate_limited and time.time() < self.cooldown_until:
            return False
        self.is_rate_limited = False
        return True

    def mark_rate_limited(self, duration_sec: float = 60.0):
        self.is_rate_limited = True
        self.cooldown_until = time.time() + duration_sec
        self.errors_count += 1

    def mark_success(self):
        self.calls_count += 1
        self.last_used = time.time()
        self.is_rate_limited = False

class GeminiKeyPool:
    def __init__(self):
        self.slots: List[KeySlot] = []
        self._init_pool()

    def _init_pool(self):
        key_macro = os.environ.get("GEMINI_API_KEY_MACRO")
        key_agents = os.environ.get("GEMINI_API_KEY_AGENTS")
        key_signals = os.environ.get("GEMINI_API_KEY_SIGNALS")
        default_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

        if key_macro:
            self.slots.append(KeySlot(key_macro, "MACRO", "Project 1 (Macro & News)"))
        if key_agents:
            self.slots.append(KeySlot(key_agents, "AGENTS", "Project 2 (8-Agent Swarm)"))
        if key_signals:
            self.slots.append(KeySlot(key_signals, "SIGNALS", "Project 3 (Signals & Trap)"))
        if default_key and not any(s.key == default_key for s in self.slots):
            self.slots.append(KeySlot(default_key, "GENERAL", "Project 0 (Master Failover)"))

    def get_slot_for_role(self, preferred_role: str = "AGENTS") -> Optional[KeySlot]:
        now = time.time()
        # 1. Try slot matching preferred role that is not in cooldown
        for s in self.slots:
            if s.role.upper() == preferred_role.upper() and s.is_available():
                return s

        # 2. Failover to any available slot in the pool
        available = [s for s in self.slots if s.is_available()]
        if available:
            # Pick least recently used slot for load distribution
            available.sort(key=lambda s: s.last_used)
            return available[0]

        # 3. If all slots are in cooldown, pick the one with earliest cooldown expiry
        if self.slots:
            self.slots.sort(key=lambda s: s.cooldown_until)
            return self.slots[0]

        return None

    def execute_prompt(
        self,
        prompt: str,
        role: str = "AGENTS",
        model: str = PREFERRED_MODEL,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Executes a prompt across the key pool with automated failover retry."""
        from google import genai

        max_attempts = len(self.slots) if self.slots else 1
        tried_keys = []

        for attempt in range(max_attempts):
            slot = self.get_slot_for_role(role)
            if not slot or slot.key in tried_keys:
                # Find untried slot
                untried = [s for s in self.slots if s.key not in tried_keys]
                if untried:
                    slot = untried[0]
                else:
                    break

            tried_keys.append(slot.key)
            target_model = model
            model_success = False
            last_err = ""

            try:
                client = genai.Client(api_key=slot.key)
                full_contents = prompt
                if system_instruction:
                    full_contents = f"{system_instruction}\n\n{prompt}"

                response = client.models.generate_content(
                    model=target_model,
                    contents=full_contents
                )

                slot.mark_success()
                return {
                    "success": True,
                    "text": response.text.strip(),
                    "model_used": target_model,
                    "key_role": slot.role,
                    "key_label": slot.label,
                    "attempt": attempt + 1
                }

            except Exception as e:
                err_msg = str(e)
                logger.warning(f"Gemini Key [{slot.label}] failed on attempt {attempt+1}: {err_msg}")
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                    slot.mark_rate_limited(duration_sec=60.0)
                else:
                    slot.errors_count += 1
                # Continue loop to failover to next key in pool

        return {
            "success": False,
            "error": "All API keys in pool exhausted or unavailable.",
            "attempts": len(tried_keys)
        }

    def get_pool_status(self) -> Dict[str, Any]:
        return {
            "total_keys": len(self.slots),
            "preferred_model": PREFERRED_MODEL,
            "keys": [
                {
                    "label": s.label,
                    "role": s.role,
                    "calls_count": s.calls_count,
                    "errors_count": s.errors_count,
                    "is_rate_limited": s.is_rate_limited,
                    "key_prefix": s.key[:8] + "..." if len(s.key) > 8 else "N/A"
                }
                for s in self.slots
            ]
        }

# Global Singleton Instance
KEY_POOL = GeminiKeyPool()

def get_gemini_key_pool() -> GeminiKeyPool:
    return KEY_POOL

if __name__ == "__main__":
    status = KEY_POOL.get_pool_status()
    print("Gemini Pool Status:", status)
    test_res = KEY_POOL.execute_prompt("Say 'Nexus Capital AI Active'", role="AGENTS")
    print("Test Call Result:", test_res)
