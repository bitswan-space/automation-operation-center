from rest_framework import serializers


class PipelineEditorStartSerializer(serializers.Serializer):
    secret_key = serializers.CharField()
    deployment_id = serializers.CharField()
