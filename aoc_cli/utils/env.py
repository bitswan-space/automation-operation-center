from pathlib import Path
from typing import Optional


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
