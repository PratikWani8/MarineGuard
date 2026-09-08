import exifr from "exifr";
import GeoTIFF from "geotiff";
import { createWorker } from "tesseract.js";

/**
 * Extract metadata from an SSS image.
 *
 * Supports:
 * - EXIF GPS
 * - EXIF heading/direction
 * - TIFF/GeoTIFF metadata
 * - Image dimensions
 * - OCR metadata printed directly on sonar images
 *
 * OCR pipeline:
 * - Original image
 * - Upscaled image
 * - Grayscale
 * - Contrast enhancement
 * - Threshold image
 * - OCR result merging
 * - OCR typo correction
 * - Flexible metadata parsing
 */

/* ============================================================
   BASIC HELPERS
============================================================ */

function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(
    String(value)
      .replace(",", ".")
      .replace(/[^\d.+-]/g, "")
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = numberOrNull(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

/* ============================================================
   SIDE
============================================================ */

function normalizeSide(value) {
  if (!value) {
    return "unknown";
  }

  const side = String(value)
    .toLowerCase()
    .trim();

  if (
    side.includes("port") ||
    side === "left" ||
    side === "p"
  ) {
    return "port";
  }

  if (
    side.includes("starboard") ||
    side === "right" ||
    side === "s"
  ) {
    return "starboard";
  }

  return "unknown";
}

/* ============================================================
   EXIF
============================================================ */

function extractFromExif(exif) {
  if (!exif) {
    return {};
  }

  const latitude = firstNumber(
    exif.latitude,
    exif.GPSLatitude
  );

  const longitude = firstNumber(
    exif.longitude,
    exif.GPSLongitude
  );

  const heading = firstNumber(
    exif.GPSImgDirection,
    exif.GPSDestBearing,
    exif.ImageDirection,
    exif.Heading,
    exif.Course,
    exif.Bearing
  );

  const depth = firstNumber(
    exif.depth,
    exif.Depth,
    exif.depthMeters,
    exif.DepthMeters,
    exif.waterDepth,
    exif.WaterDepth
  );

  const sonarRange = firstNumber(
    exif.sonarRange,
    exif.SonarRange,
    exif.range,
    exif.Range,
    exif.rangeMeters,
    exif.RangeMeters
  );

  const pixelResolution = firstNumber(
    exif.pixelResolution,
    exif.PixelResolution,
    exif.groundSampleDistance,
    exif.GSD
  );

  const side = normalizeSide(
    exif.side ||
      exif.Side ||
      exif.sonarSide ||
      exif.SonarSide
  );

  return {
    latitude,
    longitude,
    heading,
    depth,
    sonarRange,
    pixelResolution,
    side,
  };
}

/* ============================================================
   GEOTIFF
============================================================ */

async function extractGeoTiff(file) {
  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (
    !["tif", "tiff"].includes(extension)
  ) {
    return {};
  }

  try {
    const buffer =
      await file.arrayBuffer();

    const tiff =
      await GeoTIFF.fromArrayBuffer(
        buffer
      );

    const image =
      await tiff.getImage();

    const fileDirectory =
      image.getFileDirectory();

    const geoKeys =
      image.getGeoKeys();

    const width =
      image.getWidth();

    const height =
      image.getHeight();

    let pixelResolution = null;

    const resolution =
      fileDirectory?.ModelPixelScale ||
      fileDirectory?.ModelPixelScaleTag;

    if (
      Array.isArray(resolution) &&
      resolution[0] !== undefined
    ) {
      const value =
        Number(resolution[0]);

      if (Number.isFinite(value)) {
        pixelResolution = value;
      }
    }

    return {
      width,
      height,
      pixelResolution,
      geoKeys,
      fileDirectory,
    };
  } catch (error) {
    return {};
  }
}

/* ============================================================
   OCR NORMALIZATION
============================================================ */

function normalizeOCRText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[′]/g, "'")
    .replace(/[″]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ============================================================
   OCR TYPO CORRECTION
============================================================ */

/**
 * Correct common OCR mistakes.
 *
 * Important:
 * Do not globally replace numbers/letters because
 * sonar values may legitimately contain both.
 */

function correctOCRText(text) {
  return String(text || "")
    .replace(/\blattitude\b/gi, "latitude")
    .replace(/\blatltude\b/gi, "latitude")
    .replace(/\blatltud\b/gi, "latitude")
    .replace(/\blattud\b/gi, "latitude")
    .replace(/\blatt\b/gi, "lat")
    .replace(/\blat\b/gi, "lat")

    .replace(/\blongtitude\b/gi, "longitude")
    .replace(/\blongltude\b/gi, "longitude")
    .replace(/\blongltud\b/gi, "longitude")
    .replace(/\blongitud\b/gi, "longitude")
    .replace(/\blong\b/gi, "long")
    .replace(/\blng\b/gi, "lng")

    .replace(/\bheadlng\b/gi, "heading")
    .replace(/\bheadlng\b/gi, "heading")
    .replace(/\bheadin[gq]\b/gi, "heading")
    .replace(/\bheding\b/gi, "heading")
    .replace(/\bhdg\b/gi, "heading")

    .replace(/\bbearlng\b/gi, "bearing")
    .replace(/\bbearin[gq]\b/gi, "bearing")
    .replace(/\bbrng\b/gi, "bearing")

    .replace(/\bcours[e3]\b/gi, "course")

    .replace(/\bddpth\b/gi, "depth")
    .replace(/\bdpth\b/gi, "depth")
    .replace(/\bdepth\b/gi, "depth")

    .replace(/\bsonar[ -]*rnge\b/gi, "sonar range")
    .replace(/\bsonar[ -]*range\b/gi, "sonar range")
    .replace(/\bsnar[ -]*range\b/gi, "sonar range")
    .replace(/\brnge\b/gi, "range")
    .replace(/\brang[e3]\b/gi, "range")

    .replace(/\bpix[e3]l[ -]*res\b/gi, "pixel resolution")
    .replace(/\bpixel[ -]*res\b/gi, "pixel resolution")
    .replace(/\bpix[ -]*res\b/gi, "pixel resolution")
    .replace(/\bresoluton\b/gi, "resolution")
    .replace(/\bresolutin\b/gi, "resolution")

    .replace(/\bfrm\b/gi, "frame")
    .replace(/\bfram[e3]\b/gi, "frame");
}

/* ============================================================
   LABEL HELPERS
============================================================ */

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function ocrLabelPattern(labels) {
  return labels
    .map(escapeRegExp)
    .join("|");
}

/**
 * Extract a number after a label.
 *
 * Supports:
 *
 * Depth: 24.3
 * Depth = 24.3 m
 * DEPTH 24.3M
 * depth-24.3
 * Range 50
 * HDG 120
 */

function extractLabeledNumber(
  text,
  labels,
  options = {}
) {
  const source =
    String(text || "");

  const labelPattern =
    ocrLabelPattern(labels);

  const regex =
    new RegExp(
      `(?:${labelPattern})` +
        `\\s*[:=\\-_]?\\s*` +
        `([-+]?\\d+(?:[.,]\\d+)?)` +
        `\\s*(?:m|meter|meters|deg|°|degrees|kn|knots)?`,
      "i"
    );

  const match =
    source.match(regex);

  if (!match) {
    return null;
  }

  const value =
    Number(
      match[1].replace(",", ".")
    );

  if (
    !Number.isFinite(value)
  ) {
    return null;
  }

  if (
    options.min !== undefined &&
    value < options.min
  ) {
    return null;
  }

  if (
    options.max !== undefined &&
    value > options.max
  ) {
    return null;
  }

  return value;
}

/* ============================================================
   COORDINATES
============================================================ */

function applyDirection(
  value,
  direction,
  positiveDirections,
  negativeDirections
) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const dir =
    String(direction || "")
      .toUpperCase();

  if (
    negativeDirections.includes(dir)
  ) {
    return -Math.abs(value);
  }

  if (
    positiveDirections.includes(dir)
  ) {
    return Math.abs(value);
  }

  return value;
}

/**
 * Convert DMS to decimal.
 */

function dmsToDecimal(
  degrees,
  minutes = 0,
  seconds = 0
) {
  const d = Number(degrees);
  const m = Number(minutes);
  const s = Number(seconds);

  if (
    !Number.isFinite(d) ||
    !Number.isFinite(m) ||
    !Number.isFinite(s)
  ) {
    return null;
  }

  if (
    m < 0 ||
    m >= 60 ||
    s < 0 ||
    s >= 60
  ) {
    return null;
  }

  return (
    Math.abs(d) +
    m / 60 +
    s / 3600
  );
}

/**
 * Extract coordinates with labels.
 *
 * Supports:
 *
 * Latitude: 18.5203 N
 * LAT 18.5203N
 * Longitude: 73.8567 E
 *
 * Latitude: 18°31'13"N
 * LAT 18 31 13 N
 */

function extractCoordinate(
  text,
  labels,
  positiveDirections,
  negativeDirections,
  maxDegrees
) {
  const source =
    String(text || "");

  const labelPattern =
    ocrLabelPattern(labels);

  /* ----------------------------------------------------------
     DMS with symbols
  ---------------------------------------------------------- */

  const dmsRegex =
    new RegExp(
      `(?:${labelPattern})` +
        `\\s*[:=\\-_]?\\s*` +
        `(\\d{1,3})` +
        `\\s*(?:°|deg|degrees)?\\s*` +
        `(\\d{1,2})?` +
        `\\s*(?:'|min|minutes)?\\s*` +
        `(\\d{1,2}(?:[.,]\\d+)?)?` +
        `\\s*(?:"|sec|seconds)?\\s*` +
        `([NSEW])?`,
      "i"
    );

  const dms =
    source.match(dmsRegex);

  if (dms) {
    const degrees =
      Number(dms[1]);

    const minutes =
      Number(dms[2] || 0);

    const seconds =
      Number(
        String(dms[3] || 0)
          .replace(",", ".")
      );

    if (
      degrees <= maxDegrees &&
      minutes < 60 &&
      seconds < 60
    ) {
      let value =
        dmsToDecimal(
          degrees,
          minutes,
          seconds
        );

      value = applyDirection(
        value,
        dms[4],
        positiveDirections,
        negativeDirections
      );

      if (
        Number.isFinite(value)
      ) {
        return value;
      }
    }
  }

  /* ----------------------------------------------------------
     Decimal
  ---------------------------------------------------------- */

  const decimalRegex =
    new RegExp(
      `(?:${labelPattern})` +
        `\\s*[:=\\-_]?\\s*` +
        `([-+]?\\d+(?:[.,]\\d+)?)` +
        `\\s*([NSEW])?`,
      "i"
    );

  const decimal =
    source.match(decimalRegex);

  if (decimal) {
    let value =
      Number(
        decimal[1].replace(",", ".")
      );

    if (
      Number.isFinite(value) &&
      Math.abs(value) <= maxDegrees
    ) {
      value = applyDirection(
        value,
        decimal[2],
        positiveDirections,
        negativeDirections
      );

      return value;
    }
  }

  return null;
}

/**
 * Detect coordinates even when labels are missing.
 *
 * Example:
 *
 * 18.5203 N
 * 73.8567 E
 */

function extractUnlabeledCoordinates(
  text
) {
  const source =
    String(text || "");

  const matches = [
    ...source.matchAll(
      /([-+]?\d+(?:[.,]\d+)?)\s*([NSEW])/gi
    ),
  ];

  let latitude = null;
  let longitude = null;

  for (const match of matches) {
    const value =
      Number(
        match[1].replace(",", ".")
      );

    const direction =
      match[2].toUpperCase();

    if (
      !Number.isFinite(value)
    ) {
      continue;
    }

    if (
      (direction === "N" ||
        direction === "S") &&
      Math.abs(value) <= 90 &&
      latitude === null
    ) {
      latitude =
        direction === "S"
          ? -Math.abs(value)
          : Math.abs(value);
    }

    if (
      (direction === "E" ||
        direction === "W") &&
      Math.abs(value) <= 180 &&
      longitude === null
    ) {
      longitude =
        direction === "W"
          ? -Math.abs(value)
          : Math.abs(value);
    }
  }

  return {
    latitude,
    longitude,
  };
}

/* ============================================================
   FRAME ID
============================================================ */

function extractFrameId(text) {
  const source =
    String(text || "");

  const patterns = [
    /frame\s*(?:id|no|number)?\s*[:=\-_]?\s*(?:sss\s*[-_ ]*)?(\d{6,})/i,

    /sss[\s_-]*(\d{8})[\s_-]*(\d{6})/i,

    /(?:frame|frm)[^\d]{0,12}(\d{6,})/i,

    /frameid[^\d]*(\d{6,})/i,

    /frame[_ -]?number[^\d]*(\d{6,})/i,
  ];

  for (const pattern of patterns) {
    const match =
      source.match(pattern);

    if (!match) {
      continue;
    }

    const digits =
      match[2]
        ? `${match[1]}${match[2]}`
        : match[1];

    const value =
      Number(digits);

    if (
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      return value;
    }
  }

  /*
   * Some sonar screenshots contain a long
   * timestamp-like number without the word FRAME.
   *
   * Only use it when it is clearly long enough.
   */

  const timestamp =
    source.match(
      /\b(20\d{6,14})\b/
    );

  if (timestamp) {
    const value =
      Number(timestamp[1]);

    if (
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      return value;
    }
  }

  return null;
}

/* ============================================================
   SIDE
============================================================ */

function extractSideFromOCR(text) {
  const lower =
    String(text || "")
      .toLowerCase();

  if (
    /\bport\b/.test(lower) ||
    /\bleft\b/.test(lower)
  ) {
    return "port";
  }

  if (
    /\bstarboard\b/.test(lower) ||
    /\bright\b/.test(lower)
  ) {
    return "starboard";
  }

  return "unknown";
}

/* ============================================================
   OCR METADATA PARSER
============================================================ */

function parseOCRMetadata(text) {
  const normalized =
    normalizeOCRText(text);

  if (!normalized) {
    return {};
  }

  const cleaned =
    correctOCRText(normalized);

  /* ----------------------------------------------------------
     Latitude
  ---------------------------------------------------------- */

  let latitude =
    extractCoordinate(
      cleaned,
      [
        "latitude",
        "lat",
        "lat.",
        "lattitude",
      ],
      ["N"],
      ["S"],
      90
    );

  /* ----------------------------------------------------------
     Longitude
  ---------------------------------------------------------- */

  let longitude =
    extractCoordinate(
      cleaned,
      [
        "longitude",
        "lon",
        "long",
        "lng",
        "lon.",
      ],
      ["E"],
      ["W"],
      180
    );

  /* ----------------------------------------------------------
     Fallback coordinate detection
  ---------------------------------------------------------- */

  if (
    latitude === null ||
    longitude === null
  ) {
    const fallback =
      extractUnlabeledCoordinates(
        cleaned
      );

    if (
      latitude === null &&
      fallback.latitude !== null
    ) {
      latitude =
        fallback.latitude;
    }

    if (
      longitude === null &&
      fallback.longitude !== null
    ) {
      longitude =
        fallback.longitude;
    }
  }

  /* ----------------------------------------------------------
     Heading
  ---------------------------------------------------------- */

  const heading =
    extractLabeledNumber(
      cleaned,
      [
        "heading",
        "course",
        "bearing",
        "hdg",
        "head",
      ],
      {
        min: 0,
        max: 360,
      }
    );

  /* ----------------------------------------------------------
     Depth
  ---------------------------------------------------------- */

  const depth =
    extractLabeledNumber(
      cleaned,
      [
        "water depth",
        "depth",
        "depth m",
        "depth_m",
        "depthm",
        "waterdepth",
      ],
      {
        min: 0,
      }
    );

  /* ----------------------------------------------------------
     Sonar range
  ---------------------------------------------------------- */

  const sonarRange =
    extractLabeledNumber(
      cleaned,
      [
        "sonar range",
        "sonarrange",
        "range",
        "range m",
        "range_m",
        "rang",
        "rng",
      ],
      {
        min: 0,
      }
    );

  /* ----------------------------------------------------------
     Pixel resolution
  ---------------------------------------------------------- */

  const pixelResolution =
    extractLabeledNumber(
      cleaned,
      [
        "pixel resolution",
        "pixelresolution",
        "resolution",
        "gsd",
        "ground sample distance",
        "groundsampledistance",
        "pixel res",
        "pixelres",
        "res",
      ],
      {
        min: 0,
      }
    );

  /* ----------------------------------------------------------
     Frame
  ---------------------------------------------------------- */

  const frameId =
    extractFrameId(cleaned);

  /* ----------------------------------------------------------
     Side
  ---------------------------------------------------------- */

  const side =
    extractSideFromOCR(cleaned);

  return {
    frame_id: frameId,

    latitude,
    longitude,

    heading,
    depth,

    sonar_range_m:
      sonarRange,

    pixel_resolution_m:
      pixelResolution,

    side,

    ocrText: normalized,
    correctedOCRText: cleaned,
  };
}

/* ============================================================
   IMAGE LOADING
============================================================ */

function loadImage(file) {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(file);

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = error => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      image.src = url;
    }
  );
}

