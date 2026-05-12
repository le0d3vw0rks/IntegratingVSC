import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: unknown[]) => mockSignInAction(...args),
  signUp: (...args: unknown[]) => mockSignUpAction(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

const { useAuth } = await import("@/hooks/use-auth");

beforeEach(() => {
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("useAuth — signIn", () => {
  test("calls signInAction with the provided email and password", async () => {
    mockSignInAction.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("user@example.com", "secret"));

    expect(mockSignInAction).toHaveBeenCalledOnce();
    expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "secret");
  });

  test("returns the result from signInAction", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });
    const { result } = renderHook(() => useAuth());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrong");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  });

  test("sets isLoading to true while pending and false once settled", async () => {
    let resolveSignIn!: (v: { success: boolean }) => void;
    mockSignInAction.mockReturnValue(
      new Promise<{ success: boolean }>(res => { resolveSignIn = res; })
    );
    const { result } = renderHook(() => useAuth());

    // Fire without awaiting to observe in-flight state
    const promise = result.current.signIn("a@b.com", "pw");
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    resolveSignIn({ success: false });
    await act(async () => { await promise; });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signInAction throws", async () => {
    mockSignInAction.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn("a@b.com", "pw");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not navigate when sign-in fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — signUp", () => {
  test("calls signUpAction with the provided email and password", async () => {
    mockSignUpAction.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signUp("user@example.com", "secret"));

    expect(mockSignUpAction).toHaveBeenCalledOnce();
    expect(mockSignUpAction).toHaveBeenCalledWith("user@example.com", "secret");
  });

  test("returns the result from signUpAction", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email already taken" });
    const { result } = renderHook(() => useAuth());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.signUp("taken@example.com", "pw");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already taken" });
  });

  test("resets isLoading to false even when signUpAction throws", async () => {
    mockSignUpAction.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("a@b.com", "pw");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("does not navigate when sign-up fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signUp("a@b.com", "pw"));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — post-auth navigation (anon work with messages)", () => {
  const anonWork = {
    messages: [{ role: "user", content: "hello" }],
    fileSystemData: { "/App.tsx": "export default () => <div />" },
  };

  beforeEach(() => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(anonWork);
    mockCreateProject.mockResolvedValue({ id: "migrated-project" });
  });

  test("creates a project from anon work after successful sign-in", async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockCreateProject).toHaveBeenCalledOnce();
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      })
    );
  });

  test("clears anon work after migrating it", async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockClearAnonWork).toHaveBeenCalledOnce();
  });

  test("navigates to the migrated project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockPush).toHaveBeenCalledWith("/migrated-project");
  });

  test("does not call getProjects when anon work exists", async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockGetProjects).not.toHaveBeenCalled();
  });

  test("applies the same logic after successful sign-up", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("a@b.com", "pw"));

    expect(mockCreateProject).toHaveBeenCalledOnce();
    expect(mockClearAnonWork).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith("/migrated-project");
  });
});

describe("useAuth — post-auth navigation (anon work with no messages)", () => {
  beforeEach(() => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
  });

  test("falls through to getProjects when anon work has no messages", async () => {
    mockGetProjects.mockResolvedValue([{ id: "existing-1" }, { id: "existing-2" }]);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockGetProjects).toHaveBeenCalledOnce();
  });

  test("navigates to the most recent project when one exists", async () => {
    mockGetProjects.mockResolvedValue([{ id: "recent-project" }, { id: "older-project" }]);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockPush).toHaveBeenCalledWith("/recent-project");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });
});

describe("useAuth — post-auth navigation (no anon work)", () => {
  beforeEach(() => {
    mockSignInAction.mockResolvedValue({ success: true });
  });

  test("navigates to the most recent existing project", async () => {
    mockGetProjects.mockResolvedValue([{ id: "proj-1" }, { id: "proj-2" }]);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });

  test("creates a new project when the user has no existing projects", async () => {
    mockCreateProject.mockResolvedValue({ id: "brand-new" });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockCreateProject).toHaveBeenCalledOnce();
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
  });

  test("navigates to the newly created project when none exist", async () => {
    mockCreateProject.mockResolvedValue({ id: "brand-new" });
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signIn("a@b.com", "pw"));

    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });
});
