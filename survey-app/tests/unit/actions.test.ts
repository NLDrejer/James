import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirect = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });

  const revalidatePath = vi.fn();
  const headers = vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.10" }));
  const setSessionUsername = vi.fn();
  const getSessionUsername = vi.fn();
  const clearSession = vi.fn();
  const isAdminUsername = vi.fn();

  const db = {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      questions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      answers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return {
    redirect,
    revalidatePath,
    headers,
    setSessionUsername,
    getSessionUsername,
    clearSession,
    isAdminUsername,
    db,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/db", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/session", () => ({
  setSessionUsername: mocks.setSessionUsername,
  getSessionUsername: mocks.getSessionUsername,
  clearSession: mocks.clearSession,
  isAdminUsername: mocks.isAdminUsername,
}));

const { login, submitAnswer, addQuestion, deleteQuestion } = await import("@/app/actions");

function makeInsertChain() {
  const onConflictDoNothing = vi.fn();
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  return { insert, values, onConflictDoNothing };
}

function makeUpdateChain() {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { update, set, where };
}

function makeDeleteChain() {
  const where = vi.fn();
  const del = vi.fn(() => ({ where }));
  return { del, where };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.10" }));
  mocks.isAdminUsername.mockReturnValue(false);
});

describe("server actions", () => {
  it("login creates a user, sets the session, and redirects admins to /admin", async () => {
    const insertChain = makeInsertChain();
    mocks.db.query.users.findFirst.mockResolvedValue(null);
    mocks.db.insert.mockImplementation(() => insertChain);
    mocks.isAdminUsername.mockReturnValue(true);

    const formData = new FormData();
    formData.set("username", "admin");

    await expect(login(formData)).rejects.toThrow("REDIRECT:/admin");

    expect(mocks.db.query.users.findFirst).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith({ username: "admin" });
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mocks.setSessionUsername).toHaveBeenCalledWith("admin");
  });

  it("submitAnswer inserts a new answer and revalidates the survey", async () => {
    const insertChain = makeInsertChain();
    mocks.getSessionUsername.mockResolvedValue("alice");
    mocks.db.query.users.findFirst.mockResolvedValue({ id: 7, username: "alice" });
    mocks.db.query.answers.findFirst.mockResolvedValue(null);
    mocks.db.insert.mockImplementation(() => insertChain);

    const formData = new FormData();
    formData.set("answer", "  Blue  ");

    await submitAnswer(12, formData);

    expect(mocks.db.query.answers.findFirst).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith({
      userId: 7,
      questionId: 12,
      answerText: "Blue",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/survey");
  });

  it("submitAnswer updates an existing answer in place", async () => {
    const updateChain = makeUpdateChain();
    mocks.getSessionUsername.mockResolvedValue("alice");
    mocks.db.query.users.findFirst.mockResolvedValue({ id: 7, username: "alice" });
    mocks.db.query.answers.findFirst.mockResolvedValue({ id: 99, userId: 7, questionId: 12 });
    mocks.db.update.mockImplementation(() => updateChain);

    const formData = new FormData();
    formData.set("answer", "  Green  ");

    await submitAnswer(12, formData);

    expect(updateChain.set).toHaveBeenCalledWith({ answerText: "Green" });
    expect(updateChain.where).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/survey");
  });

  it("addQuestion appends the next order and revalidates admin and survey", async () => {
    const insertChain = makeInsertChain();
    mocks.getSessionUsername.mockResolvedValue("admin");
    mocks.isAdminUsername.mockReturnValue(true);
    mocks.db.query.questions.findMany.mockResolvedValue([{ order: 7 }]);
    mocks.db.insert.mockImplementation(() => insertChain);

    const formData = new FormData();
    formData.set("text", "  What should we build next?  ");

    await addQuestion(formData);

    expect(insertChain.values).toHaveBeenCalledWith({
      text: "What should we build next?",
      order: 8,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/survey");
  });

  it("deleteQuestion removes the requested question and revalidates cached pages", async () => {
    const deleteChain = makeDeleteChain();
    mocks.getSessionUsername.mockResolvedValue("admin");
    mocks.isAdminUsername.mockReturnValue(true);
    mocks.db.delete.mockImplementation(() => deleteChain);

    await deleteQuestion(42);

    expect(deleteChain.where).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/survey");
  });
});
