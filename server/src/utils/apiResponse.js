export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, code, message, status = 400) {
  return res.status(status).json({ success: false, error: { code, message } });
}