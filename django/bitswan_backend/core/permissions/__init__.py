# Import all permission classes to make them available from the package
from .admin import IsOrgAdmin
from .workspaces import (
    CanReadOrgEMQXJWT,
    CanReadWorkspaceEMQXJWT,
    CanReadWorkspacePipelineEMQXJWT,
    CanReadAutomationServerEMQXJWT,
)
from .emqx import (
    CanReadOrgEMQXJWT as CanReadOrgEMQXJWT_EMQX,
    CanReadWorkspaceEMQXJWT as CanReadWorkspaceEMQXJWT_EMQX,
    CanReadWorkspacePipelineEMQXJWT as CanReadWorkspacePipelineEMQXJWT_EMQX,
    CanReadAutomationServerEMQXJWT as CanReadAutomationServerEMQXJWT_EMQX,
)

__all__ = [
    'IsOrgAdmin',
    'CanReadOrgEMQXJWT',
    'CanReadWorkspaceEMQXJWT',
    'CanReadWorkspacePipelineEMQXJWT',
    'CanReadAutomationServerEMQXJWT',
    'CanReadOrgEMQXJWT_EMQX',
    'CanReadWorkspaceEMQXJWT_EMQX',
    'CanReadWorkspacePipelineEMQXJWT_EMQX',
    'CanReadAutomationServerEMQXJWT_EMQX',
]
