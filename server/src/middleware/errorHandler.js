export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, error: { code: "FILE_TOO_LARGE", message: "Uploaded file exceeds the configured limit" } });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: Object.values(err.errors).map(e => e.message).join(", ") } });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: status >= 500 ? "Internal server error" : err.message
    }
  });
}