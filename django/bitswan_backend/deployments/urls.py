from django.urls import path

from bitswan_backend.deployments.api.views import PipelineIDEStartView, current_deployed_version, update_webhook

app_name = "apps.gitops"
urlpatterns = [
    path(
        "pipeline-editor-start/",
        PipelineIDEStartView.as_view(),
        name="pipeline_editor_start",
    ),
    path(
        "current_deployed_version/",
        current_deployed_version,
        name="current deployed version"
    ),
    path(
        "update-webhook/",
        update_webhook,
        name="update_webhook"
    )
]
