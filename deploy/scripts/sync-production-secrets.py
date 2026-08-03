#!/usr/bin/env python3
import argparse
import json
import os
import tempfile
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit


def parse_env(text: str) -> tuple[list[str], dict[str, str]]:
    lines = text.splitlines()
    values: dict[str, str] = {}
    for line in lines:
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return lines, values


def replace_env_values(lines: list[str], replacements: dict[str, str]) -> str:
    remaining = dict(replacements)
    rendered: list[str] = []
    for line in lines:
        if "=" in line and not line.lstrip().startswith("#"):
            key = line.split("=", 1)[0]
            if key in remaining:
                rendered.append(f"{key}={remaining.pop(key)}")
                continue
        rendered.append(line)
    rendered.extend(f"{key}={value}" for key, value in remaining.items())
    return "\n".join(rendered) + "\n"


def build_postgres_url(current_url: str, secret: dict[str, object]) -> str:
    parsed = urlsplit(current_url)
    required = ("username", "password", "host", "port")
    missing = [key for key in required if secret.get(key) in (None, "")]
    if missing:
        raise ValueError(f"RDS secret is missing fields: {', '.join(missing)}")
    username = quote(str(secret["username"]), safe="")
    password = quote(str(secret["password"]), safe="")
    host = str(secret["host"])
    port = int(secret["port"])
    return urlunsplit((parsed.scheme, f"{username}:{password}@{host}:{port}", parsed.path, parsed.query, parsed.fragment))


def fetch_secret(client, secret_id: str) -> str:
    response = client.get_secret_value(SecretId=secret_id)
    value = response.get("SecretString", "")
    if not value:
        raise ValueError(f"secret has no SecretString: {secret_id}")
    return value


def atomic_write(path: Path, content: str) -> None:
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent, text=True)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Synchronize production credentials from AWS Secrets Manager")
    parser.add_argument("--env-file", default="/etc/essay-annotator/production.env")
    parser.add_argument("--openai-secret", required=True)
    parser.add_argument("--rds-secret", required=True)
    parser.add_argument("--region", required=True)
    args = parser.parse_args()

    import boto3

    env_path = Path(args.env_file)
    lines, current = parse_env(env_path.read_text(encoding="utf-8"))
    if "OPENAI_API_KEY" not in current or "POSTGRES_URL" not in current:
        raise ValueError("production env must contain OPENAI_API_KEY and POSTGRES_URL")

    client = boto3.client("secretsmanager", region_name=args.region)
    openai_key = fetch_secret(client, args.openai_secret).strip()
    if openai_key == "REPLACE_BEFORE_USE" or len(openai_key) < 20:
        raise ValueError("OpenAI secret has not been replaced with a valid value")
    rds_secret = json.loads(fetch_secret(client, args.rds_secret))
    postgres_url = build_postgres_url(current["POSTGRES_URL"], rds_secret)

    atomic_write(
        env_path,
        replace_env_values(lines, {"OPENAI_API_KEY": openai_key, "POSTGRES_URL": postgres_url}),
    )
    print("production credentials synchronized from Secrets Manager")


if __name__ == "__main__":
    main()
