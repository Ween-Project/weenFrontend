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
  profilePhotoUrl?: string;
  logoUrl?: string;
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
  isEmailVerified?: boolean;
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

export type Badge = {
  id: string;
  name: string;
  description?: string;
  type: "BRONZE" | "SILVER" | "GOLD" | "EVENT_CATEGORY" | "MONTHLY_WINNER" | "STREAK" | "ANNIVERSARY";
  achievementType: AchievementType;
  achievementThreshold: number;
  eventCategory?: string;
  points: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
};

export type UserBadge = {
  id: string;
  badge: Badge;
  earnedAt: string;
};

export type BadgeInput = Omit<Badge, "id" | "createdAt">;

export type LeaderboardEntry = {
  rank: number;
  username: string;
  profilePhotoUrl?: string;
  coins: number;
  userId?: string;
  fullName?: string;
  university?: string;
  major?: string;
  course?: string;
  skills?: string;
  interests?: string;
};

export type QrPayload = {
  encryptedPayload: string;
  qrImageBase64?: string;
  expiresIn: number;
};

export type AdminStats = {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalRegistrations: number;
  totalAttendees: number;
  totalCoinsDistributed: number;
  totalCertificatesIssued: number;
  totalPosts: number;
  verifiedOrganizations: number;
  pendingOrganizations: number;
  bannedUsers: number;
  publishedEvents: number;
};

export type LoginInput = {
  email: string;
  password: string;
  accountType: "user" | "organization";
};

export type UserRegistrationInput = {
  accountType: "user";
  username: string;
  email: string;
  password: string;
  fullName: string;
  birthDate?: string;
  phone?: string;
  university?: string;
  major?: string;
  course?: string;
  interests?: string;
  skills?: string;
  referralCode?: string;
};

export type OrganizationRegistrationInput = {
  accountType: "organization";
  organizationName: string;
  username: string;
  email: string;
  password: string;
  description: string;
  logoUrl?: string;
  website?: string;
};

export type RegistrationInput = UserRegistrationInput | OrganizationRegistrationInput;

export type Feature = {
  icon: string;
  title: string;
  description: string;
};

export type Stat = {
  label: string;
  value: string;
  change: string;
  tone: "green" | "purple" | "orange";
};

export type Activity = {
  id: number;
  title: string;
  organization: string;
  date: string;
  hours: number;
  status: "Completed" | "Upcoming";
};

export type Opportunity = {
  id: number;
  title: string;
  organization: string;
  date: string;
  spots: number;
  category: string;
};

export type AiChatRequest = {
  message: string;
};

export type AiChatResponse = {
  response: string;
};

export type AiEventSuggestRequest = {
  title: string;
  category: string;
  additionalNotes?: string;
};

export type AiEventSuggestResponse = {
  description: string;
  requirements: string[];
  schedule: string[];
};

export type CheckinRequest = {
  eventId: string;
  qrToken: string;
};

export type CheckinResponse = {
  status: string;
  participantName: string;
  participantPhoto?: string;
  message: string;
};

export type EventStatsResponse = {
  eventId: string;
  eventTitle: string;
  totalRegistered: number;
  totalAttended: number;
  registrationRate: number;
  attendanceRate: number;
};

export type ParticipantResponse = {
  id: string;
  username: string;
  fullName: string;
  profilePhotoUrl?: string;
  weenCoinBalance?: number;
  registeredAt: string;
  joinedAt?: string;
  isJoined: boolean;
};

export type CoinTransactionResponse = {
  id: string;
  amount: number;
  reason: CoinReason;
  createdAt: string;
};

export type CoinReason = "SIGNUP" | "ATTENDANCE" | "REFERRAL" | "PROFILE_COMPLETE";

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  birthDate?: string;
  phone?: string;
  university?: string;
  major?: string;
  bio?: string;
  profilePhotoUrl?: string;
  bannerUrl?: string;
  messagePermission?: "EVERYONE" | "FOLLOWERS" | "NOBODY";
  weenCoinBalance: number;
  role: UserRole;
  isEmailVerified: boolean;
  banned?: boolean;
  banReason?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  interests?: string;
  skills?: string;
  referralCode?: string;
  category?: string;
  course?: string;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
};

