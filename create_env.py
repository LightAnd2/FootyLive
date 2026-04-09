#!/usr/bin/env python3
"""
Small helper to create a backend/.env template without writing secrets.
"""

from pathlib import Path


ENV_TEMPLATE = """FOOTBALL_DATA_API_KEY=
ENVIRONMENT=development
API_PLAN=default
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOWED_HOSTS=localhost,127.0.0.1
DOCS_ENABLED=true
DATABASE_URL=sqlite:///./footylive.db
"""


def main() -> None:
    env_file = Path(__file__).parent / "backend" / ".env"

    if env_file.exists():
        response = input(f"{env_file} already exists. Overwrite it with a blank template? (y/N): ").strip().lower()
        if response != "y":
            print("Setup cancelled.")
            return

    env_file.write_text(ENV_TEMPLATE)
    print(f"Created template at {env_file}")
    print("Add your football-data.org API key locally before running the backend.")


if __name__ == "__main__":
    main()
