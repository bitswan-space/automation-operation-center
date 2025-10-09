# ruff: noqa
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path
from django.views import defaults as default_views
from django.views.generic import RedirectView
from bitswan_backend.core.views.swagger import PublicSwaggerView, PublicSchemaView, AutomationServerDocumentationView, AOCArchitectureDocumentationView
from bitswan_backend.core.views.general import VersionAPIView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs", permanent=False), name="home"),
    # Django Admin, use {% url 'admin:index' %}
    path(settings.ADMIN_URL, admin.site.urls),
    # User management
    path("users/", include("bitswan_backend.users.urls", namespace="users")),
    path("accounts/", include("allauth.urls")),
    # Version endpoint - always available
    path("api/version", VersionAPIView.as_view(), name="version"),
    # Your stuff: custom urls includes go here
    # ...
    # Media files
    *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
    # API base url
    path("api/", include("config.api_router")),
    # DRF auth token
    path("auth-token", obtain_auth_token),
    path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("djoser.urls.jwt")),
    path("api/schema", PublicSchemaView.as_view(), name="api-schema"),
    path(
        "api/docs",
        PublicSwaggerView.as_view(url_name="api-schema"),
        name="api-docs",
    ),
    path(
        "api/docs/automation-server-integration",
        AutomationServerDocumentationView.as_view(),
        name="automation-server-docs",
    ),
    path(
        "api/docs/architecture",
        AOCArchitectureDocumentationView.as_view(),
        name="aoc-architecture-docs",
    ),
]
if settings.DEBUG:
    # Static file serving when using Gunicorn + Uvicorn for local web socket development
    urlpatterns += staticfiles_urlpatterns()

if settings.DEBUG:
    # This allows the error pages to be debugged during development, just visit
    # these url in browser to see how these error pages look like.
    urlpatterns += [
        path(
            "400",
            default_views.bad_request,
            kwargs={"exception": Exception("Bad Request!")},
        ),
        path(
            "403",
            default_views.permission_denied,
            kwargs={"exception": Exception("Permission Denied")},
        ),
        path(
            "404",
            default_views.page_not_found,
            kwargs={"exception": Exception("Page not Found")},
        ),
        path("500", default_views.server_error),
    ]
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
