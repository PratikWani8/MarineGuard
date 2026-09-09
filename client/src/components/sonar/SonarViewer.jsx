import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

export default function SonarViewer({
  src,
  detections = []
}) {
  const imageRef = useRef(null);

  const [imageRect, setImageRect] =
    useState({
      width: 0,
      height: 0
    });

  const [naturalSize, setNaturalSize] =
    useState({
      width: 0,
      height: 0
    });

  const [selectedDetection, setSelectedDetection] =
    useState(null);

  /* =========================================================
     NORMALIZE DETECTIONS
  ========================================================= */

  const normalizedDetections = useMemo(() => {
    if (!Array.isArray(detections)) {
      return [];
    }

    return detections
      .map((detection, index) => {
        const rawBox =
          detection?.boundingBox ??
          detection?.bounding_box ??
          detection?.bbox ??
          {};

        let x1 = Number(
          rawBox.x1 ??
          rawBox.left ??
          rawBox.x ??
          0
        );

        let y1 = Number(
          rawBox.y1 ??
          rawBox.top ??
          rawBox.y ??
          0
        );

        let x2 = Number(
          rawBox.x2 ??
          rawBox.right ??
          0
        );

        let y2 = Number(
          rawBox.y2 ??
          rawBox.bottom ??
          0
        );

        /*
         * Support x/y/width/height format.
         */
        if (
          rawBox.width !== undefined &&
          rawBox.height !== undefined &&
          (x2 <= x1 || y2 <= y1)
        ) {
          x2 =
            x1 +
            Number(rawBox.width);

          y2 =
            y1 +
            Number(rawBox.height);
        }

        const confidenceRaw = Number(
          detection?.confidence ?? 0
        );

        const confidence =
          confidenceRaw <= 1
            ? confidenceRaw * 100
            : confidenceRaw;

        return {
          ...detection,

          id:
            detection?.detectionId ??
            detection?.detection_id ??
            detection?._id ??
            `detection-${index}`,

          classification:
            detection?.classification ??
            detection?.class ??
            detection?.label ??
            "Unknown",

          confidence,

          riskLevel:
            detection?.riskLevel ??
            detection?.risk_level ??
            "LOW",

          hazardScore:
            Number(
              detection?.hazardScore ??
              detection?.hazard_score ??
              0
            ),

          bbox: {
            x1,
            y1,
            x2,
            y2
          }
        };
      })
      .filter((detection) => {
        const {
          x1,
          y1,
          x2,
          y2
        } = detection.bbox;

        return (
          Number.isFinite(x1) &&
          Number.isFinite(y1) &&
          Number.isFinite(x2) &&
          Number.isFinite(y2) &&
          x2 > x1 &&
          y2 > y1
        );
      });
  }, [detections]);


  /* =========================================================
     UPDATE IMAGE DIMENSIONS
  ========================================================= */

  const updateImageSize = () => {
    const image = imageRef.current;

    if (!image) {
      return;
    }

    const rect =
      image.getBoundingClientRect();

    setImageRect({
      width: rect.width,
      height: rect.height
    });

    setNaturalSize({
      width: image.naturalWidth,
      height: image.naturalHeight
    });
  };


  /* =========================================================
     IMAGE LOAD
  ========================================================= */

  const handleImageLoad = () => {
    updateImageSize();
  };


  /* =========================================================
     RESIZE OBSERVER
  ========================================================= */

  useEffect(() => {
    const image = imageRef.current;

    if (!image) {
      return;
    }

    updateImageSize();

    const observer =
      new ResizeObserver(() => {
        updateImageSize();
      });

    observer.observe(image);

    window.addEventListener(
      "resize",
      updateImageSize
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        updateImageSize
      );
    };
  }, [src]);


  /* =========================================================
     BOUNDING BOX STYLE
  ========================================================= */

  const getBoxStyle = (
    detection
  ) => {
    if (
      !naturalSize.width ||
      !naturalSize.height ||
      !imageRect.width ||
      !imageRect.height
    ) {
      return {
        display: "none"
      };
    }

    const {
      x1,
      y1,
      x2,
      y2
    } = detection.bbox;

    const scaleX =
      imageRect.width /
      naturalSize.width;

    const scaleY =
      imageRect.height /
      naturalSize.height;

    const left =
      x1 * scaleX;

    const top =
      y1 * scaleY;

    const width =
      (x2 - x1) * scaleX;

    const height =
      (y2 - y1) * scaleY;

    return {
      position: "absolute",

      left: `${left}px`,
      top: `${top}px`,

      width: `${width}px`,
      height: `${height}px`,

      border:
        "2px solid rgb(34 211 238)",

      background:
        "rgba(34, 211, 238, 0.08)",

      zIndex: 30,

      cursor: "pointer",

      pointerEvents: "auto"
    };
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[.035] p-4">

      {/* HEADER */}

      <div className="mb-3 flex items-center justify-between">

        <div>
          <h2 className="font-semibold text-slate-100">
            Sonar image
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {normalizedDetections.length}{" "}
            detection
            {normalizedDetections.length === 1
              ? ""
              : "s"}{" "}
            found
          </p>
        </div>

      </div>


      {/* IMAGE */}

      <div className="relative flex min-h-[420px] max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-xl bg-black/40">

        {src ? (
          /*
           * IMPORTANT:
           * The wrapper is sized exactly to the image.
           * Bounding boxes are children of this wrapper.
           */
          <div className="relative max-h-[75vh] max-w-full">

            <img
              ref={imageRef}
              src={src}
              alt="Side-scan sonar"
              onLoad={handleImageLoad}
              draggable={false}
              className="block max-h-[75vh] max-w-full object-contain"
            />


            {/* DETECTION BOXES */}

            {normalizedDetections.map(
              (detection) => (
                <div
                  key={detection.id}
                  style={getBoxStyle(
                    detection
                  )}
                  onClick={() =>
                    setSelectedDetection(
                      detection
                    )
                  }
                >

                  {/* LABEL */}

                  <div className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-cyan-400 px-2 py-1 text-[10px] font-bold capitalize text-slate-950 shadow-lg">
                    {String(
                      detection.classification
                    ).replaceAll(
                      "_",
                      " "
                    )}

                    {" • "}

                    {detection.confidence.toFixed(
                      0
                    )}
                    %
                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Sonar image unavailable.
          </div>
        )}

      </div>


      {/* SELECTED DETECTION */}

      {selectedDetection && (
        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300">
                Detection
              </p>

              <h3 className="mt-1 text-lg font-semibold capitalize">
                {String(
                  selectedDetection.classification
                ).replaceAll(
                  "_",
                  " "
                )}
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedDetection(
                  null
                )
              }
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>

          </div>


          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div>
              <p className="text-xs text-slate-500">
                Confidence
              </p>

              <p className="mt-1 font-semibold">
                {selectedDetection.confidence.toFixed(
                  1
                )}
                %
              </p>
            </div>


            <div>
              <p className="text-xs text-slate-500">
                Risk
              </p>

              <p className="mt-1 font-semibold">
                {selectedDetection.riskLevel}
              </p>
            </div>


            <div>
              <p className="text-xs text-slate-500">
                Hazard
              </p>

              <p className="mt-1 font-semibold">
                {selectedDetection.hazardScore}
                /100
              </p>
            </div>


            <div>
              <p className="text-xs text-slate-500">
                Bounding box
              </p>

              <p className="mt-1 text-xs text-slate-300">
                {Math.round(
                  selectedDetection.bbox.x1
                )}
                ,
                {Math.round(
                  selectedDetection.bbox.y1
                )}
                {" → "}
                {Math.round(
                  selectedDetection.bbox.x2
                )}
                ,
                {Math.round(
                  selectedDetection.bbox.y2
                )}
              </p>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}