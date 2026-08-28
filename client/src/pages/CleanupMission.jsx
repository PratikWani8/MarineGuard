import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Compass,
  Crosshair,
  Gauge,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  Route,
  ShieldAlert,
  Target,
  Waves,
  X,
} from "lucide-react";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { planMission } from "../services/missionApi";
import { getSurveys } from "../services/surveyApi";
import { getDetections } from "../services/detectionApi";


// ============================================================
// MAP AUTO FIT
// ============================================================

function FitRoute({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length < 2) {
      return;
    }

    map.fitBounds(coords, {
      padding: [50, 50],
    });
  }, [map, coords]);

  return null;
}


// ============================================================
// RISK COLOR
// ============================================================

function riskColor(score) {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "#fb7185";
  }

  if (value >= 60) {
    return "#fb923c";
  }

  if (value >= 40) {
    return "#fbbf24";
  }

  return "#34d399";
}


// ============================================================
// RISK LABEL
// ============================================================

function riskLabel(score) {
  const value = Number(score) || 0;

  if (value >= 80) {
    return "CRITICAL";
  }

  if (value >= 60) {
    return "HIGH";
  }

  if (value >= 40) {
    return "MEDIUM";
  }

  return "LOW";
}


// ============================================================
// CLASSIFICATION FORMATTER
// ============================================================

function formatClass(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}


// ============================================================
// TARGET COORDINATES
// ============================================================

