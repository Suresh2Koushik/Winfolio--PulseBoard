import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";

// Cast of characters
const ADMIN = "admin1";
const MGR = "manager1"; // manages EMP
const MGR2 = "manager2"; // manages nobody here
const EMP = "employee1"; // reports to MGR
const OTHER = "employee2"; // no manager

let env: RulesTestEnvironment;

const asUser = (uid: string) =>
  env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const profile = (uid: string, role: string, extra: Record<string, unknown> = {}) => ({
  email: `${uid}@example.com`,
  fullName: uid,
  role,
  team: "Engineering",
  managerId: null,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...extra,
});

const validActivity = (userId: string) => ({
  userId,
  date: "2026-10-15",
  weekNumber: 42,
  quarter: "Q4",
  title: "Shipped feature",
  description: "desc",
  category: "Delivery",
  teams: ["Product"],
  impactNotes: "",
  status: "Done",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validCheckIn = (userId: string, managerId: string | null) => ({
  userId,
  managerId,
  weekStart: "2026-10-12",
  weekEnd: "2026-10-18",
  workSummary: "Worked on things",
  linkedGoalIds: [],
  categories: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validGoal = (userId: string, managerId: string | null) => ({
  userId,
  managerId,
  title: "Grow",
  priority: "high",
  status: "on_track",
  progress: 10,
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  linkedCheckInIds: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pulseboard",
    firestore: {
      rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8085,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", ADMIN), profile(ADMIN, "admin"));
    await setDoc(doc(db, "users", MGR), profile(MGR, "manager"));
    await setDoc(doc(db, "users", MGR2), profile(MGR2, "manager"));
    await setDoc(doc(db, "users", EMP), profile(EMP, "employee", { managerId: MGR, managerName: MGR }));
    await setDoc(doc(db, "users", OTHER), profile(OTHER, "employee"));
    await setDoc(doc(db, "managerDirectory", MGR), { fullName: MGR });
    await setDoc(doc(db, "managerDirectory", MGR2), { fullName: MGR2 });
    await setDoc(doc(db, "managerDirectory", ADMIN), { fullName: ADMIN });
  });
});

describe("users: registration", () => {
  const newProfile = (uid: string, extra: Record<string, unknown> = {}) => ({
    email: `${uid}@example.com`,
    fullName: "New Person",
    role: "employee",
    managerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra,
  });

  it("a new user can create their own employee profile", async () => {
    await assertSucceeds(setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie")));
  });

  it("cannot self-register as manager or admin", async () => {
    await assertFails(setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie", { role: "manager" })));
    await assertFails(setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie", { role: "admin" })));
  });

  it("cannot create a profile for someone else", async () => {
    await assertFails(setDoc(doc(asUser("newbie"), "users", "victim"), newProfile("victim")));
  });

  it("cannot register with a manager already attached", async () => {
    await assertFails(setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie", { managerId: MGR })));
  });

  it("cannot register with someone else's email", async () => {
    await assertFails(
      setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie", { email: "ceo@example.com" })),
    );
  });

  it("cannot add arbitrary fields", async () => {
    await assertFails(setDoc(doc(asUser("newbie"), "users", "newbie"), newProfile("newbie", { isAdmin: true })));
  });
});

describe("users: privilege escalation", () => {
  it("an employee cannot promote themselves", async () => {
    await assertFails(updateDoc(doc(asUser(EMP), "users", EMP), { role: "admin" }));
    await assertFails(updateDoc(doc(asUser(EMP), "users", EMP), { role: "manager" }));
  });

  it("a manager cannot promote themselves or others", async () => {
    await assertFails(updateDoc(doc(asUser(MGR), "users", MGR), { role: "admin" }));
    await assertFails(updateDoc(doc(asUser(MGR), "users", OTHER), { role: "manager" }));
  });

  it("an admin can change roles", async () => {
    await assertSucceeds(updateDoc(doc(asUser(ADMIN), "users", OTHER), { role: "manager" }));
  });

  it("an employee cannot write to the manager directory", async () => {
    await assertFails(setDoc(doc(asUser(EMP), "managerDirectory", EMP), { fullName: "me" }));
  });

  it("an admin can write to the manager directory", async () => {
    await assertSucceeds(setDoc(doc(asUser(ADMIN), "managerDirectory", OTHER), { fullName: OTHER }));
  });
});

describe("users: profile edits", () => {
  it("can change own team", async () => {
    await assertSucceeds(updateDoc(doc(asUser(EMP), "users", EMP), { team: "Product" }));
  });

  it("can set a known job function but not an arbitrary value", async () => {
    await assertSucceeds(updateDoc(doc(asUser(EMP), "users", EMP), { jobFunction: "engineering" }));
    await assertFails(updateDoc(doc(asUser(EMP), "users", EMP), { jobFunction: "ceo" }));
  });

  it("can pick a manager from the directory", async () => {
    await assertSucceeds(updateDoc(doc(asUser(OTHER), "users", OTHER), { managerId: MGR, managerName: MGR }));
  });

  it("cannot pick a non-manager or themselves as manager", async () => {
    await assertFails(updateDoc(doc(asUser(OTHER), "users", OTHER), { managerId: EMP }));
    await assertFails(updateDoc(doc(asUser(OTHER), "users", OTHER), { managerId: OTHER }));
  });

  it("cannot change own email", async () => {
    await assertFails(updateDoc(doc(asUser(EMP), "users", EMP), { email: "x@example.com" }));
  });

  it("cannot edit another user's profile", async () => {
    await assertFails(updateDoc(doc(asUser(EMP), "users", OTHER), { team: "hacked" }));
  });
});

describe("users: reads", () => {
  it("signed-out visitors cannot read users or the directory", async () => {
    await assertFails(getDoc(doc(anon(), "users", EMP)));
    await assertFails(getDocs(collection(anon(), "managerDirectory")));
  });

  it("a user reads their own profile but not a peer's", async () => {
    await assertSucceeds(getDoc(doc(asUser(EMP), "users", EMP)));
    await assertFails(getDoc(doc(asUser(EMP), "users", OTHER)));
  });

  it("a manager reads direct reports only", async () => {
    await assertSucceeds(getDoc(doc(asUser(MGR), "users", EMP)));
    await assertFails(getDoc(doc(asUser(MGR), "users", OTHER)));
    await assertFails(getDoc(doc(asUser(MGR2), "users", EMP)));
  });

  it("a manager can list their reports but not all users", async () => {
    await assertSucceeds(getDocs(query(collection(asUser(MGR), "users"), where("managerId", "==", MGR))));
    await assertFails(getDocs(collection(asUser(MGR), "users")));
  });

  it("an admin can list all users", async () => {
    await assertSucceeds(getDocs(collection(asUser(ADMIN), "users")));
  });

  it("signed-in users can read the manager directory", async () => {
    await assertSucceeds(getDocs(collection(asUser(OTHER), "managerDirectory")));
  });
});

describe("activities", () => {
  it("owner can create, read, update, delete", async () => {
    const db = asUser(EMP);
    const ref = await assertSucceeds(addDoc(collection(db, "activities"), validActivity(EMP)));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { title: "Renamed", updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
  });

  it("owner can query their own activities", async () => {
    await assertSucceeds(
      getDocs(query(collection(asUser(EMP), "activities"), where("userId", "==", EMP), orderBy("date", "desc"))),
    );
  });

  it("cannot create an activity for someone else", async () => {
    await assertFails(addDoc(collection(asUser(EMP), "activities"), validActivity(OTHER)));
  });

  it("rejects invalid status and client-chosen createdAt", async () => {
    await assertFails(addDoc(collection(asUser(EMP), "activities"), { ...validActivity(EMP), status: "Hacked" }));
    await assertFails(
      addDoc(collection(asUser(EMP), "activities"), { ...validActivity(EMP), createdAt: Timestamp.fromMillis(0) }),
    );
  });

  it("peers and managers cannot read someone's activities; admins can", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const r = await addDoc(collection(ctx.firestore(), "activities"), { ...validActivity(EMP), createdAt: Timestamp.now() });
      id = r.id;
    });
    await assertFails(getDoc(doc(asUser(OTHER), "activities", id)));
    await assertFails(getDoc(doc(asUser(MGR), "activities", id)));
    await assertSucceeds(getDoc(doc(asUser(ADMIN), "activities", id)));
    await assertFails(getDocs(query(collection(asUser(OTHER), "activities"), where("userId", "==", EMP))));
  });

  it("cannot steal an activity by changing userId", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const r = await addDoc(collection(ctx.firestore(), "activities"), { ...validActivity(EMP), createdAt: Timestamp.now() });
      id = r.id;
    });
    await assertFails(updateDoc(doc(asUser(EMP), "activities", id), { userId: OTHER }));
  });
});

describe("check-ins and goals: manager visibility", () => {
  it("employee writes check-ins tagged with their real manager", async () => {
    await assertSucceeds(addDoc(collection(asUser(EMP), "checkIns"), validCheckIn(EMP, MGR)));
  });

  it("employee cannot tag a different manager or hide from theirs", async () => {
    await assertFails(addDoc(collection(asUser(EMP), "checkIns"), validCheckIn(EMP, MGR2)));
    await assertFails(addDoc(collection(asUser(EMP), "checkIns"), validCheckIn(EMP, null)));
  });

  it("employee with no manager writes untagged check-ins", async () => {
    await assertSucceeds(addDoc(collection(asUser(OTHER), "checkIns"), validCheckIn(OTHER, null)));
  });

  it("manager reads and lists reports' check-ins; others cannot", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const r = await addDoc(collection(ctx.firestore(), "checkIns"), { ...validCheckIn(EMP, MGR), createdAt: Timestamp.now() });
      id = r.id;
    });
    await assertSucceeds(getDoc(doc(asUser(MGR), "checkIns", id)));
    await assertSucceeds(
      getDocs(query(collection(asUser(MGR), "checkIns"), where("managerId", "==", MGR), orderBy("weekStart", "desc"))),
    );
    await assertFails(getDoc(doc(asUser(MGR2), "checkIns", id)));
    await assertFails(getDoc(doc(asUser(OTHER), "checkIns", id)));
    await assertFails(getDocs(query(collection(asUser(MGR2), "checkIns"), where("managerId", "==", MGR))));
  });

  it("a demoted manager immediately loses access to former reports", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const r = await addDoc(collection(db, "checkIns"), { ...validCheckIn(EMP, MGR), createdAt: Timestamp.now() });
      id = r.id;
      await updateDoc(doc(db, "users", MGR), { role: "employee" });
    });
    await assertFails(getDoc(doc(asUser(MGR), "checkIns", id)));
    await assertFails(getDoc(doc(asUser(MGR), "users", EMP)));
    await assertFails(getDocs(query(collection(asUser(MGR), "users"), where("managerId", "==", MGR))));
  });

  it("manager cannot edit a report's check-in", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const r = await addDoc(collection(ctx.firestore(), "checkIns"), { ...validCheckIn(EMP, MGR), createdAt: Timestamp.now() });
      id = r.id;
    });
    await assertFails(updateDoc(doc(asUser(MGR), "checkIns", id), { workSummary: "edited" }));
  });

  it("goals follow the same model", async () => {
    await assertSucceeds(addDoc(collection(asUser(EMP), "goals"), validGoal(EMP, MGR)));
    await assertFails(addDoc(collection(asUser(EMP), "goals"), validGoal(EMP, MGR2)));
    await assertFails(addDoc(collection(asUser(EMP), "goals"), { ...validGoal(EMP, MGR), progress: 150 }));
    await assertSucceeds(
      getDocs(query(collection(asUser(EMP), "goals"), where("userId", "==", EMP), orderBy("endDate", "asc"))),
    );
    await assertSucceeds(getDocs(query(collection(asUser(MGR), "goals"), where("managerId", "==", MGR))));
    await assertFails(getDocs(query(collection(asUser(MGR2), "goals"), where("managerId", "==", MGR))));
  });
});