/* ============================================================
   OCR CANVAS
============================================================ */

function makeOCRCanvas(
  image,
  mode = "normal",
  scale = 2
) {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    Math.max(
      1,
      Math.round(
        image.naturalWidth * scale
      )
    );

  canvas.height =
    Math.max(
      1,
      Math.round(
        image.naturalHeight * scale
      )
    );

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true,
      }
    );

  if (!ctx) {
    throw new Error(
      "Could not create OCR canvas context."
    );
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (mode === "normal") {
    return canvas;
  }

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data =
    imageData.data;

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    let value = gray;

    if (mode === "grayscale") {
      value = gray;
    }

    if (mode === "contrast") {
      value =
        (gray - 128) * 2 + 128;

      value =
        clamp(
          value,
          0,
          255
        );
    }

    if (mode === "threshold") {
      value =
        gray > 140
          ? 255
          : 0;
    }

    if (
      mode === "threshold-dark"
    ) {
      value =
        gray > 100
          ? 255
          : 0;
    }

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas;
}

/* ============================================================
   OCR REGION EXTRACTION
============================================================ */

/**
 * Create an additional enlarged canvas for the
 * top/bottom metadata areas.
 *
 * Sonar screenshots frequently place metadata
 * around the edges of the image.
 */

function makeCropCanvas(
  image,
  crop,
  mode = "normal",
  scale = 3
) {
  const sourceWidth =
    image.naturalWidth;

  const sourceHeight =
    image.naturalHeight;

  const sx =
    Math.round(
      sourceWidth * crop.x
    );

  const sy =
    Math.round(
      sourceHeight * crop.y
    );

  const sw =
    Math.round(
      sourceWidth * crop.width
    );

  const sh =
    Math.round(
      sourceHeight * crop.height
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    Math.max(
      1,
      sw * scale
    );

  canvas.height =
    Math.max(
      1,
      sh * scale
    );

  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true,
      }
    );

  if (!ctx) {
    throw new Error(
      "Could not create crop OCR context."
    );
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (mode === "normal") {
    return canvas;
  }

  const imageData =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data =
    imageData.data;

  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {
    const gray =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];

    let value = gray;

    if (mode === "contrast") {
      value =
        (gray - 128) * 2 + 128;

      value =
        clamp(
          value,
          0,
          255
        );
    }

    if (mode === "threshold") {
      value =
        gray > 140
          ? 255
          : 0;
    }

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas;
}

