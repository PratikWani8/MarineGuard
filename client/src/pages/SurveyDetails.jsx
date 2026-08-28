import { useEffect, useState, useCallback } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Play,
  FileImage,
  Loader2,
} from "lucide-react";

import {
  getSurvey,
  uploadFrame,
  analyzeSurvey,
} from "../services/surveyApi";

import Loading from "../components/common/Loading";
import { formatDate } from "../utils/format";
import { useSocket } from "../hooks/useSocket";

export default function SurveyDetails() {
  const { surveyId } = useParams();
  const nav = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [file, setFile] = useState(null);

  const [meta, setMeta] = useState({
    frame_id: "",
    latitude: "",
    longitude: "",
    heading: "",
    depth: "",
    sonar_range_m: "50",
    pixel_resolution_m: "0.05",
    side: "unknown",
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    connected,
    events,
  } = useSocket(surveyId);

  // ==========================================================
  // LOAD SURVEY
  // ==========================================================

  const load = useCallback(
    async () => {
      if (!surveyId) {
        setError("Survey ID is missing.");
        return;
      }

      try {
        setError("");

        const response =
          await getSurvey(surveyId);

        const data =
          response?.data?.data ??
          response?.data ??
          null;

        setSurvey(data);

      } catch (err) {
        console.error(
          "Failed to load survey:",
          err
        );

        setError(
          err?.userMessage ||
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to load survey"
        );
      }
    },
    [surveyId]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchSurvey() {
      if (!surveyId) {
        return;
      }

      try {
        setError("");

        const response =
          await getSurvey(surveyId);

        if (cancelled) {
          return;
        }

        const data =
          response?.data?.data ??
          response?.data ??
          null;

        setSurvey(data);

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load survey:",
          err
        );

        setError(
          err?.userMessage ||
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to load survey"
        );
      }
    }

    fetchSurvey();

    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  // ==========================================================
  // REFRESH ON SOCKET EVENTS
  // ==========================================================

  useEffect(() => {
    if (!events?.length) {
      return;
    }

    const hasAnalysisEvent =
      events.some((event) =>
        [
          "analysis:completed",
          "detection:created",
        ].includes(event?.type)
      );

    if (hasAnalysisEvent) {
      load();
    }
  }, [events, load]);

  // ==========================================================
  // METADATA UPDATE
  // ==========================================================

  function updateMeta(
    key,
    value
  ) {
    setMeta((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ==========================================================
  // VALIDATE
  // ==========================================================

  function validate() {
    if (!surveyId) {
      setError(
        "Survey ID is missing."
      );

      return false;
    }

    if (!file) {
      setError(
        "Choose a sonar image."
      );

      return false;
    }

    if (
      meta.frame_id === "" ||
      !Number.isInteger(
        Number(meta.frame_id)
      ) ||
      Number(meta.frame_id) < 0
    ) {
      setError(
        "Frame ID must be a non-negative integer."
      );

      return false;
    }

    if (
      meta.latitude !== "" &&
      (
        !Number.isFinite(
          Number(meta.latitude)
        ) ||
        Number(meta.latitude) < -90 ||
        Number(meta.latitude) > 90
      )
    ) {
      setError(
        "Latitude must be between -90 and 90."
      );

      return false;
    }

    if (
      meta.longitude !== "" &&
      (
        !Number.isFinite(
          Number(meta.longitude)
        ) ||
        Number(meta.longitude) < -180 ||
        Number(meta.longitude) > 180
      )
    ) {
      setError(
        "Longitude must be between -180 and 180."
      );

      return false;
    }

    if (
      meta.heading !== "" &&
      (
        !Number.isFinite(
          Number(meta.heading)
        ) ||
        Number(meta.heading) < 0 ||
        Number(meta.heading) >= 360
      )
    ) {
      setError(
        "Heading must be between 0 and 359.99 degrees."
      );

      return false;
    }

    if (
      meta.depth !== "" &&
      (
        !Number.isFinite(
          Number(meta.depth)
        ) ||
        Number(meta.depth) < 0
      )
    ) {
      setError(
        "Depth must be a valid non-negative number."
      );

      return false;
    }

    if (
      meta.sonar_range_m !== "" &&
      (
        !Number.isFinite(
          Number(meta.sonar_range_m)
        ) ||
        Number(meta.sonar_range_m) <= 0
      )
    ) {
      setError(
        "Sonar range must be greater than 0."
      );

      return false;
    }

    if (
      meta.pixel_resolution_m !== "" &&
      (
        !Number.isFinite(
          Number(meta.pixel_resolution_m)
        ) ||
        Number(meta.pixel_resolution_m) <= 0
      )
    ) {
      setError(
        "Pixel resolution must be greater than 0."
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // UPLOAD + ANALYZE
  // ==========================================================

  async function submit(e) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      // ------------------------------------------------------
      // IMPORTANT:
      // FastAPI requires survey_id + frame_id.
      // FastAPI expects depth_m, not depth.
      // ------------------------------------------------------

      const payload = {
        survey_id: String(
          surveyId
        ).trim(),

        frame_id:
          Number.parseInt(
            meta.frame_id,
            10
          ),

        side:
          meta.side === "unknown"
            ? null
            : meta.side,
      };

      // ------------------------------------------------------
      // Optional numeric metadata
      // ------------------------------------------------------

      if (meta.latitude !== "") {
        payload.latitude =
          Number(meta.latitude);
      }

      if (meta.longitude !== "") {
        payload.longitude =
          Number(meta.longitude);
      }

      if (meta.heading !== "") {
        payload.heading =
          Number(meta.heading);
      }

      // IMPORTANT:
      // Backend field is depth_m
      if (meta.depth !== "") {
        payload.depth_m =
          Number(meta.depth);
      }

      if (meta.sonar_range_m !== "") {
        payload.sonar_range_m =
          Number(
            meta.sonar_range_m
          );
      }

      if (
        meta.pixel_resolution_m !== ""
      ) {
        payload.pixel_resolution_m =
          Number(
            meta.pixel_resolution_m
          );
      }

      console.log(
        "MarineGuard frame metadata:",
        payload
      );

      // ------------------------------------------------------
      // Upload
      // ------------------------------------------------------

      const response =
        await uploadFrame(
          surveyId,
          file,
          payload
        );

      const responseData =
        response?.data?.data ??
        response?.data ??
        {};

      const detections =
        responseData?.detections ||
        responseData?.analysis
          ?.detections ||
        [];

      setMessage(
        `Frame analyzed: ${
          detections.length
        } detections`
      );

      setFile(null);

      if (
        responseData?.frameId ||
        responseData?.frame?.frameId
      ) {
        // Give backend/socket time to
        // update before refreshing.
        setTimeout(() => {
          load();
        }, 500);
      } else {
        load();
      }

    } catch (err) {
      console.error(
        "Frame upload failed:",
        err
      );

      console.error(
        "Backend response:",
        err?.response?.data
      );

      setError(
        err?.userMessage ||
        err?.response?.data?.detail?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        "Upload or AI analysis failed"
      );

    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // BATCH ANALYSIS
  // ==========================================================

  async function start() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response =
        await analyzeSurvey(
          surveyId
        );

      const data =
        response?.data?.data ??
        response?.data ??
        {};

      setMessage(
        `Batch analysis started: ${
          data?.jobId ||
          data?.job_id ||
          "processing"
        }`
      );

    } catch (err) {
      console.error(
        "Batch analysis failed:",
        err
      );

      setError(
        err?.userMessage ||
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        "Could not start analysis"
      );

    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!survey && !error) {
    return <Loading />;
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* BACK */}

      <button
        onClick={() =>
          nav("/surveys")
        }
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to surveys
      </button>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {survey && (
        <>
          {/* HEADER */}

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-xs text-cyan-300">
                {survey.surveyId}
              </p>

              <h1 className="mt-1 text-3xl font-semibold">
                {survey.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {survey.description ||
                  "No description"}{" "}
                · Created{" "}
                {formatDate(
                  survey.createdAt
                )}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <span
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  connected
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {connected
                  ? "Live"
                  : "Offline"}{" "}
                analysis stream
              </span>

              <button
                onClick={start}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Play size={16} />
                )}

                Analyze all
              </button>

              <Link
                to={`/analysis/new?survey=${encodeURIComponent(
                  surveyId
                )}`}
                className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-ocean-950"
              >
                <Upload size={16} />
                Analysis view
              </Link>

            </div>

          </div>

          {/* CONTENT */}

          <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">

            {/* UPLOAD */}

            <form
              onSubmit={submit}
              className="rounded-2xl border border-white/10 bg-white/[.035] p-5"
            >

              <h2 className="font-semibold">
                Upload sonar frame
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                The backend sends the image to
                FastAPI; the browser never calls
                port 8000.
              </p>

              {/* FILE */}

              <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/[.025] p-8 text-center hover:bg-cyan-400/[.05]">

                <FileImage className="text-cyan-300" />

                <span className="mt-3 text-sm">
                  {file
                    ? file.name
                    : "Choose PNG, JPG, JPEG, TIFF or WebP"}
                </span>

                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.tif,.tiff,.webp,image/*"
                  className="hidden"
                  onChange={(e) =>
                    setFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

              </label>

              {/* METADATA */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                {[
                  [
                    "frame_id",
                    "Frame ID",
                  ],
                  [
                    "latitude",
                    "Latitude",
                  ],
                  [
                    "longitude",
                    "Longitude",
                  ],
                  [
                    "heading",
                    "Heading",
                  ],
                  [
                    "depth",
                    "Depth (m)",
                  ],
                  [
                    "sonar_range_m",
                    "Sonar range (m)",
                  ],
                  [
                    "pixel_resolution_m",
                    "Pixel resolution (m)",
                  ],
                ].map(
                  ([key, label]) => (
                    <input
                      key={key}
                      required={
                        key ===
                        "frame_id"
                      }
                      type={
                        [
                          "frame_id",
                          "latitude",
                          "longitude",
                          "heading",
                          "depth",
                          "sonar_range_m",
                          "pixel_resolution_m",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      step="any"
                      value={
                        meta[key]
                      }
                      onChange={(e) =>
                        updateMeta(
                          key,
                          e.target.value
                        )
                      }
                      className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/40"
                      placeholder={
                        label
                      }
                    />
                  )
                )}

                <select
                  value={meta.side}
                  onChange={(e) =>
                    updateMeta(
                      "side",
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-white/10 bg-[#0b202c] px-3 py-2.5 text-sm outline-none focus:border-cyan-400/40"
                >
                  <option value="unknown">
                    Side unknown
                  </option>

                  <option value="port">
                    Port
                  </option>

                  <option value="starboard">
                    Starboard
                  </option>
                </select>

              </div>

              {/* MESSAGE */}

              {message && (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={busy}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-ocean-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {busy
                  ? "Uploading & analyzing..."
                  : "Upload & analyze frame"}
              </button>

            </form>

            {/* TELEMETRY */}

            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">

              <h2 className="font-semibold">
                Survey telemetry
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {[
                  [
                    "Frames",
                    survey.stats?.frames ||
                      0,
                  ],
                  [
                    "Detections",
                    survey.stats?.detections ||
                      0,
                  ],
                  [
                    "Critical",
                    survey.stats
                      ?.criticalDetections ||
                      0,
                  ],
                  [
                    "Ghost nets",
                    survey.stats
                      ?.ghostNets ||
                      0,
                  ],
                ].map(
                  ([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-black/10 p-4"
                    >
                      <div className="text-xs text-slate-500">
                        {label}
                      </div>

                      <div className="mt-1 text-xl font-semibold">
                        {value}
                      </div>
                    </div>
                  )
                )}

              </div>

              {/* LIVE EVENTS */}

              <div className="mt-6 border-t border-white/10 pt-5">

                <h3 className="text-sm font-medium">
                  Recent stream
                </h3>

                <div className="mt-3 max-h-80 space-y-2 overflow-auto scrollbar-thin">

                  {events?.length ? (
                    events
                      .slice()
                      .reverse()
                      .map(
                        (event, index) => (
                          <div
                            key={
                              `${event?.type || "event"}-${index}`
                            }
                            className="rounded-xl border border-white/5 bg-black/10 p-3 text-xs"
                          >

                            <div className="text-cyan-300">
                              {
                                event?.type
                              }
                            </div>

                            <pre className="mt-1 overflow-auto text-slate-500">
                              {JSON.stringify(
                                event?.payload,
                                null,
                                2
                              )}
                            </pre>

                          </div>
                        )
                      )
                  ) : (
                    <p className="text-sm text-slate-600">
                      No live events yet.
                    </p>
                  )}

                </div>

              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}