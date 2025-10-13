from pathlib import Path
from typing import Optional, Dict
import os


def get_env_value(env_file: str | Path, key: str) -> Optional[str]:
    """
    Get the value of an environment variable from a .env file

    Args:
        env_file (str | Path): Path to the .env file
        key (str): The environment variable key to look up

    Returns:
        Optional[str]: The value of the environment variable if found, None otherwise

    Raises:
        FileNotFoundError: If the .env file doesn't exist
        ValueError: If the key is empty
    """
    if not key:
        raise ValueError("Key cannot be empty")

    env_path = Path(env_file)
    if not env_path.exists():
        raise FileNotFoundError(f"Environment file not found: {env_file}")

    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            # Skip empty lines and comments
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Split on first = sign (handles values containing =)
            if "=" not in line:
                continue

            env_key, env_value = line.split("=", 1)
            env_key = env_key.strip()
            env_value = env_value.strip()

            # Remove quotes if present
            if env_value and env_value[0] in ['"', "'"] and env_value[-1] in ['"', "'"]:
                env_value = env_value[1:-1]

            if env_key == key:
                return env_value

    return None


def get_env_map(env_file: str | Path) -> Dict[str, str]:
    """
    Parse a .env file into a dict of key -> value (quotes stripped).
    Raises FileNotFoundError if file doesn't exist.
    """
    env_path = Path(env_file)
    if not env_path.exists():
        raise FileNotFoundError(f"Environment file not found: {env_file}")

    env: Dict[str, str] = {}
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            env_key, env_value = line.split("=", 1)
            env_key = env_key.strip()
            env_value = env_value.strip()
            if env_value and env_value[0] in ['"', "'"] and env_value[-1] in ['"', "'"]:
                env_value = env_value[1:-1]
            env[env_key] = env_value
    return env


def write_env_file(env_content: str, env_path: str) -> None:
    """
    Write environment variables to a file.
    Creates the directory path if it doesn't exist.
    """
    # Create directory if it doesn't exist
    directory = os.path.dirname(env_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)

    # Write the file
    with open(env_path, "w") as f:
        f.write(env_content)


def get_env_var(
    var_name: str,
    default: str | None = None,
    env: str = "dev",
    required_in_prod: bool = False,
) -> str | None:
    """
    Get an environment variable, optionally requiring it in production.

    Args:
        var_name: Name of the environment variable.
        default: Default value if the variable is not set.
        env: Configured App environment ("dev" or "prod")
        required_in_prod: If True, raise an error in production if var is not set.

    Returns:
        The value of the environment variable, or default if provided and applicable.

    Raises:
        RuntimeError: If required_in_prod is True and we're in production and the variable is not set.
    """
    value = os.getenv(var_name, default)
    is_prod = env == "prod"

    if required_in_prod and is_prod and (value is None or str(value).strip() == ""):
        raise RuntimeError(
            f"Missing required environment variable '{var_name}' in production."
        )

    return value
