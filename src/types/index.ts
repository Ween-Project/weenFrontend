export type UserRole = "VOLUNTEER" | "ORGANIZER" | "ORGANIZATION_ADMIN" | "ADMIN";

export type Account = {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  organizationName?: string;
  role: UserRole;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  weenCoinBalance?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export const EVENT_CATEGORIES = [
  "HUMAN_RIGHTS",
  "ENVIRONMENT",
  "EDUCATION",
  "HEALTH",
  "TECHNOLOGY",
  "CULTURE",
  "INTERNATIONAL",
] as const;

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventSummary = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  city?: string;
  address?: string;
  isOnline: boolean;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  currentRegistrations?: number;
  organizationId: string;
  organizationName?: string;
  status: EventStatus;
  coverImageUrl?: string;
  customFields?: string;
  createdAt: string;
  updatedAt: string;
};

export type EventDetail = EventSummary & {
  attendeeCount?: number;
  userRegistered?: boolean;
  userAttended?: boolean;
};

export type EventInput = {
  title: string;
  description: string;
  category: EventCategory;
  city?: string;
  address?: string;
  isOnline: boolean;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  coverImageUrl?: string;
  customFields?: string;
  status?: EventStatus;
};

export type PostAuthor = {
  id: string;
  username: string;
  fullName?: string;
  profilePhotoUrl?: string;
  accountType: "USER" | "ORGANIZATION";
};

export type Post = {
  id: string;
  author: PostAuthor;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  repostCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  repostedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = { content: string; mediaUrl?: string };

export type PostComment = {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatConversation = {
  partnerId: string;
  partnerUsername?: string;
  partnerFullName?: string;
  partnerPhotoUrl?: string;
  lastMessageId: string;
  lastMessage: string;
  lastSenderId: string;
  lastMessageRead: boolean;
  unreadCount: number;
  lastMessageAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  request?: boolean;
};

export type GroupMessage = {
  id: string;
  senderId: string;
  chatRoomId: string;
  content: string;
  createdAt: string;
};

export type ChatRoom = {
  id: string;
  name: string;
  type: "DIRECT" | "GROUP" | "EVENT";
  eventId?: string;
  participantOneId?: string;
  participantTwoId?: string;
  photoUrl?: string;
  creatorId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type PublicProfile = {
  id: string;
  username: string;
  fullName: string;
  birthDate?: string;
  university?: string;
  major?: string;
  course?: string;
  bio?: string;
  profilePhotoUrl?: string;
  bannerUrl?: string;
  weenCoinBalance?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  interests?: string;
  skills?: string;
  referralCode?: string;
  followerCount?: number;
  followingCount?: number;
  following?: boolean;
  canMessage?: boolean;
};

export type Certificate = {
  id: string;
  certificateNumber: string;
  userId: string;
  eventId: string;
  eventTitle?: string;
  pdfUrl?: string;
  issuedAt: string;
};

export type AchievementType =
  | "EVENT_ATTENDANCE_COUNT"
  | "EVENT_CATEGORY_ATTENDANCE_COUNT"
  | "REFERRAL_COUNT"
  | "PROFILE_COMPLETION"
  | "COIN_BALANCE";
