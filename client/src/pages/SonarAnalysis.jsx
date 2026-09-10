import {
  useEffect,
  useState
} from "react";

import {
  useSearchParams,
  Link
} from "react-router-dom";

import {
  ArrowLeft,
  RefreshCw,
  UploadCloud,
  ScanLine
} from "lucide-react";

import {
  getSurvey,
  getFrameImage
} from "../services/surveyApi";

import {
  getDetections
} from "../services/detectionApi";

import SonarViewer from "../components/sonar/SonarViewer";
import RiskBadge from "../components/detection/RiskBadge";
import Loading from "../components/common/Loading";

import { formatNumber } from "../utils/format";


/* =========================================================
   NORMALIZE DETECTION
========================================================= */

function normalizeDetection(
  detection
) {
  const bbox =
    detection?.boundingBox ??
    detection?.bounding_box ??
    detection?.bbox ??
    {};

  const confidenceRaw =
    Number(
      detection?.confidence ?? 0
    );

  const confidence =
    confidenceRaw <= 1
      ? confidenceRaw * 100
      : confidenceRaw;

  return {
    ...detection,

    detectionId:
      detection?.detectionId ??
      detection?.detection_id ??
      detection?._id,

    classification:
      detection?.classification ??
      detection?.class ??
      detection?.label ??
      "unknown",

    confidence,

    hazardScore:
      Number(
        detection?.hazardScore ??
        detection?.hazard_score ??
        0
      ),

    riskLevel:
      detection?.riskLevel ??
      detection?.risk_level ??
      "LOW",

    boundingBox: bbox,

    bbox
  };
}


/* =========================================================
   COMPONENT
========================================================= */

export default function SonarAnalysis() {
  const [params] =
    useSearchParams();

  const surveyId =
    params.get("survey");

  const frameId =
    params.get("frame");


  const [survey, setSurvey] =
    useState(null);

  const [detections, setDetections] =
    useState([]);

  const [imageUrl, setImageUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     LOAD ANALYSIS
  ========================================================= */

  async function loadAnalysis(
    isRefresh = false
  ) {
    if (
      !surveyId ||
      !frameId
    ) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");


      /* -----------------------------------------------------
         API REQUESTS
      ----------------------------------------------------- */

      const [
        surveyResponse,
        detectionResponse,
        imageResponse
      ] = await Promise.all([
        getSurvey(
          surveyId
        ),

        /*
         * IMPORTANT:
         * Request only the current frame.
         */
        getDetections({
          surveyId,
          frameId
        }),

        getFrameImage(
          surveyId,
          frameId
        )
      ]);


      /* -----------------------------------------------------
         SURVEY
      ----------------------------------------------------- */

      const surveyData =
        surveyResponse?.data?.data ??
        surveyResponse?.data ??
        null;


      /* -----------------------------------------------------
         DETECTIONS
      ----------------------------------------------------- */

      const detectionData =
        detectionResponse?.data?.data ??
        detectionResponse?.data ??
        {};

      console.log(
        "Detection API response:",
        detectionData
      );


      const rawItems =
        Array.isArray(
          detectionData
        )
          ? detectionData
          : detectionData?.items ??
            [];


      const normalized =
        rawItems.map(
          normalizeDetection
        );


      console.log(
        "Normalized detections:",
        normalized
      );


      /* -----------------------------------------------------
         IMAGE
      ----------------------------------------------------- */

      let nextImageUrl = "";

      if (
        imageResponse?.data
      ) {
        nextImageUrl =
          URL.createObjectURL(
            imageResponse.data
          );
      }


      /* -----------------------------------------------------
         UPDATE STATE
      ----------------------------------------------------- */

      setSurvey(
        surveyData
      );

      setDetections(
        normalized
      );


      setImageUrl(
        (previousUrl) => {
          if (
            previousUrl
          ) {
            URL.revokeObjectURL(
              previousUrl
            );
          }

          return nextImageUrl;
        }
      );

    } catch (err) {
      console.error(
        "Failed to load sonar analysis:",
        err
      );

      console.error(
        "Response:",
        err?.response?.data
      );


      setError(
        err?.response?.data
          ?.message ||
        err?.response?.data
          ?.error ||
        "Unable to load sonar analysis."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadAnalysis();

    return () => {
      setImageUrl(
        (previousUrl) => {
          if (
            previousUrl
          ) {
            URL.revokeObjectURL(
              previousUrl
            );
          }

          return "";
        }
      );
    };
  }, [
    surveyId,
    frameId
  ]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <Loading />;
  }


  /* =========================================================
     INVALID PARAMETERS
  ========================================================= */

  if (
    !surveyId ||
    !frameId
  ) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[.035] p-8">

        <p className="text-sm text-slate-400">
          Survey or frame ID is missing.
        </p>

      </div>
    );
  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-5">


      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        to={`/surveys/${encodeURIComponent(
          surveyId
        )}`}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft size={16} />

        Back to survey
      </Link>


      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-medium text-cyan-300">
            {survey?.surveyId ??
              surveyId}
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Sonar analysis
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Frame {frameId}
          </p>

        </div>


        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              loadAnalysis(true)
            }
            disabled={
              refreshing
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[.06] disabled:opacity-50"
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>


          <Link
            to={`/sss-upload?survey=${encodeURIComponent(
              surveyId
            )}`}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >

            <UploadCloud
              size={16}
            />

            Upload frame

          </Link>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">


        {/* SONAR VIEWER */}

        <SonarViewer
          src={imageUrl}
          detections={
            detections
          }
        />


        {/* DETECTION LIST */}

        <section className="rounded-2xl border border-white/10 bg-white/[.035] p-4">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold">
                Detected anomalies
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {detections.length}{" "}
                detection
                {detections.length ===
                1
                  ? ""
                  : "s"}
              </p>

            </div>

            <ScanLine
              size={19}
              className="text-cyan-300"
            />

          </div>


          <div className="mt-4 space-y-2">

            {detections.length >
            0 ? (

              detections.map(
                (
                  detection,
                  index
                ) => (

                  <Link
                    key={
                      detection.detectionId ??
                      detection._id ??
                      index
                    }
                    to={
                      detection.detectionId
                        ? `/detections/${encodeURIComponent(
                            detection.detectionId
                          )}`
                        : "#"
                    }
                    className="block rounded-xl border border-white/5 bg-black/10 p-3 transition hover:bg-white/5"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <span className="font-medium capitalize">

                        {String(
                          detection.classification
                        ).replaceAll(
                          "_",
                          " "
                        )}

                      </span>


                      <RiskBadge
                        risk={
                          detection.riskLevel
                        }
                      />

                    </div>


                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">

                      <span>
                        Confidence{" "}

                        <b className="text-slate-300">
                          {formatNumber(
                            detection.confidence
                          )}
                          %
                        </b>
                      </span>


                      <span>
                        Hazard{" "}

                        <b className="text-slate-300">
                          {formatNumber(
                            detection.hazardScore
                          )}
                          /100
                        </b>
                      </span>

                    </div>

                  </Link>

                )
              )

            ) : (

              <div className="py-10 text-center">

                <ScanLine
                  size={32}
                  className="mx-auto mb-3 text-slate-700"
                />

                <p className="text-sm text-slate-500">
                  No detections in this frame.
                </p>

              </div>

            )}

          </div>

        </section>

      </div>

    </div>
  );
}