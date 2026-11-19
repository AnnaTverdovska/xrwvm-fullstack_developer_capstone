"""Tests for the sentiment service. Run with: pytest"""
import pytest

from app import app, classify


@pytest.fixture
def client():
    return app.test_client()


@pytest.mark.parametrize("text, expected", [
    ("Fantastic services", "positive"),
    ("The staff were friendly and the price was fair, I would buy here again", "positive"),
    ("The car broke down after two days and nobody helped me, terrible experience", "negative"),
    ("It is a car dealership", "neutral"),
])
def test_classify(text, expected):
    assert classify(text) == expected


def test_analyze_endpoint_returns_json(client):
    response = client.get("/analyze/Fantastic services")
    assert response.status_code == 200
    assert response.is_json
    assert response.get_json() == {"sentiment": "positive"}


def test_text_with_a_slash(client):
    # Before the fix, a "/" in the text sent the request to a missing page (404)
    response = client.get("/analyze/rude staff / terrible service")
    assert response.status_code == 200
    assert response.get_json() == {"sentiment": "negative"}


def test_home(client):
    assert b"Sentiment Analyzer" in client.get("/").data
