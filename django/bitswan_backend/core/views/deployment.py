import os

from django.http import JsonResponse


def current_deployed_version(request):
    versions = {}
    if os.getenv("AOC_IMAGE"):
        versions["aoc"] = os.getenv("AOC_IMAGE")

    if os.getenv("BITSWAN_BACKEND_IMAGE"):
        versions["bitswan-backend"] = os.getenv("BITSWAN_BACKEND_IMAGE")

    if os.getenv("KEYCLOAK_IMAGE"):
        versions["keycloak"] = os.getenv("KEYCLOAK_IMAGE")

    return JsonResponse(versions)
