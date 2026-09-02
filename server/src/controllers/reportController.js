import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { createObjectCsvWriter } from "csv-writer";
import Detection from "../models/Detection.js";
import Survey from "../models/Survey.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fail, ok } from "../utils/apiResponse.js";

async function getData(surveyId) {
  const survey = await Survey.findOne({ surveyId }).lean();
  if (!survey) return null;
  const detections = await Detection.find({ survey: survey._id }).sort({ createdAt: 1 }).lean();
  return { survey, detections };
}

function rows(detections) {
  return detections.map(d => ({
    detectionId: d.detectionId,
    classification: d.classification,
    confidence: d.confidence,
    hazardScore: d.hazardScore,
    risk: d.riskLevel,
    latitude: d.location?.latitude ?? "",
    longitude: d.location?.longitude ?? "",
    length: d.dimensions?.lengthM ?? "",
    width: d.dimensions?.widthM ?? "",
    area: d.dimensions?.areaM2 ?? "",
    shadowScore: d.shadowAnalysis?.score ?? "",
    verification: d.verification?.status ?? ""
  }));
}

export const jsonReport = asyncHandler(async (req, res) => {
  const data = await getData(req.params.surveyId);
  if (!data) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);
  return ok(res, data);
});

export const csvReport = asyncHandler(async (req, res) => {
  const data = await getData(req.params.surveyId);
  if (!data) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);

  const dir = path.resolve("reports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${data.survey.surveyId}.csv`);

  const writer = createObjectCsvWriter({
    path: file,
    header: [
      ["detectionId", "Detection ID"], ["classification", "Classification"],
      ["confidence", "Confidence"], ["hazardScore", "Hazard Score"],
      ["risk", "Risk"], ["latitude", "Latitude"], ["longitude", "Longitude"],
      ["length", "Length"], ["width", "Width"], ["area", "Area"],
      ["shadowScore", "Shadow Score"], ["verification", "Verification Status"]
    ]
  });

  await writer.writeRecords(rows(data.detections));
  res.download(file, `${data.survey.surveyId}.csv`);
});

export const pdfReport = asyncHandler(async (req, res) => {
  const data = await getData(req.params.surveyId);
  if (!data) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);

  const dir = path.resolve("reports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${data.survey.surveyId}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  doc.fontSize(20).text("MarineGuard AI — Survey Report");
  doc.moveDown();
  doc.fontSize(12).text(`Survey: ${data.survey.name}`);
  doc.text(`Survey ID: ${data.survey.surveyId}`);
  doc.text(`Detections: ${data.detections.length}`);
  doc.moveDown();

  for (const d of data.detections) {
    doc.fontSize(10)
      .text(`${d.detectionId} | ${d.classification} | Confidence ${d.confidence}% | Hazard ${d.hazardScore}/100 | ${d.riskLevel}`)
      .text(`Location: ${d.location?.latitude ?? "N/A"}, ${d.location?.longitude ?? "N/A"}`)
      .text(`Dimensions: ${d.dimensions?.lengthM ?? "N/A"}m x ${d.dimensions?.widthM ?? "N/A"}m | Area: ${d.dimensions?.areaM2 ?? "N/A"}m²`)
      .text(`Shadow score: ${d.shadowAnalysis?.score ?? "N/A"} | Verification: ${d.verification?.status ?? "N/A"}`)
      .moveDown();
  }

  doc.end();
  stream.on("finish", () => res.download(file, `${data.survey.surveyId}.pdf`));
});