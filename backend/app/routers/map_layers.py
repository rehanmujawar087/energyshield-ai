"""Digital Twin map layers — mock endpoint.

GET /api/map/layers — corridors (with waypoints), ports, refineries, SPR
sites, and simulated vessels, in one call.

MOCK ONLY. Coordinates are illustrative placeholders for the demo map, not
surveyed data. Reads current risk scores from the risk router's in-memory
state so the map's corridor colouring matches the risk panel.
"""

from fastapi import APIRouter

from app.models.schemas import (
    Corridor,
    LatLon,
    MapLayersResponse,
    Port,
    Refinery,
    SprSite,
    Vessel,
)
from app.routers.risk import _CORRIDOR_NAMES, _state as risk_state

router = APIRouter(prefix="/api/map", tags=["map"])

_WAYPOINTS: dict[str, list[tuple[float, float]]] = {
    "hormuz": [(26.75, 55.95), (26.55, 56.25), (26.30, 56.50), (25.95, 56.90)],
    "bab_el_mandeb": [(12.70, 43.35), (12.55, 43.45), (12.40, 43.55)],
    "suez": [(31.26, 32.32), (30.60, 32.35), (29.93, 32.55)],
    "malacca": [(5.50, 98.00), (3.50, 100.50), (1.50, 103.00)],
    "cape_route": [(-20.00, 10.00), (-34.35, 18.47), (-10.00, 55.00)],
}

_PORTS = [
    Port(id="jnpt", name="Jawaharlal Nehru Port (Nhava Sheva)", lat=18.95, lon=72.95, type="container_and_liquid"),
    Port(id="kandla", name="Kandla / Deendayal Port", lat=23.02, lon=70.22, type="liquid_bulk"),
    Port(id="paradip", name="Paradip Port", lat=20.27, lon=86.68, type="crude_and_bulk"),
    Port(id="chennai", name="Chennai Port", lat=13.10, lon=80.29, type="crude_and_container"),
    Port(id="new_mangalore", name="New Mangalore Port", lat=12.93, lon=74.80, type="crude_terminal"),
]

_REFINERIES = [
    Refinery(id="jamnagar", name="Jamnagar Refinery (Reliance)", lat=22.34, lon=69.90, capacity_bpd_approx=1240000),
    Refinery(id="vadinar", name="Vadinar Refinery (Nayara Energy)", lat=22.47, lon=69.70, capacity_bpd_approx=400000),
    Refinery(id="vizag_refinery", name="Visakhapatnam Refinery (HPCL)", lat=17.70, lon=83.22, capacity_bpd_approx=170000),
    Refinery(id="mangalore_refinery", name="Mangalore Refinery (MRPL)", lat=12.93, lon=74.80, capacity_bpd_approx=300000),
]

_SPR_SITES = [
    SprSite(id="visakhapatnam", name="Visakhapatnam SPR", lat=17.70, lon=83.30, capacity_mmt_approx=1.33),
    SprSite(id="mangaluru", name="Mangaluru SPR", lat=12.87, lon=74.84, capacity_mmt_approx=1.5),
    SprSite(id="padur", name="Padur SPR", lat=13.35, lon=74.84, capacity_mmt_approx=2.5),
]

_VESSELS = [
    Vessel(id="v001", name="SIMULATED Tanker 1", lat=26.40, lon=56.30, corridor="hormuz"),
    Vessel(id="v002", name="SIMULATED Tanker 2", lat=12.50, lon=43.50, corridor="bab_el_mandeb"),
    Vessel(id="v003", name="SIMULATED Tanker 3", lat=2.50, lon=101.50, corridor="malacca"),
]


@router.get("/layers", response_model=MapLayersResponse)
def get_layers() -> MapLayersResponse:
    corridors = [
        Corridor(
            id=cid,
            name=_CORRIDOR_NAMES[cid],
            waypoints=[LatLon(lat=lat, lon=lon) for lat, lon in points],
            risk_score=risk_state[cid].score,
        )
        for cid, points in _WAYPOINTS.items()
    ]
    return MapLayersResponse(
        corridors=corridors,
        ports=_PORTS,
        refineries=_REFINERIES,
        spr_sites=_SPR_SITES,
        vessels=_VESSELS,
    )
