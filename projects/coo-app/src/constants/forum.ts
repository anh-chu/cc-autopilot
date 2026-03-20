import type { ForumCategory, ForumCategoryId } from "@/types/database";

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: "feeding-questions",
    label: "Feeding Questions",
    emoji: "\u2753",
    description: "Ask anything about feeding schedules, amounts, and techniques",
    color: "#6BA3C7",
  },
  {
    id: "formula-experiences",
    label: "Formula Experiences",
    emoji: "\uD83C\uDF7C",
    description: "Share formula brand experiences, switching tips, and prep advice",
    color: "#A89BC7",
  },
  {
    id: "breastfeeding-support",
    label: "Breastfeeding Support",
    emoji: "\uD83E\uDD31",
    description: "Latch help, supply questions, pumping tips, and encouragement",
    color: "#7BAE8E",
  },
  {
    id: "symptom-discussions",
    label: "Symptom Discussions",
    emoji: "\uD83E\uDE7A",
    description: "Discuss reflux, allergies, colic, and other feeding-related symptoms",
    color: "#E8A545",
  },
  {
    id: "product-reviews",
    label: "Product Reviews",
    emoji: "\u2B50",
    description: "Bottles, pumps, high chairs, bibs — share what works",
    color: "#F4A88C",
  },
  {
    id: "introducing-solids",
    label: "Introducing Solids",
    emoji: "\uD83E\uDD51",
    description: "Baby-led weaning, purees, first foods, and meal ideas",
    color: "#5CB07A",
  },
  {
    id: "parenting-tips",
    label: "Parenting Tips",
    emoji: "\uD83D\uDCA1",
    description: "Sleep, routines, self-care, and general parenting wisdom",
    color: "#E07A6B",
  },
  {
    id: "general",
    label: "General",
    emoji: "\uD83D\uDCAC",
    description: "Anything else — introductions, wins, venting, and support",
    color: "#9BAFB3",
  },
];

export const CATEGORY_MAP: Record<ForumCategoryId, ForumCategory> =
  Object.fromEntries(
    FORUM_CATEGORIES.map((c) => [c.id, c])
  ) as Record<ForumCategoryId, ForumCategory>;

export const COMMUNITY_GUIDELINES = `Welcome to the Coo Community!

Every feeding journey is valid. We're here to support, not judge.

WHAT'S WELCOME
- Sharing your personal experiences and asking questions
- Encouraging and supporting other parents
- Sharing evidence-based resources (with sources)
- Celebrating wins, big and small

WHAT'S NOT ALLOWED
- Shaming any feeding choice (breast, formula, combo, donor milk)
- Giving medical advice — share experiences, not prescriptions
- Unverified health claims or anti-medical content
- Selling, promoting MLM products, or undisclosed ads
- Sharing photos of other people's children
- Harassment, bullying, or personal attacks

CRISIS SUPPORT
If you or someone you know is struggling, help is available:
- 988 Suicide & Crisis Lifeline (call or text 988)
- Postpartum Support International (1-800-944-4773)

ENFORCEMENT
Warning \u2192 24hr mute \u2192 7-day ban \u2192 permanent ban

By posting, you agree to these guidelines. Be the calm friend at 3 AM.`;

// Keywords that trigger auto-flagging for moderator review
export const FLAGGED_KEYWORDS: string[] = [
  "dilute formula",
  "water down formula",
  "rice cereal in bottle",
  "whiskey on gums",
  "benadryl for sleep",
  "melatonin baby",
  "essential oils baby",
  "anti-vax",
  "vaccines cause",
  "bleach bath",
  "raw milk baby",
  "honey infant",
  "honey newborn",
  "sell you",
  "join my team",
  "dm me for",
  "message me for",
  "buy from my",
  "boss babe",
  "side hustle opportunity",
];

// Crisis keywords that trigger resource display
export const CRISIS_KEYWORDS: string[] = [
  "want to die",
  "kill myself",
  "suicidal",
  "self harm",
  "self-harm",
  "hurt myself",
  "hurt my baby",
  "can't take it anymore",
  "end it all",
  "not worth living",
  "better off without me",
];

// Pre-built local group regions for seeding
export const SEED_LOCAL_GROUPS = [
  { id: "local_northeast", name: "Northeast US Parents", location: "Northeast US" },
  { id: "local_southeast", name: "Southeast US Parents", location: "Southeast US" },
  { id: "local_midwest", name: "Midwest US Parents", location: "Midwest US" },
  { id: "local_west", name: "West Coast Parents", location: "West Coast US" },
  { id: "local_southwest", name: "Southwest US Parents", location: "Southwest US" },
  { id: "local_canada", name: "Canadian Parents", location: "Canada" },
  { id: "local_uk", name: "UK Parents", location: "United Kingdom" },
  { id: "local_europe", name: "European Parents", location: "Europe" },
  { id: "local_australia", name: "Australian Parents", location: "Australia" },
  { id: "local_international", name: "International Parents", location: "International" },
];
