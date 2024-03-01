from django.urls import path

from apps.gitops.api.views import PipelineIDEStartView

app_name = "apps.gitops"
urlpatterns = [
    path(
        "pipeline-editor-start/",
        PipelineIDEStartView.as_view(),
        name="pipeline-editor-start",
    ),
]
