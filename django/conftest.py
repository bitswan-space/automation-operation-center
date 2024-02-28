import pytest

from bitswan_backend.users.models import User
from bitswan_backend.users.tests.factories import UserFactory


@pytest.fixture(autouse=True)
def _media_storage(settings, tmpdir):
    settings.MEDIA_ROOT = tmpdir.strpath


@pytest.fixture()
def user(db) -> User:
    return UserFactory()


@pytest.fixture()
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture()
def authenticate_staff(api_client, user):
    def do_authenticate_staff_user():
        user.is_staff = True
        api_client.force_authenticate(user=user)

    return do_authenticate_staff_user


@pytest.fixture()
def authenticate_normal_user(api_client, user):
    def do_authenticate_normal_user():
        user.is_staff = False
        api_client.force_authenticate(user=user)

    return do_authenticate_normal_user
