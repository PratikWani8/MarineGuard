import exifr from "exifr";
import GeoTIFF from "geotiff";

/**
 * Extract metadata from an SSS image.
 *
 * Supports:
 * - EXIF GPS
 * - EXIF heading/direction where available
 * - TIFF/GeoTIFF metadata
 * - Image dimensions
 *
 * Important:
 * A normal rendered PNG/JPG SSS image may contain no
 * sonar navigation metadata. In that case we return null
 * rather than inventing values.
 */

function numberOrNull(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
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

function normalizeSide(value) {
  if (!value) return "unknown";

  const side = String(value).toLowerCase();

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
    exif.ImageDirection
  );

  return {
    latitude,
    longitude,
    heading,
  };
}

async function extractGeoTiff(file) {
  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (!["tif", "tiff"].includes(extension)) {
    return {};
  }

  try {
    const buffer = await file.arrayBuffer();

    const tiff = await GeoTIFF.fromArrayBuffer(buffer);

    const image = await tiff.getImage();

    const fileDirectory = image.getFileDirectory();
    const geoKeys = image.getGeoKeys();

    const width = image.getWidth();
    const height = image.getHeight();

    let pixelResolution = null;

    const resolution =
      fileDirectory?.ModelPixelScale ||
      fileDirectory?.ModelPixelScaleTag;

    if (Array.isArray(resolution) && resolution[0]) {
      pixelResolution = Number(resolution[0]);
    }

    return {
      width,
      height,
      pixelResolution,
      geoKeys,
      fileDirectory,
    };
  } catch (error) {
    console.warn(
      "GeoTIFF metadata extraction failed:",
      error
    );

    return {};
  }
}

export async function extractSonarMetadata(file) {
  const result = {
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
    },

    detectedFields: [],
  };

  /* ---------------------------------------------------------
     IMAGE DIMENSIONS
  --------------------------------------------------------- */

  try {
    const imageUrl = URL.createObjectURL(file);

    const dimensions = await new Promise(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });

          URL.revokeObjectURL(imageUrl);
        };

        image.onerror = reject;

        image.src = imageUrl;
      }
    );

    result.width = dimensions.width;
    result.height = dimensions.height;
  } catch (error) {
    console.warn(
      "Image dimensions could not be read:",
      error
    );
  }

  /* ---------------------------------------------------------
     EXIF
  --------------------------------------------------------- */

  try {
    const exif = await exifr.parse(file, {
      gps: true,
      tiff: true,
      xmp: true,
      ifd0: true,
      exif: true,
    });

    if (exif) {
      result.source.exif = true;

      const exifValues = extractFromExif(exif);

      if (exifValues.latitude !== null) {
        result.latitude = exifValues.latitude;
      }

      if (exifValues.longitude !== null) {
        result.longitude = exifValues.longitude;
      }

      if (exifValues.heading !== null) {
        result.heading = exifValues.heading;
      }

      /*
       * Some sonar/export software writes custom XMP/EXIF
       * fields. Try common names without assuming they exist.
       */

      result.depth = firstNumber(
        exif.depth,
        exif.Depth,
        exif.depthMeters,
        exif.DepthMeters,
        exif.waterDepth
      );

      result.sonar_range_m = firstNumber(
        exif.sonarRange,
        exif.SonarRange,
        exif.range,
        exif.Range,
        exif.rangeMeters
      );

      result.pixel_resolution_m = firstNumber(
        exif.pixelResolution,
        exif.PixelResolution,
        exif.groundSampleDistance,
        exif.GSD
      );

      result.side = normalizeSide(
        exif.side ||
          exif.Side ||
          exif.sonarSide ||
          exif.SonarSide
      );
    }
  } catch (error) {
    console.warn(
      "EXIF metadata not available:",
      error
    );
  }

  /* ---------------------------------------------------------
     GEOTIFF
  --------------------------------------------------------- */

  const geoTiff = await extractGeoTiff(file);

  if (Object.keys(geoTiff).length > 0) {
    result.source.geotiff = true;

    if (
      result.width === null &&
      geoTiff.width
    ) {
      result.width = geoTiff.width;
    }

    if (
      result.height === null &&
      geoTiff.height
    ) {
      result.height = geoTiff.height;
    }

    if (
      result.pixel_resolution_m === null &&
      geoTiff.pixelResolution
    ) {
      result.pixel_resolution_m =
        geoTiff.pixelResolution;
    }
  }

  /* ---------------------------------------------------------
     DETECTED FIELD LIST
  --------------------------------------------------------- */

  const fields = [
    ["latitude", result.latitude],
    ["longitude", result.longitude],
    ["heading", result.heading],
    ["depth", result.depth],
    ["sonar_range_m", result.sonar_range_m],
    [
      "pixel_resolution_m",
      result.pixel_resolution_m,
    ],
  ];

  for (const [name, value] of fields) {
    if (value !== null && value !== undefined) {
      result.detectedFields.push(name);
    }
  }

  if (result.side !== "unknown") {
    result.detectedFields.push("side");
  }

  return result;
}