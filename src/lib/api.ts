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
  token: () => request<{ token: string }>("/api/auth/token", {}, false),
  updateSession: (account: Partial<Account>) =>
    request<{ account: Account }>("/api/auth/session/update", { method: "POST", body: JSON.stringify({ account }) }, false),
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

export const eventsApi = {
  list: (params: { page?: number; size?: number; search?: string; category?: string } = {}) =>
    backend<Page<EventSummary>>(`/api/v1/events${query({ size: 12, ...params })}`),
  detail: (id: string) => backend<EventDetail>(`/api/v1/events/${id}`),
  create: (input: EventInput, coverImage?: File) =>
    backend<EventSummary>("/api/v1/events", { method: "POST", body: multipart(input, [{ name: "coverImage", file: coverImage }]) }),
  update: (id: string, input: Partial<EventInput>, coverImage?: File) =>
    backend<EventSummary>(`/api/v1/events/${id}`, { method: "PUT", body: multipart(input, [{ name: "coverImage", file: coverImage }]) }),
  delete: (id: string) => backend<null>(`/api/v1/events/${id}`, { method: "DELETE" }),
  register: (id: string) => backend<unknown>(`/api/v1/events/${id}/register`, { method: "POST" }),
  cancelRegistration: (id: string) =>
    backend<null>(`/api/v1/events/${id}/register`, { method: "DELETE" }),
  mine: () => backend<Page<EventSummary>>("/api/v1/users/me/events?size=100"),
  publish: (id: string) => backend<null>(`/api/v1/events/${id}/publish`, { method: "POST" }),
  start: (id: string) => backend<null>(`/api/v1/events/${id}/start`, { method: "POST" }),
  complete: (id: string) => backend<null>(`/api/v1/events/${id}/complete`, { method: "POST" }),
  cancel: (id: string) => backend<null>(`/api/v1/events/${id}/cancel`, { method: "POST" }),
  stats: (id: string) => backend<EventStatsResponse>(`/api/v1/events/${id}/stats`),
  participants: (id: string, page = 0) => backend<Page<ParticipantResponse>>(`/api/v1/events/${id}/participants?page=${page}&size=50`),
};

