from urllib.parse import urlparse


def get_port_from_url(url, default_scheme="http"):
    """
    Extracts the port number from a URL.
    Adds a default scheme if the URL does not have one.

    :param url: The URL from which to extract the port number.
    :param default_scheme: The default scheme to prepend if the URL lacks one.
    :return: The port number if available, otherwise None.
    """
    if "://" not in url:
        url = f"{default_scheme}://{url}"

    parsed_url = urlparse(url)

    return parsed_url.port