function getTargetCoordinates(target) {
  const latitude = Number(
    target?.location?.latitude ??
      target?.latitude
  );

  const longitude = Number(
    target?.location?.longitude ??
      target?.longitude
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return [
    latitude,
    longitude,
  ];
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CleanupMission() {
  const [surveys, setSurveys] =
    useState([]);

  const [surveyId, setSurveyId] =
    useState("");

  const [start, setStart] =
    useState({
      latitude: "",
      longitude: "",
    });

  const [detections, setDetections] =
    useState([]);

  const [selected, setSelected] =
    useState([]);

  const [result, setResult] =
    useState(null);

  const [busy, setBusy] =
    useState(false);

  const [loadingSurveys, setLoadingSurveys] =
    useState(true);

  const [loadingTargets, setLoadingTargets] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // ==========================================================
  // LOAD SURVEYS
  // ==========================================================

  useEffect(() => {
    async function loadSurveys() {
      try {
        setLoadingSurveys(true);
        setError("");

        const response =
          await getSurveys();

        const data =
          response?.data?.data ||
          response?.data ||
          [];

        setSurveys(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {
        setError(
          err?.userMessage ||
            "Failed to load surveys."
        );
      } finally {
        setLoadingSurveys(false);
      }
    }

    loadSurveys();
  }, []);


  // ==========================================================
  // LOAD DETECTIONS
  // ==========================================================

  useEffect(() => {
    if (!surveyId) {
      setDetections([]);
      setSelected([]);
      setResult(null);
      return;
    }

    async function loadDetections() {
      try {
        setLoadingTargets(true);
        setError("");
        setResult(null);

        const response =
          await getDetections({
            surveyId,
            riskLevel: "HIGH",
            limit: 100,
          });

        const data =
          response?.data?.data;

        const items =
          data?.items ||
          data ||
          response?.data?.items ||
          [];

        const validTargets =
          Array.isArray(items)
            ? items.filter(
                (item) =>
                  getTargetCoordinates(
                    item
                  ) !== null
              )
            : [];

        setDetections(
          validTargets
        );

        setSelected([]);

      } catch (err) {
        setDetections([]);

        setError(
          err?.userMessage ||
            "Failed to load geolocated targets."
        );
      } finally {
        setLoadingTargets(false);
      }
    }

    loadDetections();
  }, [surveyId]);


  // ==========================================================
  // VALID START LOCATION
  // ==========================================================

  const validStart = useMemo(() => {
    const latitude =
      Number(start.latitude);

    const longitude =
      Number(start.longitude);

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }, [start]);


  // ==========================================================
  // TOGGLE TARGET
  // ==========================================================

  function toggleTarget(
    detectionId
  ) {
    setSelected((current) =>
      current.includes(
        detectionId
      )
        ? current.filter(
            (id) =>
              id !== detectionId
          )
        : [
            ...current,
            detectionId,
          ]
    );

    setResult(null);
    setMessage("");
  }


  // ==========================================================
  // SELECT ALL
  // ==========================================================

  function selectAll() {
    setSelected(
      detections
        .map(
          (item) =>
            item.detectionId
        )
        .filter(Boolean)
    );

    setResult(null);
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  function clearSelection() {
    setSelected([]);
    setResult(null);
    setMessage("");
  }


  // ==========================================================
  // GENERATE ROUTE
  // ==========================================================

  async function submit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setResult(null);

    if (!surveyId) {
      setError(
        "Please select a survey."
      );
      return;
    }

    if (!validStart) {
      setError(
        "Enter a valid AUV starting latitude and longitude."
      );
      return;
    }

    if (!selected.length) {
      setError(
        "Select at least one cleanup target."
      );
      return;
    }

    try {
      setBusy(true);

      const response =
        await planMission({
          surveyId,

          start: {
            latitude:
              Number(
                start.latitude
              ),

            longitude:
              Number(
                start.longitude
              ),
          },

          targetDetectionIds:
            selected,
        });

      console.log(
        "MISSION RESPONSE:",
        response?.data
      );

      // -------------------------------------------------------
      // Backend may return:
      //
      // {
      //   data: {
      //      ordered_targets: [],
      //      total_distance_km: 1.2,
      //      estimated_duration_minutes: 15,
      //      priority_score: 200,
      //      target_count: 3
      //   }
      // }
      //
      // -------------------------------------------------------

      const raw =
        response?.data?.data ??
        response?.data ??
        {};

      const mission =
        raw.route ||
        raw.result ||
        raw.mission ||
        raw;

      console.log(
        "NORMALIZED MISSION:",
        mission
      );

      setResult(
        mission
      );

      setMessage(
        "Cleanup route generated successfully."
      );

    } catch (err) {
      console.error(
        "MISSION ERROR:",
        err
      );

      setError(
        err?.userMessage ||
          err?.response?.data?.message ||
          "Route planning failed."
      );
    } finally {
      setBusy(false);
    }
  }


  // ==========================================================
  // ROUTE TARGETS
  //
  // Python backend uses:
  //
  // ordered_targets
  //
  // ==========================================================

  const routeTargets =
    result?.ordered_targets ||
    result?.orderedTargets ||
    result?.targets ||
    result?.route?.ordered_targets ||
    result?.route?.orderedTargets ||
    result?.route?.targets ||
    [];


  // ==========================================================
  // ROUTE COORDINATES
  // ==========================================================

  const routeCoordinates =
    Array.isArray(routeTargets)
      ? routeTargets
          .map(
            (target) =>
              getTargetCoordinates(
                target
              )
          )
          .filter(Boolean)
      : [];


  // ==========================================================
  // START COORDINATES
  // ==========================================================

  const startCoordinates =
    validStart
      ? [
          Number(
            start.latitude
          ),
          Number(
            start.longitude
          ),
        ]
      : null;


  // ==========================================================
  // MAP COORDINATES
  // ==========================================================

  const mapCoordinates =
    startCoordinates
      ? [
          startCoordinates,
          ...routeCoordinates,
        ]
      : routeCoordinates;


  // ==========================================================
  // SELECTED TARGETS
  // ==========================================================

  const selectedTargets =
    detections.filter(
      (item) =>
        selected.includes(
          item.detectionId
        )
    );


  // ==========================================================
  // AVERAGE RISK
  // ==========================================================

  const averageRisk =
    selectedTargets.length
      ? Math.round(
          selectedTargets.reduce(
            (sum, target) =>
              sum +
              Number(
                target.hazardScore ||
                  0
              ),
            0
          ) /
            selectedTargets.length
        )
      : 0;


  // ==========================================================
  // BACKEND RESULT VALUES
  //
  // Python route planner returns:
  //
  // total_distance_km
  // estimated_duration_minutes
  // priority_score
  // target_count
  // ==========================================================

  const missionDistance =
    result?.total_distance_km ??
    result?.totalDistanceKm ??
    result?.route?.total_distance_km ??
    result?.route?.totalDistanceKm ??
    0;


  const missionDuration =
    result?.estimated_duration_minutes ??
    result?.estimatedDurationMinutes ??
    result?.route?.estimated_duration_minutes ??
    result?.route?.estimatedDurationMinutes ??
    0;


  const missionPriority =
    result?.priority_score ??
    result?.priorityScore ??
    result?.route?.priority_score ??
    result?.route?.priorityScore ??
    0;


  const missionTargetCount =
    result?.target_count ??
    result?.targetCount ??
    routeTargets.length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div>

          <div className="flex items-center gap-2 text-sm text-cyan-300">

            <Waves size={16} />

            AUV operations

          </div>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Cleanup Mission
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Build an optimized underwater
            cleanup route using geolocated
            high-risk marine anomalies.
          </p>

        </div>

        <div className="flex items-center gap-2">

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">

            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            Mission planner online

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">

          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">

          <Check size={18} />

          {message}

        </div>
      )}


      {/* ================================================== */}
      {/* MAIN GRID */}
      {/* ================================================== */}

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">


        {/* ================================================= */}
        {/* CONTROL PANEL */}
        {/* ================================================= */}

        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-white/[.035] p-5"
        >

          {/* Survey */}

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">

                <Route size={15} />

              </div>

              <div>

                <h2 className="text-sm font-semibold">
                  Mission configuration
                </h2>

                <p className="text-[11px] text-slate-600">
                  Select survey and AUV position
                </p>

              </div>

            </div>


            <select
              required
              value={surveyId}
              disabled={
                loadingSurveys
              }
              onChange={(event) => {

                setSurveyId(
                  event.target.value
                );

                setSelected([]);
                setResult(null);
                setMessage("");

              }}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b202c] px-3 py-3 text-sm outline-none focus:border-cyan-400/40"
            >

              <option value="">
                {loadingSurveys
                  ? "Loading surveys..."
                  : "Select survey"}
              </option>

              {surveys.map(
                (survey) => (
                  <option
                    key={
                      survey.surveyId
                    }
                    value={
                      survey.surveyId
                    }
                  >
                    {survey.name} —{" "}
                    {
                      survey.surveyId
                    }
                  </option>
                )
              )}

            </select>

          </div>


          {/* AUV LOCATION */}

          <div className="mt-5">

            <div className="mb-2 flex items-center gap-2">

              <Crosshair
                size={15}
                className="text-cyan-300"
              />

              <span className="text-xs font-medium">
                AUV starting position
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <input
                required
                type="number"
                step="any"
                value={
                  start.latitude
                }
                onChange={(event) =>
                  setStart({
                    ...start,
                    latitude:
                      event.target.value,
                  })
                }
                placeholder="Latitude"
                className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm outline-none focus:border-cyan-400/40"
              />

              <input
                required
                type="number"
                step="any"
                value={
                  start.longitude
                }
                onChange={(event) =>
                  setStart({
                    ...start,
                    longitude:
                      event.target.value,
                  })
                }
                placeholder="Longitude"
                className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm outline-none focus:border-cyan-400/40"
              />

            </div>

            {start.latitude &&
              start.longitude &&
              !validStart && (
                <p className="mt-2 text-[11px] text-rose-300">
                  Enter valid GPS coordinates.
                </p>
              )}

          </div>


          {/* TARGET HEADER */}

          <div className="mt-6 flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Target
                  size={15}
                  className="text-rose-300"
                />

                <span className="text-sm font-medium">
                  Cleanup targets
                </span>

              </div>

              <p className="mt-1 text-[11px] text-slate-600">
                High-risk geolocated anomalies
              </p>

            </div>


            <div className="flex gap-1">

              <button
                type="button"
                onClick={
                  selectAll
                }
                disabled={
                  !detections.length
                }
                className="rounded-lg px-2 py-1 text-[10px] text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-30"
              >
                Select all
              </button>

              <button
                type="button"
                onClick={
                  clearSelection
                }
                disabled={
                  !selected.length
                }
                className="rounded-lg px-2 py-1 text-[10px] text-slate-500 hover:bg-white/5 disabled:opacity-30"
              >
                Clear
              </button>

            </div>

          </div>


          {/* TARGET LIST */}

          <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">

            {loadingTargets && (
              <div className="flex items-center justify-center rounded-xl border border-white/5 bg-black/10 p-8">

                <RefreshCw
                  size={18}
                  className="animate-spin text-cyan-300"
                />

                <span className="ml-2 text-xs text-slate-500">
                  Loading targets...
                </span>

              </div>
            )}


            {!loadingTargets &&
              detections.map(
                (detection) => {

                  const checked =
                    selected.includes(
                      detection.detectionId
                    );

                  const score =
                    Number(
                      detection.hazardScore ||
                        0
                    );

                  const color =
                    riskColor(
                      score
                    );

                  const coords =
                    getTargetCoordinates(
                      detection
                    );

                  return (
                    <label
                      key={
                        detection.detectionId
                      }
                      className={`group flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                        checked
                          ? "border-cyan-400/30 bg-cyan-400/[.07]"
                          : "border-white/5 bg-black/10 hover:border-white/10 hover:bg-white/[.03]"
                      }`}
                    >

                      <div className="pt-0.5">

                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          onChange={() =>
                            toggleTarget(
                              detection.detectionId
                            )
                          }
                          className="h-4 w-4 accent-cyan-400"
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                color,
                            }}
                          />

                          <span className="truncate text-sm font-medium capitalize">
                            {formatClass(
                              detection.classification
                            )}
                          </span>

                        </div>


                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">

                          {coords && (
                            <span>
                              {coords[0].toFixed(
                                3
                              )}
                              ,{" "}
                              {coords[1].toFixed(
                                3
                              )}
                            </span>
                          )}

                          {detection.confidence !=
                            null && (
                            <>
                              <span>
                                •
                              </span>

                              <span>
                                {Math.round(
                                  Number(
                                    detection.confidence
                                  )
                                )}
                                % confidence
                              </span>
                            </>
                          )}

                        </div>

                      </div>


                      <div className="text-right">

                        <div
                          className="text-sm font-semibold"
                          style={{
                            color,
                          }}
                        >
                          {score}
                        </div>

                        <div
                          className="text-[9px]"
                          style={{
                            color,
                          }}
                        >
                          {riskLabel(
                            score
                          )}
                        </div>

                      </div>

                    </label>
                  );
                }
              )}


            {!loadingTargets &&
              surveyId &&
              !detections.length && (
                <div className="rounded-xl border border-white/5 bg-black/10 p-6 text-center">

                  <Target
                    size={24}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    No high-risk geolocated
                    targets found.
                  </p>

                </div>
              )}

          </div>


          {/* STATS */}

          <div className="mt-4 grid grid-cols-3 gap-2">

            <MiniStat
              icon={Target}
              label="Selected"
              value={
                selected.length
              }
            />

            <MiniStat
              icon={ShieldAlert}
              label="Avg risk"
              value={
                averageRisk
                  ? averageRisk
                  : "—"
              }
            />

            <MiniStat
              icon={MapPin}
              label="Located"
              value={
                detections.length
              }
            />

          </div>


          {/* GENERATE */}

          <button
            type="submit"
            disabled={
              busy ||
              !selected.length ||
              !validStart
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 text-sm font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {busy ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />

                Planning route...
              </>
            ) : (
              <>
                <Play size={17} />

                Generate cleanup route

                <ChevronRight
                  size={16}
                />
              </>
            )}

          </button>

        </form>


        {/* ================================================= */}
        {/* MAP */}
        {/* ================================================= */}

        <div className="relative h-[700px] overflow-hidden rounded-2xl border border-white/10">

          <MapContainer
            center={[
              15,
              76,
            ]}
            zoom={5}
            scrollWheelZoom
            className="h-full w-full"
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* AUTO FIT */}

            {mapCoordinates.length >
              1 && (
              <FitRoute
                coords={
                  mapCoordinates
                }
              />
            )}


            {/* SELECTED TARGETS */}

            {selectedTargets.map(
              (target) => {

                const coords =
                  getTargetCoordinates(
                    target
                  );

                if (!coords) {
                  return null;
                }

                const score =
                  Number(
                    target.hazardScore ||
                      0
                  );

                const color =
                  riskColor(
                    score
                  );

                return (
                  <CircleMarker
                    key={
                      `selected-${target.detectionId}`
                    }
                    center={
                      coords
                    }
                    radius={9}
                    pathOptions={{
                      color,
                      fillColor:
                        color,
                      fillOpacity:
                        0.65,
                      weight: 2,
                    }}
                  >

                    <Popup>

                      <div className="min-w-44">

                        <div className="font-semibold capitalize">
                          {formatClass(
                            target.classification
                          )}
                        </div>

                        <div
                          className="mt-1 text-sm font-semibold"
                          style={{
                            color,
                          }}
                        >
                          Hazard{" "}
                          {score}/100
                        </div>

                        <div className="text-xs text-slate-500">
                          {coords[0].toFixed(
                            5
                          )}
                          ,{" "}
                          {coords[1].toFixed(
                            5
                          )}
                        </div>

                      </div>

                    </Popup>

                  </CircleMarker>
                );
              }
            )}


            {/* DOTTED ROUTE */}

            {routeCoordinates.length >
              0 && (
              <Polyline
                positions={
                  mapCoordinates
                }
                pathOptions={{
                  color:
                    "#22d3ee",

                  weight: 4,

                  opacity: 0.95,

                  // DOTTED ROUTE
                  dashArray:
                    "1 12",

                  lineCap:
                    "round",

                  lineJoin:
                    "round",
                }}
              />
            )}


            {/* AUV START */}

            {startCoordinates && (
              <CircleMarker
                center={
                  startCoordinates
                }
                radius={10}
                pathOptions={{
                  color:
                    "#ffffff",

                  fillColor:
                    "#22d3ee",

                  fillOpacity:
                    1,

                  weight: 3,
                }}
              >

                <Popup>

                  <div className="font-semibold">
                    AUV Start
                  </div>

                  <div className="mt-1 text-xs">
                    {startCoordinates[0].toFixed(
                      5
                    )}
                    ,{" "}
                    {startCoordinates[1].toFixed(
                      5
                    )}
                  </div>

                </Popup>

              </CircleMarker>
            )}


            {/* NUMBERED ROUTE TARGETS */}

            {routeTargets.map(
              (
                target,
                index
              ) => {

                const coords =
                  getTargetCoordinates(
                    target
                  );

                if (!coords) {
                  return null;
                }

                const score =
                  Number(
                    target?.hazard_score ??
                      target?.hazardScore ??
                      0
                  );

                const color =
                  riskColor(
                    score
                  );

                return (
                  <CircleMarker
                    key={
                      target?.detection_id ||
                      target?.detectionId ||
                      target?.track_id ||
                      target?.trackId ||
                      index
                    }
                    center={
                      coords
                    }
                    radius={8}
                    pathOptions={{
                      color:
                        "#ffffff",

                      fillColor:
                        color,

                      fillOpacity:
                        0.95,

                      weight: 2,
                    }}
                  >

                    <Popup>

                      <div className="min-w-48">

                        <div className="flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-ocean-950">
                            {index +
                              1}
                          </div>

                          <div className="font-semibold capitalize">
                            {formatClass(
                              target?.classification ||
                                target?.class
                            )}
                          </div>

                        </div>

                        <div className="mt-2 text-xs">
                          Hazard:{" "}

                          <strong
                            style={{
                              color,
                            }}
                          >
                            {score}
                          </strong>

                          /100
                        </div>

                        <div className="text-xs">
                          Risk:{" "}
                          {target?.risk_level ||
                            target?.riskLevel ||
                            riskLabel(
                              score
                            )}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {coords[0].toFixed(
                            5
                          )}
                          ,{" "}
                          {coords[1].toFixed(
                            5
                          )}
                        </div>

                      </div>

                    </Popup>

                  </CircleMarker>
                );
              }
            )}

          </MapContainer>


          {/* MAP HEADER */}

          <div className="absolute left-4 top-4 z-[1000] rounded-xl border border-white/10 bg-[#071923]/90 px-4 py-3 shadow-xl backdrop-blur">

            <div className="flex items-center gap-2">

              <Navigation
                size={15}
                className="text-cyan-300"
              />

              <span className="text-xs font-semibold">
                AUV Mission Route
              </span>

            </div>

            <div className="mt-1 text-[10px] text-slate-500">

              {routeCoordinates.length
                ? `${routeCoordinates.length} cleanup targets`
                : "Select targets to generate route"}

            </div>

          </div>


          {/* MAP LEGEND */}

          <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/10 bg-[#071923]/90 p-3 backdrop-blur">

            <div className="space-y-2 text-[10px]">

              <Legend
                color="#22d3ee"
                label="AUV route"
              />

              <Legend
                color="#fb7185"
                label="Critical"
              />

              <Legend
                color="#fb923c"
                label="High"
              />

              <Legend
                color="#fbbf24"
                label="Medium"
              />

            </div>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* MISSION RESULT */}
      {/* ================================================== */}

      {result && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[.035] p-5">

          {/* RESULT HEADER */}

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">

                <Compass size={20} />

              </div>

              <div>

                <h2 className="font-semibold">
                  Cleanup Route Generated
                </h2>

                <p className="text-xs text-slate-500">
                  AI-optimized AUV mission route
                </p>

              </div>

            </div>


            {result.missionId && (
              <div className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-slate-500">

                Mission:

                <span className="ml-1 text-cyan-300">
                  {result.missionId}
                </span>

              </div>
            )}

          </div>


          {/* ================================================= */}
          {/* RESULT CARDS */}
          {/* ================================================= */}

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">

            {/* ROUTE */}

            <ResultCard
              icon={Route}
              label="Route"
              value={
                routeTargets.length >
                0
                  ? "Ready"
                  : "No route"
              }
            />


            {/* DISTANCE */}

            <ResultCard
              icon={Navigation}
              label="Distance"
              value={`${Number(
                missionDistance
              ).toFixed(3)} km`}
            />


            {/* DURATION */}

            <ResultCard
              icon={Gauge}
              label="Estimated duration"
              value={`${Number(
                missionDuration
              ).toFixed(1)} min`}
            />


            {/* PRIORITY */}

            <ResultCard
              icon={ShieldAlert}
              label="Priority"
              value={`${Number(
                missionPriority
              ).toFixed(1)}`}
            />


            {/* TARGETS */}

            <ResultCard
              icon={Target}
              label="Targets"
              value={
                missionTargetCount
              }
            />

          </div>


          {/* ================================================= */}
          {/* ROUTE ORDER */}
          {/* ================================================= */}

          {routeTargets.length >
            0 && (
            <div className="mt-5 border-t border-white/10 pt-5">

              <div className="mb-3 flex items-center justify-between">

                <h3 className="text-sm font-medium">
                  Recommended cleanup order
                </h3>

                <span className="text-xs text-slate-600">
                  {
                    routeTargets.length
                  }{" "}
                  stops
                </span>

              </div>


              <div className="flex gap-3 overflow-x-auto pb-2">

                {routeTargets.map(
                  (
                    target,
                    index
                  ) => {

                    const score =
                      Number(
                        target?.hazard_score ??
                          target?.hazardScore ??
                          0
                      );

                    const color =
                      riskColor(
                        score
                      );

                    return (
                      <div
                        key={
                          target?.detection_id ||
                          target?.detectionId ||
                          target?.track_id ||
                          target?.trackId ||
                          index
                        }
                        className="min-w-[190px] rounded-xl border border-white/5 bg-black/10 p-3"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-xs font-bold text-ocean-950">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0">

                            <div className="truncate text-xs font-medium capitalize">
                              {formatClass(
                                target?.classification ||
                                  target?.class
                              )}
                            </div>

                            <div
                              className="mt-1 text-[10px]"
                              style={{
                                color,
                              }}
                            >
                              {target?.risk_level ||
                                target?.riskLevel ||
                                riskLabel(
                                  score
                                )}

                              {" · "}

                              {score}/100
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>
          )}


          {/* ================================================= */}
          {/* RAW ROUTE DETAILS */}
          {/* ================================================= */}

          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">

            <div className="rounded-xl bg-black/10 p-3">

              <div className="text-[10px] text-slate-600">
                Return to start
              </div>

              <div className="mt-1 text-sm font-medium">
                {result.return_to_start ??
                result.returnToStart
                  ? "Yes"
                  : "No"}
              </div>

            </div>


            <div className="rounded-xl bg-black/10 p-3">

              <div className="text-[10px] text-slate-600">
                Skipped targets
              </div>

              <div className="mt-1 text-sm font-medium">
                {result.skipped_target_count ??
                  result.skippedTargetCount ??
                  result.skipped_targets
                    ?.length ??
                  0}
              </div>

            </div>


            <div className="rounded-xl bg-black/10 p-3">

              <div className="text-[10px] text-slate-600">
                Return distance
              </div>

              <div className="mt-1 text-sm font-medium">
                {Number(
                  result.return_distance_km ??
                    result.returnDistanceKm ??
                    0
                ).toFixed(3)}{" "}
                km
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-3">

      <div className="flex items-center gap-2 text-[10px] text-slate-600">

        <Icon size={12} />

        {label}

      </div>

      <div className="mt-1 text-sm font-semibold">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// RESULT CARD
// ============================================================

function ResultCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-4">

      <div className="flex items-center gap-2 text-xs text-slate-500">

        <Icon
          size={14}
          className="text-cyan-300"
        />

        {label}

      </div>

      <div className="mt-2 text-lg font-semibold">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// LEGEND
// ============================================================

function Legend({
  color,
  label,
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor:
            color,
        }}
      />

      <span className="text-slate-400">
        {label}
      </span>

    </div>
  );
}