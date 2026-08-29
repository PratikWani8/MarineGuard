import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ok, fail } from "../utils/apiResponse.js";

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register(req, res) {
  const { name, email, password, role = "operator" } = req.body;

  if (!name || !email || !password) return fail(res, "VALIDATION_ERROR", "name, email and password are required");
  if (password.length < 8) return fail(res, "VALIDATION_ERROR", "Password must be at least 8 characters");
  if (!["admin", "operator", "researcher"].includes(role)) return fail(res, "VALIDATION_ERROR", "Invalid role");

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return fail(res, "EMAIL_EXISTS", "Email already registered", 409);

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), password: hash, role });

  return ok(res, {
    token: tokenFor(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  }, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "VALIDATION_ERROR", "email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  return ok(res, {
    token: tokenFor(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
}

export async function me(req, res) {
  return ok(res, { user: req.user });
}