import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getBytes } from "firebase/storage";

let env: RulesTestEnvironment;

const small = new Uint8Array([1, 2, 3]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pulseboard",
    storage: {
      rules: readFileSync(resolve(__dirname, "../../storage.rules"), "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("activity attachments", () => {
  it("owner can upload and read an allowed file type", async () => {
    const storage = env.authenticatedContext("alice").storage();
    const r = ref(storage, "activities/alice/report.pdf");
    await assertSucceeds(uploadBytes(r, small, { contentType: "application/pdf" }));
    await assertSucceeds(getBytes(r));
  });

  it("cannot upload into someone else's folder", async () => {
    const storage = env.authenticatedContext("mallory").storage();
    await assertFails(uploadBytes(ref(storage, "activities/alice/evil.png"), small, { contentType: "image/png" }));
  });

  it("cannot read someone else's file", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), "activities/alice/private.png"), small, { contentType: "image/png" });
    });
    const storage = env.authenticatedContext("mallory").storage();
    await assertFails(getBytes(ref(storage, "activities/alice/private.png")));
  });

  it("rejects disallowed content types and oversized files", async () => {
    const storage = env.authenticatedContext("alice").storage();
    await assertFails(
      uploadBytes(ref(storage, "activities/alice/run.exe"), small, { contentType: "application/x-msdownload" }),
    );
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    await assertFails(uploadBytes(ref(storage, "activities/alice/huge.png"), big, { contentType: "image/png" }));
  });

  it("signed-out visitors can do nothing", async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, "activities/alice/report.pdf")));
    await assertFails(uploadBytes(ref(storage, "activities/alice/x.png"), small, { contentType: "image/png" }));
  });
});