describe("feedback and action items", () => {
  const feedback = (managerId: string, employeeId: string) => ({
    managerId,
    managerName: managerId,
    employeeId,
    employeeName: employeeId,
    content: "Great work",
    acknowledged: false,
    createdAt: serverTimestamp(),
  });

  const actionItem = (assignedById: string, employeeId: string) => ({
    employeeId,
    assignedById,
    title: "Write the doc",
    dueDate: "2026-11-01",
    status: "open",
    createdAt: serverTimestamp(),
  });

  it("a manager can give feedback to a direct report", async () => {
    await assertSucceeds(addDoc(collection(asUser(MGR), "feedback"), feedback(MGR, EMP)));
  });

  it("a manager cannot give feedback to someone else's report", async () => {
    await assertFails(addDoc(collection(asUser(MGR2), "feedback"), feedback(MGR2, EMP)));
  });

  it("an employee cannot create feedback or impersonate a manager", async () => {
    await assertFails(addDoc(collection(asUser(OTHER), "feedback"), feedback(OTHER, EMP)));
    await assertFails(addDoc(collection(asUser(MGR2), "feedback"), feedback(MGR, EMP)));
  });

  it("the employee can acknowledge but not rewrite feedback; peers cannot read", async () => {
    let id = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const r = await addDoc(collection(ctx.firestore(), "feedback"), { ...feedback(MGR, EMP), createdAt: Timestamp.now() });
      id = r.id;
    });
    await assertSucceeds(getDocs(query(collection(asUser(EMP), "feedback"), where("employeeId", "==", EMP))));
    await assertSucceeds(getDocs(query(collection(asUser(MGR), "feedback"), where("managerId", "==", MGR))));
    await assertFails(updateDoc(doc(asUser(EMP), "feedback", id), { content: "I am the best" }));
    await assertSucceeds(
      updateDoc(doc(asUser(EMP), "feedback", id), { acknowledged: true, acknowledgedAt: serverTimestamp() }),
    );
    await assertFails(getDoc(doc(asUser(OTHER), "feedback", id)));
  });

  it("action items: manager assigns, employee completes, employee cannot retitle", async () => {
    const ref = await assertSucceeds(addDoc(collection(asUser(MGR), "actionItems"), actionItem(MGR, EMP)));
    await assertFails(addDoc(collection(asUser(MGR2), "actionItems"), actionItem(MGR2, EMP)));
    const empRef = doc(asUser(EMP), "actionItems", ref.id);
    await assertSucceeds(updateDoc(empRef, { status: "completed", completedAt: serverTimestamp() }));
    await assertFails(updateDoc(empRef, { title: "Nothing to do" }));
    await assertFails(getDoc(doc(asUser(OTHER), "actionItems", ref.id)));
  });
});

