#!/usr/bin/env python3

import argparse
from datetime import datetime
import os
import platform
import secrets
import shutil
import fileinput
import sys
from pathlib import Path


def generate_secret():
    """Generate a random secret similar to mcookie"""
    return secrets.token_hex(16)


def replace_in_file(filename, old_str, new_str):
    """Replace string in file"""
    with fileinput.FileInput(filename, inplace=True) as file:
        for line in file:
            print(line.replace(old_str, new_str), end="")


def filter_vars(source_file, vars_file, output_file):
    """Filter variables from source file based on vars file content"""
    if not os.path.exists(vars_file):
        print(f"Warning: {vars_file} does not exist")
        return

    # Read variables to filter
    with open(vars_file, "r") as f:
        filter_vars = set(line.strip() for line in f if line.strip())

    # Read source file and write matching lines to output
    with open(source_file, "r") as src, open(output_file, "w") as dst:
        for line in src:
            var_name = line.split("=")[0].strip() if "=" in line else ""
            if var_name in filter_vars:
                dst.write(line)


def setup(args):
    """Setup command implementation"""
    dry = args.dry
    # Get user input with defaults
    platform_domain = input(
        f"Enter the platform domain (default: {args.platform_domain}): "
    ).strip()
    keycloak_domain = input(
        f"Enter the keycloak domain (default: {args.keycloak_domain}): "
    ).strip()

    # Use defaults if no input provided
    platform_domain = platform_domain or args.platform_domain
    keycloak_domain = keycloak_domain or args.keycloak_domain

    print(platform_domain)
    print(keycloak_domain)

    # Create .env from template if it doesn't exist
    if not os.path.exists(".env"):
        # Ensure env/template exists
        if not os.path.exists("env/template"):
            print("Error: env/template file not found")
            return 1

        # Copy template to temporary file
        if not dry:
            shutil.copy("env/template", ".env.temp")

            # Replace domains
            replace_in_file(
                ".env.temp", "https://keycloak.bitswan.space", keycloak_domain
            )
            replace_in_file(".env.temp", "https://poc.bitswan.space", platform_domain)

            # Generate and append passwords
            with open(".env.temp", "a") as f:
                postgres_password = generate_secret()
                influxdb_password = generate_secret()

                f.write(f"POSTGRES_PASSWORD={postgres_password}\n")
                f.write(f"KC_DB_PASSWORD={postgres_password}\n")
                f.write(f"INFLUXDB_PASSWORD={influxdb_password}\n")
                f.write(f"DOCKER_INFLUXDB_INIT_PASSWORD={influxdb_password}\n")
                f.write(f"NEXTAUTH_SECRET={generate_secret()}\n")
                f.write(f"KEYCLOAK_ADMIN_PASSWORD={generate_secret()}\n")

            # Filter variables for different components
            filter_vars(".env.temp", "env/pipeline-vars", ".pipeline.env")
            filter_vars(".env.temp", "env/keycloak-vars", ".keycloak.env")
            filter_vars(".env.temp", "env/aoc-vars", ".aoc.env")

            # Update keycloak URL in operations centre env
            replace_in_file(".aoc.env", "http.*keycloak:8080", keycloak_domain)

            filter_vars(".env.temp", "env/influxdb-vars", ".influxdb.env")
            filter_vars(".env.temp", "env/postgres-vars", ".postgres.env")

            # Clean up
            os.remove(".env.temp")

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
        "--platform-domain",
        default="http://localhost:3000",
        help="Platform domain (default: %(default)s)",
    )
    setup_parser.add_argument(
        "--keycloak-domain",
        default="http://keycloak.platform.local",
        help="Keycloak domain (default: %(default)s)",
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
