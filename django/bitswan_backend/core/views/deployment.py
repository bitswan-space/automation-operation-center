import os

from django.http import JsonResponse


def current_deployed_version(request):
    versions = {}
    if os.getenv("AOC_VERSION"):
        versions["aoc"] = os.getenv("AOC_VERSION")

    if os.getenv("BITSWAN_BACKEND_VERSION"):
        versions["bitswan-backend"] = os.getenv("BITSWAN_BACKEND_VERSION")

    if os.getenv("PROFILE_MANAGER_VERSION"):
        versions["profile-manager"] = os.getenv("PROFILE_MANAGER_VERSION")

    return JsonResponse(versions)
