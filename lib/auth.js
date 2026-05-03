import crypto from "crypto";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "mortgageiq-access-dev-secret-change-me";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "mortgageiq-refresh-dev-secret-change-me";
const ACCESS_EXPIRY = 60 * 60; // 15 minutes
const REFRESH_EXPIRY = 7 * 24 * 3600; // 7 days

function b64(str) {
  return Buffer.from(str).toString("base64url");
}
function db64(str) {
  return Buffer.from(str, "base64url").toString();
}

function signJWT(payload, secret, expiresIn) {
  const header = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }),
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token, secret) {
  try {
    const [h, p, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${h}.${p}`)
      .digest("base64url");
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    )
      return { valid: false, error: "Invalid signature" };
    const payload = JSON.parse(db64(p));
    if (payload.exp < Math.floor(Date.now() / 1000))
      return { valid: false, error: "Token expired" };
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Malformed token" };
  }
}

export function getEffectivePermissions(
  rolePerms = [],
  extra = [],
  denied = [],
) {
  const set = new Set([...rolePerms, ...extra]);
  denied.forEach((p) => set.delete(p));
  return [...set];
}

export function signAccessToken(user, role) {
  return signJWT(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: role.name,
      roleId: role._id.toString(),
      permissions: getEffectivePermissions(
        role.permissions,
        user.extraPermissions,
        user.deniedPermissions,
      ),
    },
    ACCESS_SECRET,
    ACCESS_EXPIRY,
  );
}

export function signRefreshToken(userId) {
  const jti = crypto.randomBytes(32).toString("hex");
  return signJWT(
    { sub: userId.toString(), jti },
    REFRESH_SECRET,
    REFRESH_EXPIRY,
  );
}

export function verifyAccessToken(token) {
  return verifyJWT(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
  return verifyJWT(token, REFRESH_SECRET);
}

export function extractToken(request) {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/access_token=([^;]+)/);
  return m ? m[1] : null;
}

export function extractRefreshToken(request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/refresh_token=([^;]+)/);
  return m ? m[1] : null;
}

const IS_PROD = process.env.NODE_ENV === "production";

export function buildAccessCookie(token) {
  return `access_token=${token}; HttpOnly; Path=/; Max-Age=${ACCESS_EXPIRY}; SameSite=Strict${IS_PROD ? "; Secure" : ""}`;
}

export function buildRefreshCookie(token) {
  return `refresh_token=${token}; HttpOnly; Path=/api/auth; Max-Age=${REFRESH_EXPIRY}; SameSite=Strict${IS_PROD ? "; Secure" : ""}`;
}

export function clearAuthCookies() {
  return [
    `access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`,
    `refresh_token=; HttpOnly; Path=/api/auth; Max-Age=0; SameSite=Strict`,
  ];
}
