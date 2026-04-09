#!/usr/bin/env python3
"""
Create a safe backend/.env template for the football-data.org integration.
"""

import shutil
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).parent
    backend_dir = root / "backend"
    env_file = backend_dir / ".env"
    example_file = backend_dir / ".env.example"

    if not backend_dir.exists():
        print("backend/ directory not found")
        sys.exit(1)

    if env_file.exists():
        response = input(f"{env_file} already exists. Overwrite it with a blank template? (y/N): ").strip().lower()
        if response != "y":
            print("Setup cancelled.")
            return

    if example_file.exists():
        shutil.copyfile(example_file, env_file)
    else:
        env_file.write_text(
            "\n".join(
                [
                    "FOOTBALL_DATA_API_KEY=",
                    "ENVIRONMENT=development",
                    "API_PLAN=default",
                    "BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173",
                    "ALLOWED_HOSTS=localhost,127.0.0.1",
                    "DOCS_ENABLED=true",
                    "DATABASE_URL=sqlite:///./footylive.db",
                    "",
                ]
            )
        )

    print("FootyLive API setup")
    print(f"Created template at {env_file}")
    print("Open backend/.env locally and add your football-data.org API key before starting the backend.")
    print("Next steps:")
    print("1. Edit backend/.env and set FOOTBALL_DATA_API_KEY")
    print("2. cd backend && python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
    print("3. cd frontend && npm run dev")


if __name__ == "__main__":
    main()