export const postsApi = {
  list: (params: { page?: number; size?: number } = {}) =>
    backend<Page<Post>>(`/api/v1/posts${query({ size: 12, ...params })}`),
  detail: (id: string) => backend<Post>(`/api/v1/posts/${id}`),
  create: (input: PostInput, files: File[] = []) =>
    backend<Post>("/api/v1/posts", { method: "POST", body: multipart({ content: input.content }, files.map((file) => ({ name: "files", file }))) }),
  update: (id: string, input: PostInput, files: File[] = []) =>
    backend<Post>(`/api/v1/posts/${id}`, { method: "PUT", body: multipart({ content: input.content }, files.map((file) => ({ name: "files", file }))) }),
  delete: (id: string) => backend<null>(`/api/v1/posts/${id}`, { method: "DELETE" }),
  like: (id: string, active: boolean) => backend<Post>(`/api/v1/posts/${id}/like`, { method: active ? "DELETE" : "POST" }),
  save: (id: string, active: boolean) => backend<Post>(`/api/v1/posts/${id}/save`, { method: active ? "DELETE" : "POST" }),
  repost: (id: string, active: boolean) => backend<Post>(`/api/v1/posts/${id}/repost`, { method: active ? "DELETE" : "POST" }),
  comments: (id: string) => backend<Page<PostComment>>(`/api/v1/posts/${id}/comments?size=50`),
  comment: (id: string, content: string) => backend<PostComment>(`/api/v1/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  deleteComment: (postId: string, commentId: string) => backend<null>(`/api/v1/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
};

export const adminApi = {
  stats: () => backend<AdminStats>("/api/v1/admin/stats"),
  badges: (page = 0) => backend<Page<Badge>>(`/api/v1/admin/badges?page=${page}&size=50`),
  createBadge: (input: BadgeInput, image?: File) =>
    backend<Badge>("/api/v1/admin/badges", { method: "POST", body: multipart(input, [{ name: "image", file: image }]) }),
  updateBadge: (id: string, input: BadgeInput, image?: File) =>
    backend<Badge>(`/api/v1/admin/badges/${id}`, { method: "PUT", body: multipart(input, [{ name: "image", file: image }]) }),
  deactivateBadge: (id: string) =>
    backend<null>(`/api/v1/admin/badges/${id}`, { method: "DELETE" }),
  users: (search = "", page = 0) =>
    backend<Page<UserResponse>>(`/api/v1/admin/users?search=${encodeURIComponent(search)}&page=${page}&size=50`),
  banUser: (id: string, reason = "") =>
    backend<null>(`/api/v1/admin/users/${id}/ban-user?reason=${encodeURIComponent(reason)}`, { method: "PUT" }),
  unbanUser: (id: string) =>
    backend<null>(`/api/v1/admin/users/${id}/unban-user`, { method: "PUT" }),
};

export type ProfileInput = {
  fullName?: string;
  birthDate?: string;
  phone?: string;
  university?: string;
  major?: string;
  course?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  interests?: string;
  skills?: string;
  profilePhotoUrl?: string;
  bannerUrl?: string;
  messagePermission?: "EVERYONE" | "FOLLOWERS" | "NOBODY";
};

export const profileApi = {
  get: () => backend<ProfileInput>("/api/v1/users/me"),
  update: (input: ProfileInput, profilePhoto?: File, banner?: File) =>
    backend<ProfileInput>("/api/v1/users/me", { method: "PUT", body: multipart(input, [{ name: "profilePhoto", file: profilePhoto }, { name: "banner", file: banner }]) }),
  events: () => backend<Page<EventSummary>>("/api/v1/users/me/events?size=100"),
  certificates: () => backend<Page<Certificate>>("/api/v1/users/me/certificates?size=100"),
  badges: () => backend<UserBadge[]>("/api/v1/users/me/badges"),
  followers: () => backend<Page<PublicProfile>>("/api/v1/users/me/followers?size=100"),
  following: () => backend<Page<PublicProfile>>("/api/v1/users/me/following?size=100"),
  coins: () => backend<number>("/api/v1/users/me/coins"),
};

export const chatApi = {
  conversations: () => backend<ChatConversation[]>("/api/v1/chat/conversations"),
  rooms: () => backend<ChatRoom[]>("/api/v1/chat/rooms"),
  requests: (page = 0) => backend<Page<ChatConversation>>(`/api/v1/chat/requests?page=${page}&size=20`),
  acceptRequest: (partnerId: string) => backend<number>(`/api/v1/chat/requests/${partnerId}/accept`, { method: "PUT" }),
  messages: (partnerId: string) => backend<Page<ChatMessage>>(`/api/v1/chat/messages/${partnerId}?size=50`),
  send: (recipientId: string, content: string) => backend<ChatMessage>("/api/v1/chat/messages", { method: "POST", body: JSON.stringify({ recipientId, content }) }),
  markRead: (partnerId: string) => backend<number>(`/api/v1/chat/messages/${partnerId}/read`, { method: "PUT" }),
  groupMessages: (roomId: string) => backend<Page<GroupMessage>>(`/api/v1/chat/rooms/${roomId}/messages?size=50`),
  sendGroup: (roomId: string, content: string) => backend<GroupMessage>(`/api/v1/chat/rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  createGroup: (name: string, photo?: File) => backend<ChatRoom>("/api/v1/chat/rooms/group", { method: "POST", body: multipart({ name }, [{ name: "photo", file: photo }]) }),
  updateGroup: (roomId: string, name: string, photo?: File) => backend<null>(`/api/v1/chat/rooms/${roomId}`, { method: "PUT", body: multipart({ name }, [{ name: "photo", file: photo }]) }),
  addMember: (roomId: string, username: string) => backend<null>(`/api/v1/chat/rooms/${roomId}/members?username=${encodeURIComponent(username)}`, { method: "POST" }),
  removeMember: (roomId: string, username: string) => backend<null>(`/api/v1/chat/rooms/${roomId}/members/${encodeURIComponent(username)}`, { method: "DELETE" }),
  changeMemberRole: (roomId: string, username: string, role: "ADMIN" | "MEMBER") => backend<null>(`/api/v1/chat/rooms/${roomId}/members/${encodeURIComponent(username)}/role?role=${role}`, { method: "PUT" }),
  leave: (roomId: string) => backend<null>(`/api/v1/chat/rooms/${roomId}/leave`, { method: "DELETE" }),
};

export const notificationsApi = {
  list: () => backend<Page<Notification>>("/api/v1/notifications?size=50"),
  read: (id: string) => backend<Notification>(`/api/v1/notifications/${id}/read`, { method: "PUT" }),
  readAll: () => backend<null>("/api/v1/notifications/read-all", { method: "PUT" }),
};

export const networkApi = {
  leaderboard: (page = 0) => backend<Page<LeaderboardEntry>>(`/api/v1/leaderboard?page=${page}&size=20`),
  search: (query = "", page = 0) => backend<Page<PublicProfile>>(`/api/v1/users/search?query=${encodeURIComponent(query)}&page=${page}&size=20`),
  profile: (username: string) => backend<PublicProfile>(`/api/v1/users/@${encodeURIComponent(username)}`),
  followers: (userId: string) => backend<Page<PublicProfile>>(`/api/v1/users/${userId}/followers?size=50`),
  following: (userId: string) => backend<Page<PublicProfile>>(`/api/v1/users/${userId}/following?size=50`),
  follow: (userId: string) => backend<null>(`/api/v1/users/${userId}/follow`, { method: "POST" }),
  unfollow: (userId: string) => backend<null>(`/api/v1/users/${userId}/follow`, { method: "DELETE" }),
};

export const socialProfileApi = {
  posts: (userId: string, page = 0) => backend<Page<Post>>(`/api/v1/posts/user/${userId}?page=${page}&size=12`),
  organizationPosts: (organizationId: string, page = 0) => backend<Page<Post>>(`/api/v1/posts/organization/${organizationId}?page=${page}&size=12`),
  reposts: (userId: string, page = 0) => backend<Page<Post>>(`/api/v1/posts/user/${userId}/reposts?page=${page}&size=12`),
  liked: (page = 0) => backend<Page<Post>>(`/api/v1/posts/liked?page=${page}&size=12`),
  saved: (page = 0) => backend<Page<Post>>(`/api/v1/posts/saved?page=${page}&size=12`),
  events: (userId: string, page = 0) => backend<Page<EventSummary>>(`/api/v1/users/${userId}/events?page=${page}&size=12`),
  certificates: (userId: string, page = 0) => backend<Page<Certificate>>(`/api/v1/users/${userId}/certificates?page=${page}&size=12`),
  badges: (userId: string) => backend<UserBadge[]>(`/api/v1/users/${userId}/badges`),
};

export type AdminOrganization = { id: string; username: string; organizationName: string; email: string; description?: string; logoUrl?: string; isVerified: boolean; verificationNote?: string; createdAt: string };
export const adminOrganizationsApi = {
  list: (page = 0, search = "") => backend<Page<AdminOrganization>>(`/api/v1/admin/organizations?page=${page}&size=20&search=${encodeURIComponent(search)}`),
  verify: (id: string, verify: boolean, note = "") => backend<AdminOrganization>(`/api/v1/admin/organizations/${id}/verify?verify=${verify}&note=${encodeURIComponent(note)}`, { method: "PUT" }),
  reject: (id: string, reason = "") => backend<null>(`/api/v1/admin/organizations/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: "PUT" }),
};

