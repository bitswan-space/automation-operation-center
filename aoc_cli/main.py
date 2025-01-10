#!/usr/bin/env python3

import argparse
import sys

from aoc_cli.commands import hosts, setup


def main():
    parser = argparse.ArgumentParser(
        description="Automation Opererations Center management utility"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Add commands
    setup.add_subparser(subparsers)
    hosts.add_subparser(subparsers)

    args = parser.parse_args()
    if hasattr(args, "func"):
        return args.func(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
