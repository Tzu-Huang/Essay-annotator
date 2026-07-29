import os
from dataclasses import dataclass
from urllib.parse import urlparse


DEVELOPMENT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
)
PRODUCTION_REQUIRED_VARIABLES = (
    "POSTGRES_URL",
    "OPENAI_API_KEY",
    "GOOGLE_CLIENT_ID",
    "ADMIN_EMAILS",
)


class ConfigurationError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    environment: str
    cors_origins: tuple[str, ...]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


def _normalize_environment(value: str | None) -> str:
    environment = (value or "development").strip().lower()
    aliases = {"dev": "development", "prod": "production"}
    environment = aliases.get(environment, environment)
    if environment not in {"development", "test", "production"}:
        raise ConfigurationError(
            "APP_ENV must be one of: development, test, production"
        )
    return environment


def _normalize_origin(value: str) -> str:
    origin = value.strip().rstrip("/")
    if not origin:
        return ""
    if origin == "*":
        return origin
    parsed = urlparse(origin)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path:
        raise ConfigurationError(f"Invalid CORS origin: {origin}")
    return origin


def _cors_origins(environment: str, value: str | None) -> tuple[str, ...]:
    if value is None:
        return () if environment == "production" else DEVELOPMENT_CORS_ORIGINS

    origins = tuple(
        dict.fromkeys(
            origin
            for origin in (_normalize_origin(item) for item in value.split(","))
            if origin
        )
    )
    if environment == "production" and "*" in origins:
        raise ConfigurationError("CORS_ORIGINS cannot contain '*' in production")
    return origins


def load_settings(environ: dict[str, str] | None = None) -> Settings:
    values = os.environ if environ is None else environ
    environment = _normalize_environment(values.get("APP_ENV"))

    if environment == "production":
        missing = [
            name for name in PRODUCTION_REQUIRED_VARIABLES if not values.get(name, "").strip()
        ]
        if missing:
            raise ConfigurationError(
                "Missing required production variables: " + ", ".join(missing)
            )

    return Settings(
        environment=environment,
        cors_origins=_cors_origins(environment, values.get("CORS_ORIGINS")),
    )
