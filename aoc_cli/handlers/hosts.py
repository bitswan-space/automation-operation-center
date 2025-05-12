# commands/hosts.py

import logging
import os
import platform
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Set


@dataclass
class HostEntry:
    ip: str
    domain: str


class HostsManager:
    DEFAULT_DOMAINS = [
        "bitswan.localhost",
        "aoc.bitswan.localhost",
        "influx.bitswan.localhost",
        "keycloak.bitswan.localhost",
        "api.bitswan.localhost",
        "mqtt.bitswan.localhost",
        "mqttws.bitswan.localhost",
        "emqx.bitswan.localhost",
    ]

    def __init__(self, hosts_file: Path, dry_run: bool = False):
        self.hosts_file = Path(hosts_file)
        self.dry_run = dry_run
        self.logger = logging.getLogger(__name__)

    def backup_hosts_file(self) -> Path:
        """Create a backup of the hosts file with timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.hosts_file.with_suffix(f".backup.{timestamp}")

        if not self.dry_run:
            shutil.copy(self.hosts_file, backup_path)
            self.logger.info(f"Created hosts file backup at {backup_path}")

        return backup_path

    def read_current_entries(self) -> Set[str]:
        """Read existing entries from hosts file"""
        if not self.hosts_file.exists():
            self.logger.warning(f"Hosts file not found at {self.hosts_file}")
            return set()

        try:
            content = self.hosts_file.read_text()
            return {line.strip() for line in content.splitlines() if line.strip()}
        except Exception as e:
            self.logger.error(f"Error reading hosts file: {e}")
            return set()

    def get_missing_entries(self, domains: List[str]) -> List[HostEntry]:
        """Determine which domain entries need to be added"""
        current_entries = self.read_current_entries()
        missing_entries = []

        for domain in domains:
            entry = f"127.0.0.1 {domain}"
            if entry not in current_entries:
                missing_entries.append(HostEntry("127.0.0.1", domain))
                self.logger.info(f"Will add entry for {domain}")
            else:
                self.logger.debug(f"Entry already exists for {domain}")

        return missing_entries

    def write_entries(self, entries: List[HostEntry]) -> None:
        """Write new entries to the hosts file"""
        if not entries:
            self.logger.info("No new entries to add")
            return

        if self.dry_run:
            self.logger.info("Dry run - would add entries:")
            for entry in entries:
                print(f"{entry.ip} {entry.domain}")
            return

        try:
            with open(self.hosts_file, "a") as f:
                f.write("\n# Added by platform-cli\n")
                for entry in entries:
                    f.write(f"{entry.ip} {entry.domain}\n")
            self.logger.info(f"Successfully added {len(entries)} entries to hosts file")
        except Exception as e:
            self.logger.error(f"Error writing to hosts file: {e}")
            raise

    def flush_dns_cache(self) -> None:
        """Flush the DNS cache based on the operating system"""
        if self.dry_run:
            self.logger.info("Dry run - would flush DNS cache")
            return

        try:
            if platform.system() == "Darwin":  # macOS
                os.system("dscacheutil -flushcache")
                os.system("killall -HUP mDNSResponder")
                self.logger.info("Flushed DNS cache (macOS)")
            elif platform.system() == "Linux":  # Linux
                os.system("systemctl restart systemd-resolved")
                self.logger.info("Flushed DNS cache (Linux)")
            else:
                self.logger.warning(
                    f"DNS cache flush not implemented for {platform.system()}"
                )
        except Exception as e:
            self.logger.error(f"Error flushing DNS cache: {e}")
            raise


def update_hosts_command(args) -> int:
    """Update hosts file command implementation"""
    # Set up logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)

    # Check if running as root/sudo
    if os.geteuid() != 0 and not args.dry_run:
        logger.error("This command must be run with sudo/root privileges")
        return 1

    try:
        manager = HostsManager(hosts_file=args.hosts_file, dry_run=args.dry_run)

        # Create backup
        manager.backup_hosts_file()

        # Get missing entries
        missing_entries = manager.get_missing_entries(HostsManager.DEFAULT_DOMAINS)

        # Write new entries
        manager.write_entries(missing_entries)

        # Flush DNS cache
        manager.flush_dns_cache()

        if not args.dry_run:
            logger.info(
                "Hosts file has been updated successfully. "
                "A backup was created and DNS cache was flushed."
            )
            logger.info(
                "You can now access the platform services using the configured domains."
            )

        return 0

    except Exception as e:
        logger.error(f"Error updating hosts file: {e}")
        return 1


def add_subparser(subparsers):
    """Add the hosts command to the main parser"""
    parser = subparsers.add_parser(
        "update-hosts", help="Update /etc/hosts file with required domains"
    )
    parser.add_argument(
        "--hosts-file",
        type=Path,
        default="/etc/hosts",
        help="Path to hosts file (default: %(default)s)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )
    parser.set_defaults(func=update_hosts_command)
