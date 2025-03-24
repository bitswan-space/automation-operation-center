import datetime

import jwt


def create_token(secret: str, config: dict | None = None):
    if config is None:
        config = {}

    exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    exp_timestamp = int(exp.timestamp())

    mountpoint = ""
    username = "root"

    automation_server_id = config.get("automation_server_id")
    keycloak_org_id = config.get("keycloak_org_id")
    profile_id = config.get("profile_id")
    workspace = config.get("workspace")
    deployment_id = config.get("deployment_id")

    if automation_server_id and keycloak_org_id:
        mountpoint = (
            f"/orgs/{keycloak_org_id}/automation-servers/{automation_server_id}"
        )
        username = automation_server_id

    if profile_id and keycloak_org_id:
        mountpoint = f"/orgs/{keycloak_org_id}/profiles/{profile_id}"
        username = profile_id

    elif workspace:
        base_mountpoint = (
            f"/orgs/{workspace.keycloak_org_id}/automation-servers/{workspace.automation_server_id}",
        )
        workspace_path = f"/c/{workspace.id}"

        if deployment_id:
            mountpoint = f"{''.join(base_mountpoint)}{workspace_path}/c/{deployment_id}"
        else:
            mountpoint = f"{''.join(base_mountpoint)}{workspace_path}"
        username = workspace.id

    payload = {
        "exp": exp_timestamp,
        "username": username,
        "client_attrs": {"mountpoint": mountpoint},
    }

    return jwt.encode(payload, secret, algorithm="HS256")
