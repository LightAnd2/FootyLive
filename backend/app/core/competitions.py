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
    "DED": {
        "name": "Eredivisie",
        "country": "Netherlands",
    },
    "PPL": {
        "name": "Primeira Liga",
        "country": "Portugal",
    },
    "ELC": {
        "name": "Championship",
        "country": "England",
    },
    "BSA": {
        "name": "Campeonato Brasileiro Série A",
        "country": "Brazil",
    },
    "CL": {
        "name": "UEFA Champions League",
        "country": "Europe",
    },
    "EC": {
        "name": "European Championship",
        "country": "Europe",
    },
    "WC": {
        "name": "FIFA World Cup",
        "country": "World",
    },
}


DEFAULT_COMPETITION_CODE = "PL"
MAIN_LEAGUE_CODES = ["PL", "ELC", "BL1", "FL1", "SA", "PD", "DED", "PPL", "BSA", "CL", "EC", "WC"]

# Knockout-only competitions: their season is told by the bracket, not a table —
# archives skip storing a standings snapshot for these.
CUP_COMPETITION_CODES = {"CL", "EC", "WC"}


def normalize_competition_code(code: Optional[str]) -> str:
    normalized = (code or DEFAULT_COMPETITION_CODE).strip().upper()
    return normalized if normalized in SUPPORTED_COMPETITIONS else DEFAULT_COMPETITION_CODE
