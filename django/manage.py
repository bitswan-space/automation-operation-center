#!/usr/bin/env python
# ruff: noqa
import os
import sys
from pathlib import Path

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

    # start new section
    from django.conf import settings

    if settings.DEBUG:
        import debugpy

        debugpy.listen(("0.0.0.0", 5678))
        print("⏳ Debugger attached")

    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        # The above import may fail for some other reason. Ensure that the
        # issue is really that Django is missing to avoid masking other
        # exceptions on Python 2.
        try:
            import django
        except ImportError:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            )

        raise

    # This allows easy placement of apps within the interior
    # bitswan_backend directory.
    current_path = Path(__file__).parent.resolve()
    sys.path.append(str(current_path / "bitswan_backend"))

    execute_from_command_line(sys.argv)
