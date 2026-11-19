from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CarMake(models.Model):
    """A car brand, e.g. Audi."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    country = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CarModel(models.Model):
    """A model of a car make, e.g. Audi A4. One make has many models."""

    class CarType(models.TextChoices):
        SEDAN = "SEDAN", "Sedan"
        SUV = "SUV", "SUV"
        WAGON = "WAGON", "Wagon"
        HATCHBACK = "HATCHBACK", "Hatchback"
        COUPE = "COUPE", "Coupe"

    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CarType.choices, default=CarType.SUV)
    year = models.IntegerField(
        default=2023,
        validators=[MinValueValidator(2015), MaxValueValidator(2023)],
    )

    class Meta:
        ordering = ["car_make__name", "name"]
        constraints = [
            models.UniqueConstraint(fields=["car_make", "name"], name="unique_model_per_make"),
        ]

    def __str__(self):
        return f"{self.car_make.name} {self.name}"
