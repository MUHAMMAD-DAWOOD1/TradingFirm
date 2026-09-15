import logging
import re
import time
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI

from .base_client import BaseLLMClient, normalize_content
from .validators import validate_model

logger = logging.getLogger(__name__)


def _extract_retry_delay(error_str: str) -> float:
    match = re.search(r"Please retry in ([\d\.]+)s", error_str, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1)) + 1.0
        except ValueError:
            pass
    return 12.0


class NormalizedChatGoogleGenerativeAI(ChatGoogleGenerativeAI):
    """ChatGoogleGenerativeAI with normalized content output, rate-limit backoff, and smart fallback.

    Gemini 3 models return content as list of typed blocks.
    This normalizes to string for consistent downstream handling, adds auto-retry on 429/503,
    and falls back to resilient Flash models if daily quota (limit: 0 / PerDay) is exhausted.
    """

    def _fallback_if_daily_limit(self, exc_str: str, current_attempt: int) -> bool:
        is_server_busy = "503" in exc_str or "UNAVAILABLE" in exc_str
        is_daily_limit = "PerDay" in exc_str or "limit: 0" in exc_str or is_server_busy or current_attempt >= 2
        if not is_daily_limit:
            return False

        fallbacks = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
        for fb in fallbacks:
            if fb != self.model:
                reason = "server busy (503)" if is_server_busy else "quota limit"
                print(
                    f"\n[Gemini Fast-Fallback] Model '{self.model}' {reason}. "
                    f"Fast-switching to high-speed model '{fb}'..."
                )
                logger.warning("Model '%s' %s. Fast-falling back to '%s'", self.model, reason, fb)
                try:
                    object.__setattr__(self, "model", fb)
                    self.__dict__["thinking_level"] = None
                except Exception:
                    pass
                return True
        return False

    def invoke(self, input, config=None, **kwargs):
        max_attempts = 5
        base_delay = 5.0
        for attempt in range(1, max_attempts + 1):
            try:
                res = super().invoke(input, config, **kwargs)
                return normalize_content(res)
            except Exception as exc:
                exc_str = str(exc)
                is_rate_limit = "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str
                is_unavailable = "503" in exc_str or "UNAVAILABLE" in exc_str

                if is_rate_limit or is_unavailable:
                    if self._fallback_if_daily_limit(exc_str, attempt):
                        time.sleep(2.0)
                        continue

                    if attempt < max_attempts:
                        delay = _extract_retry_delay(exc_str) if is_rate_limit else (base_delay * (2 ** (attempt - 1)))
                        logger.warning(
                            "Google Gemini API transient error (attempt %d/%d): %s. Retrying in %.1fs...",
                            attempt, max_attempts, exc, delay
                        )
                        print(
                            f"\n[Gemini API Backoff] Rate-Limit/Server Busy ({'429' if is_rate_limit else '503'}). "
                            f"Auto-waiting {delay:.1f}s before retry (attempt {attempt}/{max_attempts})..."
                        )
                        time.sleep(delay)
                        continue
                raise

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        max_attempts = 5
        base_delay = 5.0
        for attempt in range(1, max_attempts + 1):
            try:
                return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)
            except Exception as exc:
                exc_str = str(exc)
                is_rate_limit = "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str
                is_unavailable = "503" in exc_str or "UNAVAILABLE" in exc_str

                if is_rate_limit or is_unavailable:
                    if self._fallback_if_daily_limit(exc_str, attempt):
                        time.sleep(2.0)
                        continue

                    if attempt < max_attempts:
                        delay = _extract_retry_delay(exc_str) if is_rate_limit else (base_delay * (2 ** (attempt - 1)))
                        logger.warning(
                            "Google Gemini API transient error (attempt %d/%d): %s. Retrying in %.1fs...",
                            attempt, max_attempts, exc, delay
                        )
                        print(
                            f"\n[Gemini API Backoff] Rate-Limit/Server Busy ({'429' if is_rate_limit else '503'}). "
                            f"Auto-waiting {delay:.1f}s before retry (attempt {attempt}/{max_attempts})..."
                        )
                        time.sleep(delay)
                        continue
                raise


class GoogleClient(BaseLLMClient):
    """Client for Google Gemini models."""

    def __init__(self, model: str, base_url: str | None = None, **kwargs):
        super().__init__(model, base_url, **kwargs)

    def get_llm(self) -> Any:
        """Return configured ChatGoogleGenerativeAI instance."""
        self.warn_if_unknown_model()
        llm_kwargs = {"model": self.model, "max_retries": 5}

        if self.base_url:
            llm_kwargs["base_url"] = self.base_url

        for key in ("timeout", "max_retries", "temperature", "callbacks", "http_client", "http_async_client"):
            if key in self.kwargs:
                llm_kwargs[key] = self.kwargs[key]

        # Unified api_key maps to provider-specific google_api_key
        google_api_key = self.kwargs.get("api_key") or self.kwargs.get("google_api_key")
        if google_api_key:
            llm_kwargs["google_api_key"] = google_api_key

        # Gemini 3.x takes the string ``thinking_level`` (the integer
        # ``thinking_budget`` was for the now-retired 2.5 line). Pro accepts
        # low/high; Flash also accepts minimal/medium — so map an unsupported
        # "minimal" on Pro to the nearest level it does accept.
        thinking_level = self.kwargs.get("thinking_level")
        if thinking_level:
            if "pro" in self.model.lower() and thinking_level == "minimal":
                thinking_level = "low"
            llm_kwargs["thinking_level"] = thinking_level

        return NormalizedChatGoogleGenerativeAI(**llm_kwargs)

    def validate_model(self) -> bool:
        """Validate model for Google."""
        return validate_model("google", self.model)

