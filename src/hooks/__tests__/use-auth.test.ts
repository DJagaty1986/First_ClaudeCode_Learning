import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "new-project-id" });
  });

  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    test("sets isLoading true during the call and false after it resolves", async () => {
      let resolveSignIn: (value: any) => void;
      (signInAction as any).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@example.com", "password123");
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveSignIn!({ success: true });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from the signIn action", async () => {
      (signInAction as any).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
      expect(signInResult).toEqual({ success: true });
    });

    test("on success with anonymous work, creates a project from it, clears it, and redirects", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      const anonMessages = [{ id: "1", role: "user", content: "Hello" }];
      const anonFileSystemData = { "/App.jsx": { type: "file", content: "x" } };
      (getAnonWorkData as any).mockReturnValue({
        messages: anonMessages,
        fileSystemData: anonFileSystemData,
      });
      (createProject as any).mockResolvedValue({ id: "anon-project-id" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonMessages,
          data: anonFileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      expect(getProjects).not.toHaveBeenCalled();
    });

    test("on success with no anonymous work but existing projects, redirects to the most recent project", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([
        { id: "recent-project" },
        { id: "older-project" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("on success with no anonymous work and no existing projects, creates a new empty project and redirects", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "brand-new-project" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });

    test("treats anonymous work with an empty messages array as no anonymous work", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue({ messages: [], fileSystemData: {} });
      (getProjects as any).mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    test("on failure, does not redirect or touch anonymous work/projects", async () => {
      (signInAction as any).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn("user@example.com", "wrong-password");
      });

      expect(signInResult).toEqual({
        success: false,
        error: "Invalid credentials",
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("resets isLoading even when the signIn action throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("user@example.com", "password123");
        })
      ).rejects.toThrow("network error");

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("returns the result from the signUp action", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp("new@example.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
      expect(signUpResult).toEqual({ success: true });
    });

    test("on success, runs the same post-auth redirect flow as signIn", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "recent-project" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
    });

    test("on failure, does not redirect", async () => {
      (signUpAction as any).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp("new@example.com", "password123");
      });

      expect(signUpResult).toEqual({
        success: false,
        error: "Email already registered",
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("sets isLoading true during the call and false after it resolves", async () => {
      let resolveSignUp: (value: any) => void;
      (signUpAction as any).mockReturnValue(
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
      );

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "password123");
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveSignUp!({ success: true });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
