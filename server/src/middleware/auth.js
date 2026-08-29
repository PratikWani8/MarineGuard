import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User no longer exists" } });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
    }
    next();
  };
}