from typing import Optional

SUPPORTED_COMPETITIONS = {
    "PL": {
        "name": "Premier League",
        "country": "England",
    },
    "BL1": {
        "name": "Bundesliga",
        "country": "Germany",
    },
    "FL1": {
        "name": "Ligue 1",
        "country": "France",
    },
    "SA": {
        "name": "Serie A",
        "country": "Italy",
    },
    "PD": {
        "name": "La Liga",
        "country": "Spain",
    },
    "CL": {
        "name": "UEFA Champions League",
        "country": "Europe",
    },
}


DEFAULT_COMPETITION_CODE = "PL"
MAIN_LEAGUE_CODES = ["PL", "BL1", "FL1", "SA", "PD", "CL"]


def normalize_competition_code(code: Optional[str]) -> str:
    normalized = (code or DEFAULT_COMPETITION_CODE).strip().upper()
    return normalized if normalized in SUPPORTED_COMPETITIONS else DEFAULT_COMPETITION_CODE
