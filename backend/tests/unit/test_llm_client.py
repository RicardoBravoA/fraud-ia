"""Unit tests for LLM client."""

import pytest
import httpx
from pytest_mock import MockerFixture

from app.core.config import get_settings
from app.infrastructure.llm.client import LlmClient, LlmClientError


@pytest.mark.asyncio
async def test_mock_pro_fraud_response():
    client = LlmClient()
    text = await client.complete("Role: Pro-Fraud.\nTransaction: T-1001")
    assert "fraud" in text.lower()


@pytest.mark.asyncio
async def test_mock_customer_explanation():
    client = LlmClient()
    text = await client.complete("Task: customer explanation\nFinal decision: APPROVE")
    assert "transacción" in text.lower()


class _FakeHttpClient:
    def __init__(
        self,
        response: httpx.Response | None = None,
        errors: list[Exception] | None = None,
    ):
        self._response = response
        self._errors = list(errors or [])
        self.post_calls = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, url, json=None):
        self.post_calls += 1
        if self._errors:
            raise self._errors.pop(0)
        return self._response


@pytest.mark.asyncio
async def test_ollama_success(monkeypatch, mocker: MockerFixture):
    monkeypatch.setenv("LLM_MOCK", "false")
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    get_settings.cache_clear()

    response = httpx.Response(
        200,
        json={"message": {"content": "Ollama says hello"}},
        request=httpx.Request("POST", "http://localhost:11434/api/chat"),
    )
    mocker.patch("httpx.AsyncClient", return_value=_FakeHttpClient(response=response))

    text = await LlmClient().complete("Test prompt", system="Be concise")
    assert text == "Ollama says hello"
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_ollama_connection_error(monkeypatch, mocker: MockerFixture):
    monkeypatch.setenv("LLM_MOCK", "false")
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    get_settings.cache_clear()

    mocker.patch(
        "httpx.AsyncClient",
        return_value=_FakeHttpClient(
            errors=[httpx.ConnectError("connection refused")],
        ),
    )

    with pytest.raises(LlmClientError, match="Cannot reach Ollama"):
        await LlmClient().complete("Test prompt")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_ollama_missing_model(monkeypatch, mocker: MockerFixture):
    monkeypatch.setenv("LLM_MOCK", "false")
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    get_settings.cache_clear()

    request = httpx.Request("POST", "http://localhost:11434/api/chat")
    response = httpx.Response(
        404,
        text='{"error":"model llama3.2 not found"}',
        request=request,
    )
    mocker.patch(
        "httpx.AsyncClient",
        return_value=_FakeHttpClient(
            errors=[
                httpx.HTTPStatusError("404", request=request, response=response),
            ],
        ),
    )

    with pytest.raises(LlmClientError, match="not found"):
        await LlmClient().complete("Test prompt")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_ollama_retries_on_timeout(monkeypatch, mocker: MockerFixture):
    monkeypatch.setenv("LLM_MOCK", "false")
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("LLM_MAX_RETRIES", "2")
    get_settings.cache_clear()

    response = httpx.Response(
        200,
        json={"message": {"content": "Recovered after retry"}},
        request=httpx.Request("POST", "http://localhost:11434/api/chat"),
    )
    fake = _FakeHttpClient(
        response=response,
        errors=[
            httpx.ReadTimeout("slow"),
            httpx.ReadTimeout("slow"),
        ],
    )
    mocker.patch("httpx.AsyncClient", return_value=fake)
    mocker.patch("asyncio.sleep", return_value=None)

    text = await LlmClient().complete("Test prompt")
    assert text == "Recovered after retry"
    assert fake.post_calls == 3
    get_settings.cache_clear()
