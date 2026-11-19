const PIN_ITERATIONS = 210_000;

type StoredPin = {
  digest: string;
  iterations: number;
  salt: string;
  version: 1;
};

function storageKey(namespace: string, profileId: string) {
  return `${namespace}:pin:${profileId}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derivePinDigest(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations,
      name: "PBKDF2",
      salt,
    },
    key,
    256,
  );

  return new Uint8Array(bits);
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function hasLocalPin(namespace: string, profileId: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey(namespace, profileId)) !== null;
}

export async function saveLocalPin(
  namespace: string,
  profileId: string,
  pin: string,
) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const digest = await derivePinDigest(pin, salt, PIN_ITERATIONS);
  const storedPin: StoredPin = {
    digest: bytesToBase64(digest),
    iterations: PIN_ITERATIONS,
    salt: bytesToBase64(salt),
    version: 1,
  };

  window.localStorage.setItem(
    storageKey(namespace, profileId),
    JSON.stringify(storedPin),
  );
}

export async function verifyLocalPin(
  namespace: string,
  profileId: string,
  pin: string,
) {
  const serializedPin = window.localStorage.getItem(
    storageKey(namespace, profileId),
  );
  if (!serializedPin) return false;

  try {
    const storedPin = JSON.parse(serializedPin) as StoredPin;
    if (storedPin.version !== 1 || storedPin.iterations < 100_000) return false;

    const salt = base64ToBytes(storedPin.salt);
    const expectedDigest = base64ToBytes(storedPin.digest);
    const actualDigest = await derivePinDigest(
      pin,
      salt,
      storedPin.iterations,
    );
    return equalBytes(actualDigest, expectedDigest);
  } catch {
    return false;
  }
}

export function removeLocalPin(namespace: string, profileId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(namespace, profileId));
}
