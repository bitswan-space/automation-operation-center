from django.urls import path

from bitswan_backend.users.views import user_detail_view
from bitswan_backend.users.views import user_redirect_view
from bitswan_backend.users.views import user_update_view
from bitswan_backend.users.views import keycloak_login
from bitswan_backend.users.views import keycloak_callback

app_name = "users"
urlpatterns = [
    path("~redirect/", view=user_redirect_view, name="redirect"),
    path("~update/", view=user_update_view, name="update"),
    path("<int:pk>/", view=user_detail_view, name="detail"),
    path("keycloak/login/", view=keycloak_login, name="keycloak_login"),
    path("keycloak/callback/", view=keycloak_callback, name="keycloak_callback"),
]
