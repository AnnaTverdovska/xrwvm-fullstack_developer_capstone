# Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
from .models import CarMake, CarModel

# Sample car makes and models, loaded the first time the car list is requested
CAR_MAKES = [
    {"name": "NISSAN", "description": "Great cars. Japanese technology", "country": "Japan"},
    {"name": "Mercedes", "description": "Great cars. German technology", "country": "Germany"},
    {"name": "Audi", "description": "Great cars. German technology", "country": "Germany"},
    {"name": "Kia", "description": "Great cars. Korean technology", "country": "South Korea"},
    {"name": "Toyota", "description": "Great cars. Japanese technology", "country": "Japan"},
]

CAR_MODELS = [
    ("NISSAN", "Pathfinder", "SUV", 2023),
    ("NISSAN", "Qashqai", "SUV", 2023),
    ("NISSAN", "XTRAIL", "SUV", 2023),
    ("Mercedes", "A-Class", "SUV", 2023),
    ("Mercedes", "C-Class", "SUV", 2023),
    ("Mercedes", "E-Class", "SUV", 2023),
    ("Audi", "A4", "SUV", 2023),
    ("Audi", "A5", "SUV", 2023),
    ("Audi", "A6", "SUV", 2023),
    ("Kia", "Sorrento", "SUV", 2023),
    ("Kia", "Carnival", "SUV", 2023),
    ("Kia", "Cerato", "SEDAN", 2023),
    ("Toyota", "Corolla", "SEDAN", 2023),
    ("Toyota", "Camry", "SEDAN", 2023),
    ("Toyota", "Kluger", "SUV", 2023),
]


def initiate():
    """Create the sample car makes and models. Safe to run more than once."""
    makes = {}
    for data in CAR_MAKES:
        make, _ = CarMake.objects.get_or_create(
            name=data["name"],
            defaults={"description": data["description"], "country": data["country"]},
        )
        makes[make.name] = make

    for make_name, model_name, car_type, year in CAR_MODELS:
        CarModel.objects.get_or_create(
            car_make=makes[make_name],
            name=model_name,
            defaults={"type": car_type, "year": year},
        )
