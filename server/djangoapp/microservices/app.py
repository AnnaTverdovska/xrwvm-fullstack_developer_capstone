"""Sentiment analyzer microservice.

Rates a review text as positive, neutral or negative with NLTK's VADER
analyzer. The VADER word list ships with this service in
sentiment/vader_lexicon.zip, so no download is needed.

Run locally:  python app.py   (then open http://localhost:5050/analyze/Great%20service)
"""
import os

import nltk
from flask import Flask, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer

# Let NLTK find sentiment/vader_lexicon.zip next to this file
nltk.data.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask("Sentiment Analyzer")
sia = SentimentIntensityAnalyzer()

# VADER's recommended thresholds for its compound score (-1 to 1)
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def classify(text):
    """Return 'positive', 'neutral' or 'negative' for a piece of text."""
    compound = sia.polarity_scores(text)["compound"]
    if compound >= POSITIVE_THRESHOLD:
        return "positive"
    if compound <= NEGATIVE_THRESHOLD:
        return "negative"
    return "neutral"


@app.get("/")
def home():
    return "Welcome to the Sentiment Analyzer. Use /analyze/text to get the sentiment"


# <path:...> also accepts texts that contain a slash, such as "fast/friendly"
@app.get("/analyze/<path:input_txt>")
def analyze_sentiment(input_txt):
    return jsonify({"sentiment": classify(input_txt)})


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5050)), debug=True)