/* ============================================================
   OCR
============================================================ */

async function extractOCR(file) {
  let worker = null;

  try {
    worker = await createWorker("eng");

    const image =
      await loadImage(file);

    /*
     * Only 3 OCR passes.
     * This is much faster than OCR-ing multiple
     * cropped regions.
     */

    const canvases = [
      {
        name: "normal",
        canvas: makeOCRCanvas(
          image,
          "normal",
          2
        ),
      },

      {
        name: "contrast",
        canvas: makeOCRCanvas(
          image,
          "contrast",
          2
        ),
      },

      {
        name: "threshold",
        canvas: makeOCRCanvas(
          image,
          "threshold",
          2
        ),
      },
    ];

    const results = [];

    for (const item of canvases) {
      try {
        const result =
          await worker.recognize(
            item.canvas
          );

        const text =
          result?.data?.text || "";

        const confidence =
          Number(
            result?.data?.confidence
          );

        if (text.trim()) {
          results.push({
            name: item.name,
            text,
            confidence:
              Number.isFinite(confidence)
                ? confidence
                : null,
          });
        }
      } catch (error) {
        // Ignore failed OCR pass.
      }
    }

    /*
     * Combine all OCR text.
     */

    const combinedText =
      results
        .map(
          item =>
            `--- ${item.name} ---\n${item.text}`
        )
        .join("\n\n");

    /*
     * Parse metadata.
     */

    const parsed =
      parseOCRMetadata(
        combinedText
      );

    return parsed;

  } catch (error) {
    return {};

  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}

/* ============================================================
   MAIN EXTRACTION
============================================================ */

export async function extractSonarMetadata(
  file
) {
  const result = {
    frame_id: null,

    latitude: null,
    longitude: null,

    heading: null,
    depth: null,

    sonar_range_m: null,
    pixel_resolution_m: null,

    side: "unknown",

    width: null,
    height: null,

    source: {
      exif: false,
      geotiff: false,
      ocr: false,
    },

    detectedFields: [],

    ocrText: "",
  };

  if (!file) {
    return result;
  }

  /* ==========================================================
     IMAGE DIMENSIONS
  ========================================================== */

  try {
    const imageUrl =
      URL.createObjectURL(file);

    const dimensions =
      await new Promise(
        (resolve, reject) => {
          const image =
            new Image();

          image.onload = () => {
            resolve({
              width:
                image.naturalWidth,

              height:
                image.naturalHeight,
            });

            URL.revokeObjectURL(
              imageUrl
            );
          };

          image.onerror =
            error => {
              URL.revokeObjectURL(
                imageUrl
              );

              reject(error);
            };

          image.src =
            imageUrl;
        }
      );

    result.width =
      dimensions.width;

    result.height =
      dimensions.height;

  } catch (error) {
    // Ignore image dimension errors.
  }

  /* ==========================================================
     EXIF
  ========================================================== */

  try {
    const exif =
      await exifr.parse(
        file,
        {
          gps: true,
          tiff: true,
          xmp: true,
          ifd0: true,
          exif: true,
        }
      );

    if (exif) {
      result.source.exif =
        true;

      const exifValues =
        extractFromExif(exif);

      if (
        exifValues.latitude !==
        null
      ) {
        result.latitude =
          exifValues.latitude;
      }

      if (
        exifValues.longitude !==
        null
      ) {
        result.longitude =
          exifValues.longitude;
      }

      if (
        exifValues.heading !==
        null
      ) {
        result.heading =
          exifValues.heading;
      }

      if (
        exifValues.depth !==
        null
      ) {
        result.depth =
          exifValues.depth;
      }

      if (
        exifValues.sonarRange !==
        null
      ) {
        result.sonar_range_m =
          exifValues.sonarRange;
      }

      if (
        exifValues.pixelResolution !==
        null
      ) {
        result.pixel_resolution_m =
          exifValues.pixelResolution;
      }

      if (
        exifValues.side !==
        "unknown"
      ) {
        result.side =
          exifValues.side;
      }
    }

  } catch (error) {
    // EXIF metadata unavailable.
  }

  /* ==========================================================
     GEOTIFF
  ========================================================== */

  const geoTiff =
    await extractGeoTiff(file);

  if (
    Object.keys(geoTiff).length > 0
  ) {
    result.source.geotiff =
      true;

    if (
      result.width === null &&
      geoTiff.width
    ) {
      result.width =
        geoTiff.width;
    }

    if (
      result.height === null &&
      geoTiff.height
    ) {
      result.height =
        geoTiff.height;
    }

    if (
      result.pixel_resolution_m ===
        null &&
      geoTiff.pixelResolution !==
        null
    ) {
      result.pixel_resolution_m =
        geoTiff.pixelResolution;
    }
  }

  /* ==========================================================
     OCR
  ========================================================== */

  const ocr =
    await extractOCR(file);

  if (
    ocr &&
    Object.keys(ocr).length > 0
  ) {
    result.source.ocr =
      true;

    result.ocrText =
      ocr.ocrText || "";

    /* --------------------------------------------------------
       OCR is a fallback.
       Existing EXIF/GeoTIFF values are preserved.
    -------------------------------------------------------- */

    if (
      result.frame_id === null &&
      ocr.frame_id !== null
    ) {
      result.frame_id =
        ocr.frame_id;
    }

    if (
      result.latitude === null &&
      ocr.latitude !== null
    ) {
      result.latitude =
        ocr.latitude;
    }

    if (
      result.longitude === null &&
      ocr.longitude !== null
    ) {
      result.longitude =
        ocr.longitude;
    }

    if (
      result.heading === null &&
      ocr.heading !== null
    ) {
      result.heading =
        ocr.heading;
    }

    if (
      result.depth === null &&
      ocr.depth !== null
    ) {
      result.depth =
        ocr.depth;
    }

    if (
      result.sonar_range_m === null &&
      ocr.sonar_range_m !== null
    ) {
      result.sonar_range_m =
        ocr.sonar_range_m;
    }

    if (
      result.pixel_resolution_m ===
        null &&
      ocr.pixel_resolution_m !==
        null
    ) {
      result.pixel_resolution_m =
        ocr.pixel_resolution_m;
    }

    if (
      result.side === "unknown" &&
      ocr.side !== "unknown"
    ) {
      result.side =
        ocr.side;
    }
  }

  /* ==========================================================
     DETECTED FIELDS
  ========================================================== */

  const fields = [
    [
      "frame_id",
      result.frame_id,
    ],

    [
      "latitude",
      result.latitude,
    ],

    [
      "longitude",
      result.longitude,
    ],

    [
      "heading",
      result.heading,
    ],

    [
      "depth",
      result.depth,
    ],

    [
      "sonar_range_m",
      result.sonar_range_m,
    ],

    [
      "pixel_resolution_m",
      result.pixel_resolution_m,
    ],
  ];

  for (
    const [name, value] of fields
  ) {
    if (
      value !== null &&
      value !== undefined
    ) {
      result.detectedFields.push(
        name
      );
    }
  }

  if (
    result.side !== "unknown"
  ) {
    result.detectedFields.push(
      "side"
    );
  }

  return result;
}