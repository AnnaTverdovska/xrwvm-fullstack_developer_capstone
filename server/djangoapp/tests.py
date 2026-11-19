"""Tests for the Django views. The calls to the dealership API and the
sentiment service are replaced with fakes, so only Django is needed:

    python manage.py test djangoapp
"""
import json
from unittest.mock import patch

import requests

from django.contrib.auth.models import User
from django.test import TestCase

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import ServiceError

DEALERS = [
    {"id": 1, "full_name": "Holdlamis Car Dealership", "state": "Texas"},
    {"id": 2, "full_name": "Temp Car Dealership", "state": "Minnesota"},
]
REVIEWS = [
    {"id": 1, "name": "Berkly", "dealership": 2, "review": "Great service"},
    {"id": 2, "name": "Gwenora", "dealership": 2, "review": "Rude staff"},
]


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


class AccountTests(TestCase):
    def test_register_logs_the_user_in(self):
        response = post_json(self.client, "/djangoapp/register", {
            "userName": "anna", "password": "s3cret-pass", "firstName": "Anna",
            "lastName": "T", "email": "anna@example.com",
        })
        self.assertEqual(response.json(), {"userName": "anna", "status": "Authenticated"})
        self.assertEqual(User.objects.get(username="anna").first_name, "Anna")
        self.assertIn("_auth_user_id", self.client.session)

    def test_register_twice_is_rejected(self):
        User.objects.create_user("anna", password="x")
        response = post_json(self.client, "/djangoapp/register", {"userName": "anna", "password": "y"})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"], "Already Registered")

    def test_login_and_logout(self):
        User.objects.create_user("anna", password="s3cret-pass")
        bad = post_json(self.client, "/djangoapp/login", {"userName": "anna", "password": "wrong"})
        self.assertEqual(bad.status_code, 401)

        good = post_json(self.client, "/djangoapp/login", {"userName": "anna", "password": "s3cret-pass"})
        self.assertEqual(good.json()["status"], "Authenticated")

        self.assertEqual(self.client.get("/djangoapp/logout").json(), {"userName": ""})
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_login_with_a_broken_body(self):
        response = self.client.post("/djangoapp/login", data="nope", content_type="application/json")
        self.assertEqual(response.status_code, 400)


class CarTests(TestCase):
    def test_get_cars_loads_the_sample_cars_once(self):
        response = self.client.get("/djangoapp/get_cars")
        cars = response.json()["CarModels"]
        self.assertEqual(len(cars), 15)
        self.assertIn({"CarModel": "A4", "CarMake": "Audi"}, cars)

        initiate()  # running it again must not create duplicates
        self.assertEqual(CarModel.objects.count(), 15)
        self.assertEqual(CarMake.objects.count(), 5)


@patch("djangoapp.views.get_request")
class DealerTests(TestCase):
    def test_all_dealers(self, get_request):
        get_request.return_value = DEALERS
        response = self.client.get("/djangoapp/get_dealers")
        get_request.assert_called_once_with("/fetchDealers")
        self.assertEqual(response.json(), {"status": 200, "dealers": DEALERS})

    def test_dealers_by_state(self, get_request):
        get_request.return_value = DEALERS[:1]
        self.client.get("/djangoapp/get_dealers/Texas")
        get_request.assert_called_once_with("/fetchDealers/Texas")

    def test_all_states_option(self, get_request):
        get_request.return_value = DEALERS
        self.client.get("/djangoapp/get_dealers/All")
        get_request.assert_called_once_with("/fetchDealers")

    def test_dealer_details(self, get_request):
        get_request.return_value = DEALERS[1:]
        response = self.client.get("/djangoapp/dealer/2")
        get_request.assert_called_once_with("/fetchDealer/2")
        self.assertEqual(response.json(), {"status": 200, "dealer": DEALERS[1:]})

    def test_unknown_dealer(self, get_request):
        get_request.return_value = []
        self.assertEqual(self.client.get("/djangoapp/dealer/99").status_code, 404)

    def test_backend_down(self, get_request):
        get_request.side_effect = ServiceError("down")
        response = self.client.get("/djangoapp/get_dealers")
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["status"], 502)


@patch("djangoapp.views.analyze_review_sentiments")
@patch("djangoapp.views.get_request")
class ReviewTests(TestCase):
    def test_reviews_get_a_sentiment(self, get_request, analyze):
        get_request.return_value = [dict(review) for review in REVIEWS]
        analyze.side_effect = lambda text: "negative" if "Rude" in text else "positive"
        response = self.client.get("/djangoapp/reviews/dealer/2")
        get_request.assert_called_once_with("/fetchReviews/dealer/2")
        sentiments = [review["sentiment"] for review in response.json()["reviews"]]
        self.assertEqual(sentiments, ["positive", "negative"])


@patch("djangoapp.views.post_review")
class AddReviewTests(TestCase):
    review = {
        "name": "Anna T", "dealership": "2", "review": "Great!", "purchase": True,
        "purchase_date": "2024-02-01", "car_make": "Audi", "car_model": "A4", "car_year": "2021",
    }

    def test_must_be_logged_in(self, post_review):
        response = post_json(self.client, "/djangoapp/add_review", self.review)
        self.assertEqual(response.status_code, 401)
        post_review.assert_not_called()

    def test_posts_the_review_with_numbers_converted(self, post_review):
        self.client.force_login(User.objects.create_user("anna"))
        response = post_json(self.client, "/djangoapp/add_review", self.review)
        self.assertEqual(response.json(), {"status": 200})
        sent = post_review.call_args.args[0]
        self.assertEqual((sent["dealership"], sent["car_year"]), (2, 2021))

    def test_missing_fields(self, post_review):
        self.client.force_login(User.objects.create_user("anna"))
        response = post_json(self.client, "/djangoapp/add_review", {"review": "Great!"})
        self.assertEqual(response.status_code, 400)
        post_review.assert_not_called()


class RestApiTests(TestCase):
    @patch("djangoapp.restapis.requests.get")
    def test_sentiment_text_is_encoded_in_the_url(self, requests_get):
        from .restapis import analyze_review_sentiments

        requests_get.return_value.json.return_value = {"sentiment": "negative"}
        self.assertEqual(analyze_review_sentiments("rude / slow"), "negative")
        self.assertTrue(requests_get.call_args.args[0].endswith("/analyze/rude%20%2F%20slow"))

    @patch("djangoapp.restapis.requests.get", side_effect=requests.ConnectionError)
    def test_sentiment_falls_back_to_neutral(self, requests_get):
        from .restapis import analyze_review_sentiments

        self.assertEqual(analyze_review_sentiments("anything"), "neutral")
