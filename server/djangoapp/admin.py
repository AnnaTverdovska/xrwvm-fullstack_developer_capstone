# Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
from django.contrib import admin

from .models import CarMake, CarModel


class CarModelInline(admin.TabularInline):
    """Edit a make's models on the same page as the make."""
    model = CarModel
    extra = 1


@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ("name", "car_make", "type", "year")
    list_filter = ("car_make", "type", "year")
    search_fields = ("name", "car_make__name")


@admin.register(CarMake)
class CarMakeAdmin(admin.ModelAdmin):
    inlines = [CarModelInline]
    list_display = ("name", "country", "description")
    search_fields = ("name",)
