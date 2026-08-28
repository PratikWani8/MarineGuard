import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Waves,
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ScanLine,
  MapPin,
  Compass,
  Ruler,
  Gauge,
  Play,
  Database,
  Loader2,
  Info,
} from "lucide-react";

import { uploadFrame } from "../services/surveyApi";
import { extractSonarMetadata } from "../utils/sonarMetadata";

export default function SSSUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const surveyId = searchParams.get("survey");

  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [metadataSource, setMetadataSource] = useState(null);

  const [metadata, setMetadata] = useState({
    frame_id: "",
    latitude: "",
    longitude: "",
    heading: "",
    depth: "",
    sonar_range_m: "",
    pixel_resolution_m: "",
    side: "unknown",
  });

  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // METADATA UPDATE
  // ==========================================================

  function updateMetadata(e) {
    setMetadata((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  async function selectFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setSuccess("");
    setMetadataSource(null);

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".tif",
      ".tiff",
      ".webp",
    ];

    const extension =
      "." +
      selectedFile.name
        .split(".")
        .pop()
        .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError(
        "Invalid file type. Upload PNG, JPG, JPEG, TIFF or WebP."
      );

      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError(
        "File is too large. Maximum allowed size is 50 MB."
      );

      return;
    }

    setFile(selectedFile);

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreview(objectUrl);

    // --------------------------------------------------------
    // Frame ID
    // --------------------------------------------------------

    if (!metadata.frame_id) {
      setMetadata((prev) => ({
        ...prev,
        frame_id: "",
      }));
    }

    // --------------------------------------------------------
    // Automatic metadata extraction
    // --------------------------------------------------------

    setExtracting(true);

    try {
      const extracted =
        await extractSonarMetadata(
          selectedFile
        );

      setMetadata((prev) => ({
        ...prev,

        latitude:
          extracted.latitude ??
          prev.latitude,

        longitude:
          extracted.longitude ??
          prev.longitude,

        heading:
          extracted.heading ??
          prev.heading,

        depth:
          extracted.depth ??
          extracted.depth_m ??
          prev.depth,

        sonar_range_m:
          extracted.sonar_range_m ??
          prev.sonar_range_m,

        pixel_resolution_m:
          extracted.pixel_resolution_m ??
          prev.pixel_resolution_m,

        side:
          extracted.side !== "unknown"
            ? extracted.side
            : prev.side,
      }));

      setMetadataSource(
        extracted
      );

    } catch (err) {
      console.warn(
        "Metadata extraction failed:",
        err
      );
    } finally {
      setExtracting(false);
    }
  }

  function handleFileChange(e) {
    const selectedFile =
      e.target.files?.[0];

    if (selectedFile) {
      selectFile(selectedFile);
    }
  }

  function handleDrop(e) {
    e.preventDefault();

    const droppedFile =
      e.dataTransfer.files?.[0];

    if (droppedFile) {
      selectFile(droppedFile);
    }
  }

  function removeFile() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");
    setMetadataSource(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validateMetadata() {
    if (!surveyId) {
      setError(
        "No survey selected. Open this page from a survey."
      );

      return false;
    }

    if (!file) {
      setError(
        "Please select an SSS image."
      );

      return false;
    }

    // --------------------------------------------------------
    // Frame ID
    // --------------------------------------------------------

    if (
      metadata.frame_id === "" ||
      !Number.isInteger(
        Number(metadata.frame_id)
      ) ||
      Number(metadata.frame_id) < 0
    ) {
      setError(
        "Frame ID must be a non-negative integer."
      );

      return false;
    }

    // --------------------------------------------------------
    // Latitude
    // --------------------------------------------------------

    if (
      metadata.latitude !== "" &&
      (
        !Number.isFinite(
          Number(metadata.latitude)
        ) ||
        Number(metadata.latitude) < -90 ||
        Number(metadata.latitude) > 90
      )
    ) {
      setError(
        "Latitude must be between -90 and 90."
      );

      return false;
    }

    // --------------------------------------------------------
    // Longitude
    // --------------------------------------------------------

    if (
      metadata.longitude !== "" &&
      (
        !Number.isFinite(
          Number(metadata.longitude)
        ) ||
        Number(metadata.longitude) < -180 ||
        Number(metadata.longitude) > 180
      )
    ) {
      setError(
        "Longitude must be between -180 and 180."
      );

      return false;
    }

    // --------------------------------------------------------
    // Heading
    // --------------------------------------------------------

    if (
      metadata.heading !== "" &&
      (
        !Number.isFinite(
          Number(metadata.heading)
        ) ||
        Number(metadata.heading) < 0 ||
        Number(metadata.heading) >= 360
      )
    ) {
      setError(
        "Heading must be between 0 and 359.99 degrees."
      );

      return false;
    }

    // --------------------------------------------------------
    // Depth
    // --------------------------------------------------------

    if (
      metadata.depth !== "" &&
      (
        !Number.isFinite(
          Number(metadata.depth)
        ) ||
        Number(metadata.depth) < 0
      )
    ) {
      setError(
        "Depth must be a valid non-negative number."
      );

      return false;
    }

    // --------------------------------------------------------
    // Sonar range
    // --------------------------------------------------------

    if (
      metadata.sonar_range_m !== "" &&
      (
        !Number.isFinite(
          Number(metadata.sonar_range_m)
        ) ||
        Number(metadata.sonar_range_m) <= 0
      )
    ) {
      setError(
        "Sonar range must be greater than 0."
      );

      return false;
    }

    // --------------------------------------------------------
    // Pixel resolution
    // --------------------------------------------------------

    if (
      metadata.pixel_resolution_m !== "" &&
      (
        !Number.isFinite(
          Number(metadata.pixel_resolution_m)
        ) ||
        Number(metadata.pixel_resolution_m) <= 0
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

  async function uploadAndAnalyze() {
    if (!validateMetadata()) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      // ------------------------------------------------------
      // Build backend-compatible metadata
      // ------------------------------------------------------

      const cleanMetadata = {
        // REQUIRED BY FASTAPI
        survey_id: String(
          surveyId
        ).trim(),

        frame_id:
          Number.parseInt(
            metadata.frame_id,
            10
          ),

        side:
          metadata.side === "unknown"
            ? null
            : metadata.side,
      };

      // ------------------------------------------------------
      // GPS
      // ------------------------------------------------------

      if (metadata.latitude !== "") {
        cleanMetadata.latitude =
          Number(
            metadata.latitude
          );
      }

      if (metadata.longitude !== "") {
        cleanMetadata.longitude =
          Number(
            metadata.longitude
          );
      }

      // ------------------------------------------------------
      // Heading
      // ------------------------------------------------------

      if (metadata.heading !== "") {
        cleanMetadata.heading =
          Number(
            metadata.heading
          );
      }

      // ------------------------------------------------------
      // Depth
      //
      // IMPORTANT:
      // Backend schema expects depth_m.
      // ------------------------------------------------------

      if (metadata.depth !== "") {
        cleanMetadata.depth_m =
          Number(
            metadata.depth
          );
      }

      // ------------------------------------------------------
      // Sonar range
      // ------------------------------------------------------

      if (
        metadata.sonar_range_m !== ""
      ) {
        cleanMetadata.sonar_range_m =
          Number(
            metadata.sonar_range_m
          );
      }

      // ------------------------------------------------------
      // Pixel resolution
      // ------------------------------------------------------

      if (
        metadata.pixel_resolution_m !== ""
      ) {
        cleanMetadata.pixel_resolution_m =
          Number(
            metadata.pixel_resolution_m
          );
      }

      // ------------------------------------------------------
      // Debug
      // ------------------------------------------------------

      console.log(
        "MarineGuard upload metadata:",
        cleanMetadata
      );

      // ------------------------------------------------------
      // Upload
      // ------------------------------------------------------

      const response =
        await uploadFrame(
          surveyId,
          file,
          cleanMetadata,
          (progressEvent) => {
            if (
              !progressEvent.total
            ) {
              return;
            }

            const progress =
              Math.round(
                (
                  progressEvent.loaded /
                  progressEvent.total
                ) * 100
              );

            setUploadProgress(
              progress
            );
          }
        );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

      const data =
        response?.data?.data ||
        response?.data ||
        {};

      const frameId =
        data?.frame?.frameId ||
        data?.frame?.frame_id ||
        data?.frameId ||
        data?.frame_id;

      setSuccess(
        "SSS frame uploaded successfully. AI analysis has started."
      );

      setUploadProgress(100);

      // ------------------------------------------------------
      // Navigate
      // ------------------------------------------------------

      setTimeout(() => {
        if (frameId !== undefined && frameId !== null) {
          navigate(
            `/analysis/${encodeURIComponent(
              frameId
            )}`
          );
        } else {
          navigate(
            `/surveys/${encodeURIComponent(
              surveyId
            )}`
          );
        }
      }, 900);

    } catch (err) {
      console.error(
        "MarineGuard SSS upload failed:",
        err
      );

      console.error(
        "Backend response:",
        err?.response?.data
      );

      const backendError =
        err?.response?.data;

      const detail =
        backendError?.detail;

      let message =
        "SSS upload or analysis failed.";

      if (
        typeof detail === "string"
      ) {
        message = detail;
      } else if (
        detail?.message
      ) {
        message =
          detail.message;
      } else if (
        backendError?.error?.message
      ) {
        message =
          backendError.error.message;
      } else if (
        err?.userMessage
      ) {
        message =
          err.userMessage;
      } else if (
        err?.message
      ) {
        message =
          err.message;
      }

      setError(
        message
      );

    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <button
            onClick={() =>
              navigate(
                surveyId
                  ? `/surveys/${surveyId}`
                  : "/surveys"
              )
            }
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Survey
          </button>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <Waves size={23} />
            </div>

            <div>
              <p className="text-sm text-cyan-300">
                Side-Scan Sonar
              </p>

              <h1 className="text-3xl font-semibold">
                Upload SSS Imagery
              </h1>
            </div>

          </div>

          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Upload sonar imagery and automatically
            extract available navigation and sonar
            metadata.
          </p>

        </div>

        {surveyId && (
          <div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">

            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Survey
            </p>

            <p className="mt-1 text-sm font-medium text-cyan-300">
              {surveyId}
            </p>

          </div>
        )}

      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">

          <CheckCircle2 size={18} />

          {success}

        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">

        {/* IMAGE */}

        <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5">

          <div className="mb-5">

            <h2 className="font-semibold">
              Sonar image
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG, JPEG, TIFF and WebP ·
              Maximum 50 MB
            </p>

          </div>

          {!file ? (

            <div
              onDragOver={(e) =>
                e.preventDefault()
              }
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/[.025] transition hover:border-cyan-400/40 hover:bg-cyan-400/[.05]"
            >

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff,.webp,image/*"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />

              <div className="rounded-2xl bg-cyan-400/10 p-5 text-cyan-300">
                <UploadCloud size={38} />
              </div>

              <h3 className="mt-5 text-lg font-medium">
                Drop SSS imagery here
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                or click to browse files
              </p>

            </div>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">

              <div className="relative flex min-h-[430px] items-center justify-center bg-[#071923]">

                <img
                  src={preview}
                  alt="Side-scan sonar preview"
                  className="max-h-[560px] w-full object-contain"
                />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs backdrop-blur">

                  <ScanLine
                    size={15}
                    className="text-cyan-300"
                  />

                  SSS Preview

                </div>

              </div>

              <div className="flex items-center gap-3 border-t border-white/10 bg-[#071923] p-4">

                <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                  <ImageIcon size={18} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>

                </div>

                <button
                  onClick={
                    removeFile
                  }
                  disabled={busy}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <X size={18} />
                </button>

              </div>

            </div>
          )}

          {/* EXTRACTION */}

          {extracting && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[.04] p-3 text-sm text-cyan-300">

              <Loader2
                size={17}
                className="animate-spin"
              />

              Reading image metadata...

            </div>
          )}

          {!extracting &&
            metadataSource && (
              <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/[.04] p-4">

                <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">

                  <Database size={16} />

                  Metadata extraction complete

                </div>

                {metadataSource.detectedFields?.length >
                0 ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Detected:{" "}
                    {metadataSource.detectedFields.join(
                      ", "
                    )}
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    No navigation or sonar metadata
                    was embedded in this image.
                    You can enter the available
                    values manually.
                  </p>
                )}

              </div>
            )}

          {/* PROGRESS */}

          {busy && (
            <div className="mt-5">

              <div className="mb-2 flex justify-between text-xs">

                <span className="text-slate-500">
                  Uploading...
                </span>

                <span className="text-cyan-300">
                  {uploadProgress}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">

                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />

              </div>

            </div>
          )}

        </section>

        {/* METADATA */}

        <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5">

          <div className="mb-5">

            <h2 className="font-semibold">
              Sonar metadata
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Automatically detected values are
              filled below. Review them before
              analysis.
            </p>

          </div>

          <div className="space-y-4">

            <MetadataInput
              icon={ScanLine}
              label="Frame ID"
              name="frame_id"
              type="number"
              min="0"
              step="1"
              value={metadata.frame_id}
              onChange={updateMetadata}
              placeholder="1"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">

              <MetadataInput
                icon={MapPin}
                label="Latitude"
                name="latitude"
                type="number"
                step="any"
                value={metadata.latitude}
                onChange={updateMetadata}
                placeholder="18.52341"
              />

              <MetadataInput
                icon={MapPin}
                label="Longitude"
                name="longitude"
                type="number"
                step="any"
                value={metadata.longitude}
                onChange={updateMetadata}
                placeholder="72.81231"
              />

            </div>

            <MetadataInput
              icon={Compass}
              label="Heading"
              name="heading"
              type="number"
              step="any"
              value={metadata.heading}
              onChange={updateMetadata}
              placeholder="180"
              suffix="°"
            />

            <MetadataInput
              icon={Gauge}
              label="Depth"
              name="depth"
              type="number"
              step="any"
              value={metadata.depth}
              onChange={updateMetadata}
              placeholder="35.5"
              suffix="m"
            />

            <MetadataInput
              icon={Ruler}
              label="Sonar Range"
              name="sonar_range_m"
              type="number"
              step="any"
              value={
                metadata.sonar_range_m
              }
              onChange={updateMetadata}
              placeholder="50"
              suffix="m"
            />

            <MetadataInput
              icon={Ruler}
              label="Pixel Resolution"
              name="pixel_resolution_m"
              type="number"
              step="any"
              value={
                metadata.pixel_resolution_m
              }
              onChange={updateMetadata}
              placeholder="0.05"
              suffix="m/px"
            />

            <div>

              <label className="text-sm text-slate-400">
                Sonar Side
              </label>

              <select
                name="side"
                value={metadata.side}
                onChange={
                  updateMetadata
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b202c] px-3 py-3 text-sm outline-none focus:border-cyan-400/40"
              >

                <option value="unknown">
                  Unknown
                </option>

                <option value="port">
                  Port
                </option>

                <option value="starboard">
                  Starboard
                </option>

              </select>

            </div>

          </div>

          {/* INFORMATION */}

          <div className="mt-5 flex gap-3 rounded-xl border border-white/10 bg-black/10 p-3">

            <Info
              size={16}
              className="mt-0.5 shrink-0 text-cyan-300"
            />

            <p className="text-[11px] leading-relaxed text-slate-500">
              GPS, heading, depth and sonar
              parameters are only populated when
              the source image actually contains
              this information. MarineGuard never
              fabricates unavailable metadata.
            </p>

          </div>

          {/* UPLOAD */}

          <button
            onClick={
              uploadAndAnalyze
            }
            disabled={
              busy ||
              extracting ||
              !file
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {busy ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Processing sonar...
              </>
            ) : (
              <>
                <Play size={17} />

                Upload & Analyze
              </>
            )}

          </button>

        </section>

      </div>

      {/* PIPELINE */}

      <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">

        <div className="mb-5">

          <h2 className="font-semibold">
            MarineGuard AI pipeline
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Metadata extraction happens before the
            image enters the AI analysis pipeline.
          </p>

        </div>

        <div className="grid gap-3 md:grid-cols-5">

          {[
            [
              "01",
              "SSS Image",
              "Upload sonar frame",
            ],
            [
              "02",
              "Metadata",
              "Extract GPS and sonar data",
            ],
            [
              "03",
              "YOLO",
              "Detect anomalies",
            ],
            [
              "04",
              "U-Net",
              "Segment objects",
            ],
            [
              "05",
              "Risk Engine",
              "Score and geotag hazards",
            ],
          ].map(
            ([
              number,
              title,
              description,
            ]) => (
              <div
                key={number}
                className="rounded-xl border border-white/10 bg-black/10 p-4"
              >

                <div className="text-xs font-semibold text-cyan-300">
                  {number}
                </div>

                <div className="mt-3 text-sm font-medium">
                  {title}
                </div>

                <div className="mt-1 text-xs leading-relaxed text-slate-600">
                  {description}
                </div>

              </div>
            )
          )}

        </div>

      </section>

    </div>
  );
}


// ============================================================
// METADATA INPUT
// ============================================================

function MetadataInput({
  icon: Icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step,
  min,
  suffix,
}) {
  return (
    <div>

      <label className="text-sm text-slate-400">

        {label}

        {required && (
          <span className="ml-1 text-cyan-300">
            *
          </span>
        )}

      </label>

      <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 transition focus-within:border-cyan-400/40">

        <Icon
          size={16}
          className="shrink-0 text-slate-500"
        />

        <input
          required={required}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          step={step}
          min={min}
          className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-700"
        />

        {suffix && (
          <span className="text-xs text-slate-600">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}