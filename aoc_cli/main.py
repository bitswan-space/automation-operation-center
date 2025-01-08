#!/usr/bin/env python3

import argparse
import os
import platform
import secrets
import shutil
import sys
from datetime import datetime
from pathlib import Path

influxdb_vars = {
    "INFLUXDB_URL",
    "DOCKER_INFLUXDB_INIT_ORG",
    "DOCKER_INFLUXDB_INIT_BUCKET",
    "DOCKER_INFLUXDB_INIT_USERNAME",
    "DOCKER_INFLUXDB_INIT_PASSWORD",
}

keycloak_vars = {
    "KC_DB_PASSWORD",
    "KEYCLOAK_ADMIN_PASSWORD",
    "KEYCLOAK_ADMIN",
    "KEYCLOAK_CLIENT_ID",
    "KEYCLOAK_REFRESH_URL",
    "KC_HOSTNAME_URL",
    "PROXY_ADDRESS_FORWARDING",
    "KC_PROXY",
    "KEYCLOAK_ISSUER",
    "KC_DB",
    "DB_ADDR",
    "KC_DB_URL_HOST",
    "KC_DB_URL_DATABASE",
    "KC_DB_USERNAME",
    "KC_DB_PASSWORD",
}

operations_centre_vars = {
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "INFLUXDB_URL",
    "INFLUXDB_ORG",
    "INFLUXDB_BUCKET",
    "INFLUXDB_USERNAME",
    "INFLUXDB_PASSWORD",
    "KEYCLOAK_ISSUER",
    "KEYCLOAK_END_SESSION_URL",
    "KEYCLOAK_POST_LOGOUT_REDIRECT_URI",
    "KEYCLOAK_FRONTEND_URL",
    "KEYCLOAK_ADMIN_URL",
    "KEYCLOAK_REFRESH_URL",
    "KEYCLOAK_CLIENT_ID",
    "PORTAINER_BASE_URL",
    "NEXT_PUBLIC_MQTT_URL",
    "PREPARE_MQTT_SERVICE_URL",
    "CCS_CONFIG_KEY",
}

postgres_vars = {
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
}

django_backend_vars = {
    "DJANGO_SECRET_KEY",
    "DJANGO_ADMIN_URL",
    "AUTH_SECRET_KEY",
}

emqx_vars = {
    "EMQX_DASHBOARD__DEFAULT_PASSWORD",
}


def get_var_defaults(domain="bitswan.space", protocol="https"):
    if protocol not in ["http", "https"]:
        raise ValueError("Protocol must be either 'http' or 'https'")

    return {
        "NEXTAUTH_URL": f"{protocol}://poc.{domain}/",
        "INFLUXDB_URL": "http://influxdb:8086/",
        "INFLUXDB_ORG": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_ORG": "pipeline-operations-centre",
        "INFLUXDB_BUCKET": "pipeline-metrics",
        "DOCKER_INFLUXDB_INIT_BUCKET": "pipeline-metrics",
        "INFLUXDB_USERNAME": "pipeline-operations-centre",
        "DOCKER_INFLUXDB_INIT_USERNAME": "pipeline-operations-centre",
        "POSTGRES_USER": "postgres",
        "KEYCLOAK_ADMIN": "admin",
        "KEYCLOAK_CLIENT_ID": "bitswan-admin-dashboard",
        "KEYCLOAK_REFRESH_URL": "http://keycloak:8080/realms/master/protocol/openid-connect/token",
        "KEYCLOAK_ISSUER": "https://keycloak:8080/realms/master",
        "KEYCLOAK_END_SESSION_URL": f"{protocol}://keycloak.{domain}/realms/master/protocol/openid-connect/logout",
        "KEYCLOAK_POST_LOGOUT_REDIRECT_URI": f"{protocol}://poc.{domain}",
        "KEYCLOAK_FRONTEND_URL": f"{protocol}://keycloak.{domain}/",
        "KEYCLOAK_ADMIN_URL": f"{protocol}://keycloak.{domain}/",
        "KC_HOSTNAME_URL": f"{protocol}://keycloak.{domain}/",
        "PROXY_ADDRESS_FORWARDING": "true",
        "KC_PROXY": "edge",
        "KC_DB": "postgres",
        "DB_ADDR": "postgres",
        "KC_DB_URL_HOST": "postgres",
        "KC_DB_URL_DATABASE": "postgres",
        "KC_DB_USERNAME": "postgres",
        "PORTAINER_BASE_URL": "http://portainer:9000/",
        "MQTT_URL": "mqtt://mosquito:1883",
        "PREPARE_MQTT_SERVICE_URL": "http://container-config-service:8080/trigger",
        "NEXT_PUBLIC_MQTT_URL": f"{protocol}://mqtt.{domain}/",
        "DJANGO_ADMIN_URL": f"{protocol}://poc.{domain}/admin/",
    }


def write_env_file(env_vars: dict, keys: dict, env_file: Path):
    """
    Select keys from the env_vars dict and write them as a Docker compatible .env file
    """
    with open(env_file, "w") as f:
        for key in keys:
            f.write(f"{key}={env_vars[key]}\n")


def generate_secret():
    """Generate a random secret similar to mcookie"""
    return secrets.token_hex(16)


