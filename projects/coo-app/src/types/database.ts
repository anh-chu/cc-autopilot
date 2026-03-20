export type FeedingType = "breast" | "bottle" | "solid" | "pump";
export type BottleContent = "formula" | "expressed_milk" | "donor_milk";
export type BreastSide = "left" | "right" | "both";
export type Severity = "mild" | "moderate" | "severe";
export type FeedingMethod = "breast" | "bottle" | "combo";
export type DarkMode = "dark" | "light" | "auto";
export type VolumeUnit = "oz" | "ml";
export type WeightUnit = "lb" | "kg";
export type LengthUnit = "in" | "cm";
export type TimeFormat = "12h" | "24h";

export interface Baby {
  id: string;
  name: string;
  birthDate: string; // ISO date
  sex?: "male" | "female" | "other";
  gestationalAgeWeeks?: number;
  primaryFeedingMethod: FeedingMethod;
  photoUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FeedingLog {
  id: string;
  babyId: string;
  loggedBy: string;
  feedingType: FeedingType;
  bottleContent?: BottleContent;
  formulaBrand?: string;
  side?: BreastSide;
  amountMl?: number;
  durationSeconds?: number;
  startedAt: number; // Unix ms
  endedAt?: number;
  solidDescription?: string;
  notes?: string;
  isTimer: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SymptomLog {
  id: string;
  babyId: string;
  loggedBy: string;
  symptomType: string;
  severity: Severity;
  feedingId?: string;
  notes?: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
}

export type DiaperContent = "pee" | "poop" | "both" | "dry";

export interface DiaperLog {
  id: string;
  babyId: string;
  loggedBy: string;
  content: DiaperContent;
  feedingId?: string;
  notes?: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Caregiver {
  id: string;
  name: string;
  role: "parent" | "caregiver" | "viewer";
}

export interface UserSettings {
  unitVolume: VolumeUnit;
  unitWeight: WeightUnit;
  unitLength: LengthUnit;
  timeFormat: TimeFormat;
  darkMode: DarkMode;
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  unitVolume: "oz",
  unitWeight: "lb",
  unitLength: "in",
  timeFormat: "12h",
  darkMode: "dark",
  onboardingComplete: false,
};

// ── Forum Types ──────────────────────────────────────────────────────

export type ForumCategoryId =
  | "feeding-questions"
  | "formula-experiences"
  | "breastfeeding-support"
  | "symptom-discussions"
  | "product-reviews"
  | "introducing-solids"
  | "parenting-tips"
  | "general";

export type PostStatus = "published" | "hidden" | "flagged";
export type ModerationAction = "report" | "flag" | "hide";

export interface ForumCategory {
  id: ForumCategoryId;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  categoryId: ForumCategoryId;
  title: string;
  body: string;
  imageUri?: string;
  upvotes: string[]; // user IDs who upvoted
  helpfulMarks: string[]; // user IDs who marked helpful
  commentCount: number;
  status: PostStatus;
  reports: ForumReport[];
  createdAt: number;
  updatedAt: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  parentCommentId: string | null; // null = top-level, string = nested reply
  authorId: string;
  authorName: string;
  body: string;
  upvotes: string[]; // user IDs who upvoted
  isHelpful: boolean; // marked as helpful by post author
  status: PostStatus;
  reports: ForumReport[];
  createdAt: number;
  updatedAt: number;
}

export interface ForumReport {
  reporterId: string;
  reason: string;
  createdAt: number;
}

export interface ForumUserProfile {
  id: string;
  displayName: string;
  bio: string;
  babyAgeMonths?: number;
  feedingMethod?: FeedingMethod;
  location?: string; // city-level only
  joinedAt: number;
  postCount: number;
  helpfulCount: number;
}

export interface LocalGroup {
  id: string;
  name: string;
  location: string; // city or region
  description: string;
  memberIds: string[];
  createdAt: number;
}
