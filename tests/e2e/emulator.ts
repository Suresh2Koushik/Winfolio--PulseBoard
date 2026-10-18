// Helpers that talk to the local Firebase emulators directly (bypassing security
// rules with the emulator-only "owner" token). Used to seed the first admin, which
// in production is a one-time manual step in the Firebase console.

const PROJECT = "demo-pulseboard";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8085";

export async function resetEmulators() {
  await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

async function createAuthUser(email: string, password: string, displayName: string): Promise<string> {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`signUp failed: ${JSON.stringify(body)}`);
  return body.localId as string;
}

type Value = { stringValue: string } | { nullValue: null } | { timestampValue: string };
const str = (v: string): Value => ({ stringValue: v });

async function writeDoc(path: string, fields: Record<string, Value>) {
  const res = await fetch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!res.ok) throw new Error(`write ${path} failed: ${await res.text()}`);
}

/** Creates an admin account the same way an operator would bootstrap production. */
export async function seedAdmin(email: string, password: string, fullName: string) {
  const uid = await createAuthUser(email, password, fullName);
  const now = { timestampValue: new Date().toISOString() };
  await writeDoc(`users/${uid}`, {
    email: str(email),
    fullName: str(fullName),
    role: str("admin"),
    team: str("Leadership"),
    managerId: { nullValue: null },
    createdAt: now,
    updatedAt: now,
  });
  await writeDoc(`managerDirectory/${uid}`, { fullName: str(fullName), updatedAt: now });
  return uid;
}
