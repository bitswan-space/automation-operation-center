from django.urls import path

from bitswan_backend.deployments.api.views import PipelineIDEStartView

app_name = "apps.gitops"
urlpatterns = [
    path(
        "pipeline-editor-start/",
        PipelineIDEStartView.as_view(),
        name="pipeline_editor_start",
    ),
]