def setup(args):
    """Setup command implementation"""
    dry = args.dry

    # Use defaults if no input provided

    # Create .env from template if it doesn't exist
    if not os.path.exists(".env"):

        vars = get_var_defaults()
        vars["POSTGRES_PASSWORD"] = generate_secret()
        vars["KC_DB_PASSWORD"] = vars["POSTGRES_PASSWORD"]
        vars["INFLUXDB_PASSWORD"] = generate_secret()
        vars["DOCKER_INFLUXDB_INIT_PASSWORD"] = vars["INFLUXDB_PASSWORD"]
        vars["NEXTAUTH_SECRET"] = generate_secret()
        vars["KEYCLOAK_ADMIN_PASSWORD"] = generate_secret()
        vars["CCS_CONFIG_KEY"] = generate_secret()
        vars["EMQX_DASHBOARD__DEFAULT_PASSWORD"] = generate_secret()
        vars["DJANGO_SECRET_KEY"] = generate_secret()
        vars["AUTH_SECRET_KEY"] = generate_secret()

        # Copy template to temporary file
        if not dry:
            write_env_file(vars, keycloak_vars, "docker-compose/.keycloak.env")
            write_env_file(
                vars, operations_centre_vars, "docker-compose/.operations-centre.env"
            )
            write_env_file(vars, postgres_vars, "docker-compose/.postgres.env")
            write_env_file(vars, influxdb_vars, "docker-compose/.influxdb.env")
            write_env_file(vars, django_backend_vars, "docker-compose/.django.env")
            write_env_file(vars, emqx_vars, "docker-compose/.emqx.env")

        # Print final instructions
        print(
            "\nYou also need to set the following environment variables in your .env file:"
        )
        print(
            "KEYCLOAK_CLIENT_SECRET - Instructions for getting this value here: "
            "https://stackoverflow.com/questions/75647456/post-call-to-keycloak-to-fetch-access-token-works-in-postman-but-not-from-axios"
        )
        print(
            "INFLUXDB_TOKEN - This can be gotten by going to the influxdb UI and going to data -> tokens -> generate"
        )
        print(
            "If you are running locally you will also need to run the update-hosts command to update your hosts file:"
        )
        print("sudo aoc_cli update-hosts")

    return 0


def update_hosts(args):
    """
    Update /etc/hosts with the local platform domains.
    """
    dry_run = args.dry_run
    hosts_file = args.hosts_file

    if not os.path.exists(hosts_file):
        print(f"Error: {hosts_file} not found")
        dry_run = True

    # make sure we're root or sudo
    if os.geteuid() != 0:
        print("Error: This script must be run as root")
        dry_run = True

    # Domains to add
    domains = [
        "platform.local",
        "aoc.platform.local",
        "influx.platform.local",
        "keycloak.platform.local",
        "mqtt.platform.local",
        "portainer.platform.local",
        "editor.platform.local",
        "emqx.platform.local",
    ]

    current_hostfile = ""
    # Backup hosts file
    if not dry_run:
        now = datetime.now().strftime("%Y%m%d_%H%M%S")
        shutil.copy(hosts_file, f"{hosts_file}.backup.{now}")
        print(f"Backed up {hosts_file} to {hosts_file}.backup.{now}")

        current_hostfile = open(hosts_file, "r").read()

    domains_to_add = ""
    # Check if entries already exist
    for domain in domains:
        if domain in current_hostfile:
            print(f"Entry for {domain} already exists in hosts file")
        else:
            domains_to_add += f"\n127.0.0.1 {domain}"

    # Add entries
    print("Adding entries to hosts file")
    print(domains_to_add)
    if not dry_run:
        with open(hosts_file, "a") as f:
            f.write(domains_to_add)

            # Flush DNS cache
            if platform.system() == "Darwin":
                # macOS
                os.system("sudo dscacheutil -flushcache")
                os.system("sudo killall -HUP mDNSResponder")
                print("Flushed DNS cache (macOS)")
            else:
                # Linux (assuming systemd)
                os.system("sudo systemctl restart systemd-resolved")
                print("Flushed DNS cache (Linux)")

            print(
                "Hosts file has been updated. A backup was created at {hosts_file}.backup.*"
            )
            print("Please try accessing your services again")


def main():
    parser = argparse.ArgumentParser(
        description="Automation Opererations Center management utility"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Setup command
    setup_parser = subparsers.add_parser(
        "setup", help="Setup environment configuration"
    )
    setup_parser.add_argument(
        "--domain",
        default="platform.local",
        help="Domain where the platform will be accessed (default: %(default))",
    )
    setup_parser.add_argument(
        "--protocol",
        default="http",
        help="Protocol to use for platform access (default: %(default))",
    )
    setup_parser.add_argument("--dry", action="store_true", help="Dry run")

    # Update hosts command
    hosts_parser = subparsers.add_parser(
        "update-hosts", help="Update /etc/hosts file with required domains"
    )
    hosts_parser.add_argument(
        "--hosts-file",
        default="/etc/hosts",
        help="Path to hosts file (default: %(default)s)",
    )
    hosts_parser.add_argument("--dry-run", action="store_true", help="Dry run")

    args = parser.parse_args()

    if args.command == "setup":
        return setup(args)
    elif args.command == "update-hosts":
        return update_hosts(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
