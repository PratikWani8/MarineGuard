import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import { getHeatmap } from "../services/dashboardApi";
import Loading from "../components/common/Loading";

const center = [20.5, 72.8];

function markerColor(score) {
  return score >= 80
    ? "#fb7185"
    : score >= 60
      ? "#fb923c"
      : score >= 40
        ? "#fbbf24"
        : "#34d399";
}

// ============================================================
// HEATMAP LAYER
// ============================================================

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Remove previous heat layer.
    if (map._marineGuardHeatLayer) {
      map.removeLayer(
        map._marineGuardHeatLayer
      );

      map._marineGuardHeatLayer = null;
    }

    if (!points?.length) {
      return undefined;
    }

    const heatPoints = points
      .filter(
        (point) =>
          Number.isFinite(
            Number(point.latitude)
          ) &&
          Number.isFinite(
            Number(point.longitude)
          )
      )
      .map((point) => {
        const hazard = Math.max(
          0,
          Math.min(
            100,
            Number(
              point.hazardScore ??
                point.hazard_score ??
                0
            )
          )
        );

        // leaflet.heat intensity should be 0-1.
        const intensity =
          hazard / 100;

        return [
          Number(point.latitude),
          Number(point.longitude),
          Math.max(
            0.05,
            intensity
          ),
        ];
      });

    if (!heatPoints.length) {
      return undefined;
    }

    const heatLayer =
      L.heatLayer(
        heatPoints,
        {
          radius: 35,
          blur: 28,
          maxZoom: 10,
          minOpacity: 0.35,
          max: 1.0,
        }
      );

    heatLayer.addTo(map);

    map._marineGuardHeatLayer =
      heatLayer;

    return () => {
      if (
        map._marineGuardHeatLayer
      ) {
        map.removeLayer(
          map._marineGuardHeatLayer
        );

        map._marineGuardHeatLayer =
          null;
      }
    };
  }, [map, points]);

  return null;
}

// ============================================================
// MAP
// ============================================================