export type OrganizationProfile = {
  id: string; username: string; email: string; organizationName: string; description?: string;
  logoUrl?: string; bannerUrl?: string; website?: string; isVerified: boolean; role: string;
};
export type OrganizationInput = Pick<OrganizationProfile, "organizationName" | "email"> & Partial<Pick<OrganizationProfile, "description" | "website">>;
export const organizationsApi = {
  get: (id: string) => backend<OrganizationProfile>(`/api/v1/organizations/${id}`),
  update: (id: string, input: OrganizationInput, logo?: File, banner?: File) =>
    backend<OrganizationProfile>(`/api/v1/organizations/${id}`, { method: "PUT", body: multipart(input, [{ name: "logo", file: logo }, { name: "banner", file: banner }]) }),
  events: () => backend<Page<EventSummary>>("/api/v1/organizations/current-organization-events?size=100"),
  inviteOrganizer: (orgId: string, emailOrUsername: string) => backend<null>(`/api/v1/organizations/${orgId}/invitations`, { method: "POST", body: JSON.stringify({ emailOrUsername }) }),
  removeOrganizer: (orgId: string, organizerId: string) => backend<null>(`/api/v1/organizations/${orgId}/organizers/${organizerId}`, { method: "DELETE" }),
};

export const invitationsApi = {
  approve: (token: string) => backend<null>(`/api/v1/invitations/approve?token=${encodeURIComponent(token)}`),
  reject: (token: string) => backend<null>(`/api/v1/invitations/reject?token=${encodeURIComponent(token)}`),
};

export const certificatesApi = {
  mine: () => backendRaw<Certificate[]>("/api/v1/certificates/my"),
  download: (id: string) => backendBlob(`/api/v1/certificates/download/${id}`),
  delete: (id: string) => backend<null>(`/api/v1/certificates/${id}`, { method: "DELETE" }),
};

export const qrApi = {
  generate: () => backend<QrPayload>("/api/v1/qr/generate"),
};

export const aiApi = {
  suggestEventContent: (input: AiEventSuggestRequest) =>
    backend<AiEventSuggestResponse>("/api/v1/ai/suggest-event-content", { method: "POST", body: JSON.stringify(input) }),
  chat: (message: string) =>
    backend<AiChatResponse>("/api/v1/ai/chat", { method: "POST", body: JSON.stringify({ message }) }),
};

export const coinsApi = {
  balance: () => backend<number>("/api/v1/coins/balance"),
  transactions: (page = 0) => backend<Page<CoinTransactionResponse>>(`/api/v1/coins/transactions?page=${page}&size=20`),
};

export const participationsApi = {
  checkin: (input: CheckinRequest) =>
    backend<CheckinResponse>("/api/v1/participations/checkin-join", { method: "POST", body: JSON.stringify(input) }),
};

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

export interface AuditLog {
  id: string;
  action: string;
  actorId?: string;
  actorUsername?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserDetail {
  user: UserResponse;
  certificates: Certificate[];
  badges: UserBadge[];
  eventsAttended: EventSummary[];
  eventsOrganized: EventSummary[];
  coinTransactions: CoinTransactionResponse[];
}

export interface ReferralResponse {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  coinAwarded: boolean;
  createdAt: string;
}

export interface AiStatsResponse {
  totalMessages: number;
  totalUsers: number;
}