describe("platform collections", () => {
  it("audit logs are append-only and admin-readable", async () => {
    const ref = await assertSucceeds(
      addDoc(collection(asUser(EMP), "auditLogs"), {
        userId: EMP,
        userName: EMP,
        actionType: "goal_created",
        entityType: "goal",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      addDoc(collection(asUser(EMP), "auditLogs"), {
        userId: OTHER,
        userName: OTHER,
        actionType: "x",
        entityType: "y",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(doc(asUser(EMP), "auditLogs", ref.id)));
    await assertSucceeds(getDoc(doc(asUser(ADMIN), "auditLogs", ref.id)));
    await assertFails(deleteDoc(doc(asUser(ADMIN), "auditLogs", ref.id)));
  });

  it("change logs are readable by members, writable by admins only", async () => {
    await assertSucceeds(getDocs(collection(asUser(EMP), "changeLogs")));
    await assertFails(setDoc(doc(asUser(EMP), "changeLogs", "x"), { title: "fake" }));
    await assertSucceeds(setDoc(doc(asUser(ADMIN), "changeLogs", "x"), { title: "real" }));
  });

  it("unknown collections are denied", async () => {
    await assertFails(setDoc(doc(asUser(ADMIN), "secrets", "x"), { a: 1 }));
    await assertFails(getDocs(collection(asUser(ADMIN), "secrets")));
  });
});