export default function MarineMap() {
  const [
    points,
    setPoints,
  ] = useState(null);

  const [
    filter,
    setFilter,
  ] = useState({
    classification: "",
    riskLevel: "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    showHeatmap,
    setShowHeatmap,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ==========================================================
  // FETCH HEATMAP DATA
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadHeatmap() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getHeatmap(
            filter
          );

        if (cancelled) {
          return;
        }

        const data =
          response?.data?.data ??
          response?.data ??
          [];

        setPoints(
          Array.isArray(data)
            ? data
            : data?.points || []
        );

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Marine heatmap error:",
          err
        );

        setError(
          err?.userMessage ||
            err?.response?.data
              ?.message ||
            "Map data unavailable"
        );

        setPoints([]);

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHeatmap();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    const data =
      points || [];

    const critical = data.filter(
      (p) =>
        Number(
          p.hazardScore ??
            p.hazard_score ??
            0
        ) >= 80
    ).length;

    const high = data.filter(
      (p) => {
        const score = Number(
          p.hazardScore ??
            p.hazard_score ??
            0
        );

        return (
          score >= 60 &&
          score < 80
        );
      }
    ).length;

    const medium = data.filter(
      (p) => {
        const score = Number(
          p.hazardScore ??
            p.hazard_score ??
            0
        );

        return (
          score >= 40 &&
          score < 60
        );
      }
    ).length;

    const low = data.filter(
      (p) =>
        Number(
          p.hazardScore ??
            p.hazard_score ??
            0
        ) < 40
    ).length;

    return {
      total: data.length,
      critical,
      high,
      medium,
      low,
    };
  }, [points]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* HEADER */}

      <div>
        <p className="text-sm text-cyan-300">
          Geospatial intelligence
        </p>

        <h1 className="text-3xl font-semibold">
          Marine Map
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          AI-generated marine debris hazard
          heatmap and geolocated anomaly
          detections.
        </p>
      </div>

      {/* FILTERS */}

      <div className="flex flex-wrap items-center gap-2">

        <select
          value={
            filter.classification
          }
          onChange={(e) =>
            setFilter({
              ...filter,
              classification:
                e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-[#0b202c] px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
        >
          <option value="">
            All classes
          </option>

          <option value="ghost_net">
            Ghost nets
          </option>

          <option value="shipwreck">
            Shipwrecks
          </option>

          <option value="pipe">
            Pipes
          </option>

          <option value="cylinder">
            Cylinders
          </option>

          <option value="metal_debris">
            Metal debris
          </option>

          <option value="other_debris">
            Other debris
          </option>

          <option value="natural_formation">
            Natural formations
          </option>
        </select>

        <select
          value={
            filter.riskLevel
          }
          onChange={(e) =>
            setFilter({
              ...filter,
              riskLevel:
                e.target.value,
            })
          }
          className="rounded-xl border border-white/10 bg-[#0b202c] px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
        >
          <option value="">
            All risk
          </option>

          <option value="LOW">
            LOW
          </option>

          <option value="MEDIUM">
            MEDIUM
          </option>

          <option value="HIGH">
            HIGH
          </option>

          <option value="CRITICAL">
            CRITICAL
          </option>
        </select>

        <button
          type="button"
          onClick={() =>
            setShowHeatmap(
              (value) => !value
            )
          }
          className={`rounded-xl border px-4 py-2 text-sm transition ${
            showHeatmap
              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
              : "border-white/10 bg-white/5 text-slate-500"
          }`}
        >
          {showHeatmap
            ? "Heatmap On"
            : "Heatmap Off"}
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* MAP + PANEL */}

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

        {/* MAP */}

        <div className="relative h-[620px] overflow-hidden rounded-2xl border border-white/10">

          <MapContainer
            center={center}
            zoom={5}
            scrollWheelZoom
            className="h-full w-full"
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* HEATMAP */}

            {showHeatmap && (
              <HeatmapLayer
                points={points}
              />
            )}

            {/* INDIVIDUAL DETECTION MARKERS */}

            {points?.map(
              (point, index) => {
                const latitude =
                  Number(
                    point.latitude
                  );

                const longitude =
                  Number(
                    point.longitude
                  );

                if (
                  !Number.isFinite(
                    latitude
                  ) ||
                  !Number.isFinite(
                    longitude
                  )
                ) {
                  return null;
                }

                const hazardScore =
                  Number(
                    point.hazardScore ??
                      point.hazard_score ??
                      0
                  );

                const color =
                  markerColor(
                    hazardScore
                  );

                return (
                  <CircleMarker
                    key={`${latitude}-${longitude}-${index}`}
                    center={[
                      latitude,
                      longitude,
                    ]}
                    radius={
                      5 +
                      Math.round(
                        hazardScore /
                          20
                      )
                    }
                    pathOptions={{
                      color,
                      fillColor:
                        color,
                      fillOpacity:
                        0.85,
                      weight: 2,
                    }}
                  >

                    <Popup>

                      <div className="min-w-48">

                        <div className="font-semibold capitalize">
                          {(
                            point.classification ||
                            point.class ||
                            "Unknown"
                          ).replaceAll(
                            "_",
                            " "
                          )}
                        </div>

                        <div className="mt-2 text-xs">
                          Hazard:{" "}
                          <strong>
                            {Number.isFinite(
                              hazardScore
                            )
                              ? hazardScore.toFixed(
                                  1
                                )
                              : "—"}
                          </strong>
                          /100
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {latitude.toFixed(
                            5
                          )}
                          ,{" "}
                          {longitude.toFixed(
                            5
                          )}
                        </div>

                        {point.riskLevel && (
                          <div className="mt-2 text-xs font-medium">
                            Risk:{" "}
                            {point.riskLevel}
                          </div>
                        )}

                      </div>

                    </Popup>

                  </CircleMarker>
                );
              }
            )}

          </MapContainer>

          {/* MAP STATUS */}

          <div className="absolute left-4 top-4 z-[1000] rounded-xl border border-white/10 bg-[#071923]/90 px-4 py-3 shadow-xl backdrop-blur">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />

              <span className="text-xs font-medium text-white">
                MarineGuard AI
              </span>

            </div>

            <p className="mt-1 text-[10px] text-slate-500">
              {showHeatmap
                ? "Hazard intensity heatmap"
                : "Detection markers"}
            </p>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[#071923]/30 backdrop-blur-[2px]">

              <div className="rounded-xl border border-white/10 bg-[#071923]/90 px-5 py-4 text-sm text-slate-300 shadow-xl">
                Loading marine intelligence...
              </div>

            </div>
          )}

        </div>

        {/* SIDE PANEL */}

        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">

          <h2 className="font-semibold">
            Marine hazard heatmap
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Brighter areas indicate higher
            aggregated hazard intensity from
            geolocated AI detections.
          </p>

          {/* STATS */}

          <div className="mt-5 grid grid-cols-2 gap-2">

            <Stat
              label="Total"
              value={stats.total}
            />

            <Stat
              label="Critical"
              value={stats.critical}
            />

            <Stat
              label="High"
              value={stats.high}
            />

            <Stat
              label="Medium"
              value={stats.medium}
            />

          </div>

          {/* LEGEND */}

          <div className="mt-6 border-t border-white/10 pt-5">

            <h3 className="text-sm font-medium">
              Hazard intensity
            </h3>

            <div className="mt-4 space-y-3">

              <Legend
                label="Low"
                color="#34d399"
              />

              <Legend
                label="Medium"
                color="#fbbf24"
              />

              <Legend
                label="High"
                color="#fb923c"
              />

              <Legend
                label="Critical"
                color="#fb7185"
              />

            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/[.035] p-3">

            <p className="text-[11px] leading-relaxed text-slate-500">
              Heat intensity is calculated from
              the AI hazard score. Only detections
              with valid geolocation are included.
              No coordinates are fabricated.
            </p>

          </div>

          <div className="mt-4 text-xs text-slate-600">
            {loading
              ? "Updating..."
              : `${stats.total} geolocated detection${
                  stats.total === 1
                    ? ""
                    : "s"
                }`}
          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// STAT
// ============================================================

function Stat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-black/10 p-3">

      <div className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// LEGEND
// ============================================================

function Legend({
  label,
  color,
}) {
  return (
    <div className="flex items-center gap-3 text-sm">

      <span
        className="h-3 w-3 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />

      <span className="text-slate-400">
        {label}
      </span>

    </div>
  );
}