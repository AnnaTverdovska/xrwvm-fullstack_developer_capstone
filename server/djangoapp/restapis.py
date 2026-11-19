# Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
"""Calls from Django to the two other services: the dealership API
(Express + MongoDB, part 1) and the sentiment analyzer (Flask, part 2)."""
import logging
import os
from urllib.parse import quote

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

backend_url = os.getenv("backend_url", default="http://localhost:3030").rstrip("/")
sentiment_analyzer_url = os.getenv(
    "sentiment_analyzer_url", default="http://localhost:5050/").rstrip("/")

TIMEOUT = 10  # seconds


class ServiceError(Exception):
    """Raised when one of the other services can't be reached or fails."""


def get_request(endpoint, **kwargs):
    """GET backend_url + endpoint; keyword arguments become query parameters."""
    url = backend_url + endpoint
    try:
        response = requests.get(url, params=kwargs or None, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        logger.error("GET %s failed: %s", url, error)
        raise ServiceError(f"Could not load {endpoint}") from error


def analyze_review_sentiments(text):
    """Return 'positive', 'neutral' or 'negative'. Falls back to 'neutral'
    if the sentiment service is not available, so reviews still show."""
    # quote() encodes spaces, slashes and other characters for the URL
    url = f"{sentiment_analyzer_url}/analyze/{quote(text, safe='')}"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json().get("sentiment", "neutral")
    except (requests.RequestException, ValueError) as error:
        logger.warning("Sentiment analysis failed, using neutral: %s", error)
        return "neutral"


def post_review(data_dict):
    """Send a new review to the dealership API and return the saved review."""
    url = backend_url + "/insert_review"
    try:
        response = requests.post(url, json=data_dict, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        logger.error("POST %s failed: %s", url, error)
        raise ServiceError("Could not save the review") from error
