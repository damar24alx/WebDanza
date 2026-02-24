import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

function toHex(buffer: Uint8Array) {
  return Buffer.from(buffer).toString("hex");
}

function fromHex(value: string) {
  return Buffer.from(value, "hex");
}

export function hashPassword(password: string) {
  const normalized = password.normalize("NFKC");
  const salt = randomBytes(16);
  const hash = scryptSync(normalized, salt, SCRYPT_KEYLEN);

  return `${toHex(salt)}:${toHex(hash)}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const normalized = password.normalize("NFKC");
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);
  const computed = scryptSync(normalized, salt, expected.length);

  if (computed.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(computed, expected);
}
