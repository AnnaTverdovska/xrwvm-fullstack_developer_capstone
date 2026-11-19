# Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
"""JSON views used by the React frontend. Each response carries a "status"
field, because the frontend checks that instead of the HTTP status code."""
import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import CarModel
from .populate import initiate
from .restapis import ServiceError, analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


def read_json(request):
    """Return the request body as a dict, or None if it isn't a JSON object."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def error(status, message):
    return JsonResponse({"status": status, "message": message}, status=status)


# Sign in. The React app posts {"userName": ..., "password": ...}
@csrf_exempt
@require_POST
def login_user(request):
    data = read_json(request)
    if not data or not data.get("userName") or not data.get("password"):
        return error(400, "Username and password are required")

    username = data["userName"]
    user = authenticate(username=username, password=data["password"])
    if user is None:
        return JsonResponse({"userName": username, "status": "Unauthenticated"}, status=401)
    login(request, user)
    return JsonResponse({"userName": username, "status": "Authenticated"})


# Sign out. The frontend only needs a JSON answer back.
def logout_request(request):
    logout(request)
    return JsonResponse({"userName": ""})


# Sign up with {"userName", "password", "firstName", "lastName", "email"}
@csrf_exempt
@require_POST
def registration(request):
    data = read_json(request)
    if not data or not data.get("userName") or not data.get("password"):
        return error(400, "Username and password are required")

    username = data["userName"]
    if User.objects.filter(username=username).exists():
        return JsonResponse({"userName": username, "error": "Already Registered"}, status=409)

    user = User.objects.create_user(
        username=username,
        password=data["password"],
        first_name=data.get("firstName", ""),
        last_name=data.get("lastName", ""),
        email=data.get("email", ""),
    )
    login(request, user)
    return JsonResponse({"userName": username, "status": "Authenticated"})


# All car models with their make, for the "post a review" form
@require_GET
def get_cars(request):
    if not CarModel.objects.exists():
        initiate()
    car_models = CarModel.objects.select_related("car_make")
    cars = [{"CarModel": car.name, "CarMake": car.car_make.name} for car in car_models]
    return JsonResponse({"CarModels": cars})


# All dealers, or the dealers in one state: /get_dealers or /get_dealers/Kansas
@require_GET
def get_dealerships(request, state="All"):
    endpoint = "/fetchDealers" if state == "All" else f"/fetchDealers/{state}"
    try:
        dealerships = get_request(endpoint)
    except ServiceError:
        return error(502, "The dealer list is not available right now")
    return JsonResponse({"status": 200, "dealers": dealerships})


# One dealer, as a list with one entry (that's what the frontend expects)
@require_GET
def get_dealer_details(request, dealer_id):
    try:
        dealership = get_request(f"/fetchDealer/{dealer_id}")
    except ServiceError:
        return error(502, "The dealer is not available right now")
    if not dealership:
        return error(404, "Dealer not found")
    return JsonResponse({"status": 200, "dealer": dealership})


# A dealer's reviews, each with a sentiment: positive, neutral or negative
@require_GET
def get_dealer_reviews(request, dealer_id):
    try:
        reviews = get_request(f"/fetchReviews/dealer/{dealer_id}")
    except ServiceError:
        return error(502, "The reviews are not available right now")
    for review in reviews:
        review["sentiment"] = analyze_review_sentiments(review.get("review", ""))
    return JsonResponse({"status": 200, "reviews": reviews})


# Post a review. Only signed-in users can do this.
@csrf_exempt
@require_POST
def add_review(request):
    if not request.user.is_authenticated:
        return error(401, "Unauthorized")

    data = read_json(request)
    required = ["dealership", "review", "purchase_date", "car_make", "car_model", "car_year"]
    if not data or any(not data.get(field) for field in required):
        return error(400, "All details are mandatory")
    try:
        data["dealership"] = int(data["dealership"])
        data["car_year"] = int(data["car_year"])
    except (TypeError, ValueError):
        return error(400, "Dealer and car year must be numbers")

    data.setdefault("purchase", True)
    data["name"] = data.get("name") or request.user.get_full_name() or request.user.username
    try:
        post_review(data)
    except ServiceError:
        return error(502, "The review could not be saved right now")
    return JsonResponse({"status": 200})
