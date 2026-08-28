import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Waves,
  Eye,
  UploadCloud,
  RefreshCw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  createSurvey,
  deleteSurvey,
  getSurveys,
} from "../services/surveyApi";

import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import { formatDate } from "../utils/format";

export default function Surveys() {
  const [items, setItems] = useState(null);
  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      }

      const response = await getSurveys();

      setItems(response.data?.data || []);
    } catch (e) {
      setError(
        e.userMessage ||
          e.response?.data?.error?.message ||
          "Failed to load surveys"
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Survey name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createSurvey({
        name: form.name.trim(),
        description: form.description.trim(),
      });

      setForm({
        name: "",
        description: "",
      });

      setShow(false);

      await load();
    } catch (e) {
      setError(
        e.userMessage ||
          e.response?.data?.error?.message ||
          "Could not create survey"
      );
    } finally {
      setCreating(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this survey?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await deleteSurvey(id);

      await load();
    } catch (e) {
      setError(
        e.userMessage ||
          e.response?.data?.error?.message ||
          "Could not delete survey"
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case "completed":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "processing":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

      case "failed":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";

      case "uploaded":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  }

  if (!items && !error) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm text-cyan-300">
            Acoustic surveys
          </p>

          <h1 className="text-3xl font-semibold">
            Surveys
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage side-scan sonar campaigns and upload
            underwater imagery for AI analysis.
          </p>
        </div>

        <div className="flex gap-2">

          {/* Refresh */}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[.06] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

          {/* New survey */}
          <button
            onClick={() => {
              setError("");
              setShow(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-ocean-950 transition hover:bg-cyan-300"
          >
            <Plus size={17} />
            New survey
          </button>

        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">

          <div className="flex-1">
            {error}
          </div>

          <button
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-white/5"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================================
          CREATE SURVEY
      ====================================================== */}

      {show && (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-cyan-400/10 bg-white/[.035] p-5"
        >
          <div className="mb-5">
            <p className="text-sm font-medium">
              Create acoustic survey
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Create a survey before uploading Side-Scan
              Sonar imagery.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm text-slate-400">
                Survey name
              </label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm outline-none transition focus:border-cyan-400/40"
                placeholder="Mumbai Coast Survey"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Description
              </label>

              <input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm outline-none transition focus:border-cyan-400/40"
                placeholder="Underwater debris survey"
              />
            </div>

          </div>

          <div className="mt-5 flex gap-2">

            <button
              disabled={creating}
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-ocean-950 disabled:opacity-50"
            >
              {creating && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ocean-950/30 border-t-ocean-950" />
              )}

              {creating
                ? "Creating..."
                : "Create Survey"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShow(false);
                setForm({
                  name: "",
                  description: "",
                });
              }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>

          </div>
        </form>
      )}

      {/* =====================================================
          EMPTY
      ====================================================== */}

      {items?.length === 0 ? (
        <EmptyState
          title="No surveys yet"
          description="Create a survey and upload your first Side-Scan Sonar frame."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-sm">

              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Survey
                  </th>

                  <th className="px-4 py-4">
                    Status
                  </th>

                  <th className="px-4 py-4">
                    Frames
                  </th>

                  <th className="px-4 py-4">
                    Detections
                  </th>

                  <th className="px-4 py-4">
                    Critical
                  </th>

                  <th className="px-4 py-4">
                    Created
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {items?.map((s) => (
                  <tr
                    key={s.surveyId}
                    className="border-b border-white/5 transition hover:bg-white/[.025]"
                  >

                    {/* Survey */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                          <Waves size={16} />
                        </span>

                        <div>
                          <div className="font-medium">
                            {s.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {s.surveyId}
                          </div>
                        </div>

                      </div>

                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs capitalize ${getStatusStyle(
                          s.status
                        )}`}
                      >
                        {s.status || "unknown"}
                      </span>

                    </td>

                    {/* Frames */}
                    <td className="px-4 py-4 text-slate-300">
                      {s.stats?.frames || 0}
                    </td>

                    {/* Detections */}
                    <td className="px-4 py-4 text-slate-300">
                      {s.stats?.detections || 0}
                    </td>

                    {/* Critical */}
                    <td className="px-4 py-4">

                      <span
                        className={
                          s.stats?.criticalDetections > 0
                            ? "font-semibold text-rose-300"
                            : "text-slate-400"
                        }
                      >
                        {s.stats?.criticalDetections || 0}
                      </span>

                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(s.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-1">

                        {/* Upload SSS */}
                        <Link
                          title="Upload SSS imagery"
                          to={`/sss-upload?survey=${s.surveyId}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                        >
                          <UploadCloud size={16} />
                        </Link>

                        {/* Open */}
                        <Link
                          title="Open survey"
                          to={`/surveys/${s.surveyId}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-cyan-300"
                        >
                          <Eye size={16} />
                        </Link>

                        {/* Delete */}
                        <button
                          title="Delete survey"
                          disabled={deletingId === s.surveyId}
                          onClick={() =>
                            remove(s.surveyId)
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                        >
                          {deletingId === s.surveyId ? (
                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-rose-300" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* =====================================================
          INFORMATION CARD
      ====================================================== */}

      {items?.length > 0 && (
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.025] p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <UploadCloud size={22} />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium">
                Ready to analyze Side-Scan Sonar?
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Open a survey and upload SSS imagery with
                optional location, depth, heading and sonar
                resolution metadata. MarineGuard AI will
                process the frame through the detection,
                segmentation and acoustic intelligence
                pipeline.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}