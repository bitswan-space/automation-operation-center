from http import HTTPStatus

from django.urls import reverse


class TestSwagger:
    def test_swagger_accessible_by_admin(self, api_client, authenticate_staff):
        authenticate_staff()

        url = reverse("api-docs")
        response = api_client.get(url)

        assert response.status_code == HTTPStatus.OK

    def test_swagger_ui_not_accessible_by_normal_user(
        self,
        api_client,
        authenticate_normal_user,
    ):
        authenticate_normal_user()

        url = reverse("api-docs")
        response = api_client.get(url)

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_api_schema_generated_successfully(self, api_client, authenticate_staff):
        authenticate_staff()

        url = reverse("api-schema")
        response = api_client.get(url)

        assert response.status_code == HTTPStatus.OK
