#!/usr/bin/env python3
"""
Create backend/.env for the football-data.org integration.
"""

import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).parent
    backend_dir = root / "backend"
    env_file = backend_dir / ".env"

    if not backend_dir.exists():
        print("backend/ directory not found")
        sys.exit(1)

    if env_file.exists():
        response = input(f"{env_file} already exists. Overwrite it? (y/N): ").strip().lower()
        if response != "y":
            print("Setup cancelled.")
            return

    print("FootyLive API setup")
    print("Get your key from https://www.football-data.org/")
    api_key = input("Enter your football-data.org API key: ").strip()
    if not api_key:
      print("API key is required.")
      sys.exit(1)

    environment = input("Environment [development]: ").strip() or "development"
    api_plan = input("API plan [default]: ").strip() or "default"

    env_file.write_text(
        "\n".join(
            [
                "# football-data.org configuration",
                f"FOOTBALL_DATA_API_KEY={api_key}",
                "",
                "# Environment configuration",
                f"ENVIRONMENT={environment}",
                f"API_PLAN={api_plan}",
                "",
                "# Database configuration",
                "DATABASE_URL=sqlite:///./footylive.db",
                "",
            ]
        )
        + "\n"
    )

    print(f"Created {env_file}")
    print("Next steps:")
    print("1. cd backend && python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
    print("2. cd frontend && npm run dev")


if __name__ == "__main__":
    main()
