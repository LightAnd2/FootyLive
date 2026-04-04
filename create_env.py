#!/usr/bin/env python3
"""
Small helper to create backend/.env.
"""

from pathlib import Path


def main() -> None:
    env_file = Path(__file__).parent / "backend" / ".env"
    api_key = input("football-data.org API key: ").strip()
    if not api_key:
        print("API key is required.")
        return

    env_file.write_text(
        "FOOTBALL_DATA_API_KEY={key}\nENVIRONMENT=development\nAPI_PLAN=default\n".format(
            key=api_key
        )
    )
    print(f"Created {env_file}")


if __name__ == "__main__":
    main()
