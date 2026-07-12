import type {
  Account,
  AdminStats,
  ApiEnvelope,
  EventDetail,
  EventInput,
  EventSummary,
  LoginInput,
  Page,
  Post,
  PostComment,
  PostInput,
  ChatConversation,
  ChatMessage,
  ChatRoom,
  GroupMessage,
  Notification,
  PublicProfile,
  LeaderboardEntry,
  QrPayload,
  RegistrationInput,
  Certificate,
  Badge,
  BadgeInput,
  UserBadge,
  AiChatRequest,
  AiChatResponse,
  AiEventSuggestRequest,
  AiEventSuggestResponse,
  CheckinRequest,
  CheckinResponse,
  EventStatsResponse,
  ParticipantResponse,
  CoinTransactionResponse,
  UserResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types";

type ErrorPayload = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const statusMessages: Record<number, string> = {
  400: "Please check the highlighted information and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested item could not be found.",
  409: "This action conflicts with an existing record.",
  500: "The server could not complete the request. Please try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  notifyUnauthorized = true,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ErrorPayload)
    : {};

  if (!response.ok) {
    if (response.status === 401 && notifyUnauthorized && typeof window !== "undefined") {
      window.dispatchEvent(new Event("ween:unauthorized"));
    }
    throw new ApiError(
      payload.message || statusMessages[response.status] || "Something went wrong. Please try again.",
      response.status,
      payload.fieldErrors,
    );
  }

  return payload as T;
}

function backend<T>(path: string, options?: RequestInit) {
  return request<ApiEnvelope<T>>(`/api/backend${path}`, options).then((result) => result.data);
}

function backendRaw<T>(path: string, options?: RequestInit) {
  return request<T>(`/api/backend${path}`, options);
}

function multipart(payload: unknown, files: Array<{ name: string; file?: File }> = []) {
  const body = new FormData();
  body.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  files.forEach(({ name, file }) => { if (file) body.append(name, file); });
  return body;
}

async function backendBlob(path: string) {
  const response = await fetch(`/api/backend${path}`, { cache: "no-store" });
  if (!response.ok) {
    const payload = response.headers.get("content-type")?.includes("application/json")
      ? await response.json() as ErrorPayload
      : {};
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("ween:unauthorized"));
    throw new ApiError(payload.message || statusMessages[response.status] || "Download failed.", response.status);
  }
  return response.blob();
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const authApi = {
  session: () => request<{ account: Account }>("/api/auth/session", {}, false),
  login: (input: LoginInput) =>
    request<{ account: Account }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }, false),
  register: (input: RegistrationInput) =>
    request<{ account: Account }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }, false),
  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }, false),
  forgotPassword: (email: string) =>
    backend<null>("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (input: ResetPasswordRequest) =>
    backend<null>("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify(input) }),
  changePassword: (input: ChangePasswordRequest) =>
    backend<null>("/api/v1/auth/change-password", { method: "POST", body: JSON.stringify(input) }),
  verifyEmail: (token: string) =>
    backend<null>("/api/v1/auth/verify-token", { method: "POST", body: JSON.stringify({ token }) }),
  resendVerificationEmail: () =>
    backend<null>("/api/v1/auth/verify-token", { method: "GET" }),
};