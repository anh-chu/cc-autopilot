import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/lib/id";
import { FLAGGED_KEYWORDS, CRISIS_KEYWORDS, SEED_LOCAL_GROUPS } from "@/constants/forum";
import type {
  ForumPost,
  ForumComment,
  ForumCategoryId,
  ForumUserProfile,
  ForumReport,
  LocalGroup,
  PostStatus,
  FeedingMethod,
} from "@/types/database";

interface ForumStore {
  // Data
  posts: ForumPost[];
  comments: ForumComment[];
  profile: ForumUserProfile | null;
  localGroups: LocalGroup[];
  followedCategories: ForumCategoryId[];
  joinedGroupIds: string[];
  guidelinesAccepted: boolean;

  // Profile
  setupProfile: (data: {
    displayName: string;
    bio?: string;
    babyAgeMonths?: number;
    feedingMethod?: FeedingMethod;
    location?: string;
  }) => void;
  updateProfile: (updates: Partial<ForumUserProfile>) => void;

  // Guidelines
  acceptGuidelines: () => void;

  // Posts
  createPost: (data: {
    categoryId: ForumCategoryId;
    title: string;
    body: string;
    imageUri?: string;
  }) => string | null; // null if blocked by keyword filter
  getPostsByCategory: (categoryId: ForumCategoryId) => ForumPost[];
  getPostById: (id: string) => ForumPost | null;
  getPostsByAuthor: (authorId: string) => ForumPost[];
  getFeedPosts: () => ForumPost[]; // posts from followed categories
  toggleUpvotePost: (postId: string) => void;
  toggleHelpfulPost: (postId: string) => void;

  // Comments
  addComment: (data: {
    postId: string;
    parentCommentId?: string;
    body: string;
  }) => string | null;
  getCommentsForPost: (postId: string) => ForumComment[];
  toggleUpvoteComment: (commentId: string) => void;
  markCommentHelpful: (commentId: string, postId: string) => void;

  // Moderation
  reportPost: (postId: string, reason: string) => void;
  reportComment: (commentId: string, reason: string) => void;
  checkContentFlags: (text: string) => {
    blocked: boolean;
    hasCrisisKeywords: boolean;
    flaggedTerms: string[];
  };

  // Local Groups
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  getJoinedGroups: () => LocalGroup[];

  // Topic Following
  followCategory: (categoryId: ForumCategoryId) => void;
  unfollowCategory: (categoryId: ForumCategoryId) => void;
  isFollowing: (categoryId: ForumCategoryId) => boolean;
}

export const useForumStore = create<ForumStore>()(
  persist(
    (set, get) => ({
      posts: [],
      comments: [],
      profile: null,
      localGroups: SEED_LOCAL_GROUPS.map((g) => ({
        ...g,
        description: `Connect with parents in ${g.location}`,
        memberIds: [],
        createdAt: Date.now(),
      })),
      followedCategories: [],
      joinedGroupIds: [],
      guidelinesAccepted: false,

      // ── Profile ──────────────────────────────────────────────────

      setupProfile: (data) => {
        const profile: ForumUserProfile = {
          id: generateId(),
          displayName: data.displayName,
          bio: data.bio ?? "",
          babyAgeMonths: data.babyAgeMonths,
          feedingMethod: data.feedingMethod,
          location: data.location,
          joinedAt: Date.now(),
          postCount: 0,
          helpfulCount: 0,
        };
        set({ profile });
      },

      updateProfile: (updates) => {
        const { profile } = get();
        if (!profile) return;
        set({ profile: { ...profile, ...updates } });
      },

      // ── Guidelines ───────────────────────────────────────────────

      acceptGuidelines: () => {
        set({ guidelinesAccepted: true });
      },

      // ── Posts ─────────────────────────────────────────────────────

      createPost: (data) => {
        const { profile, posts } = get();
        if (!profile) return null;

        const fullText = `${data.title} ${data.body}`;
        const flags = get().checkContentFlags(fullText);
        if (flags.blocked) return null;

        const id = generateId();
        const now = Date.now();
        const post: ForumPost = {
          id,
          authorId: profile.id,
          authorName: profile.displayName,
          categoryId: data.categoryId,
          title: data.title,
          body: data.body,
          imageUri: data.imageUri,
          upvotes: [],
          helpfulMarks: [],
          commentCount: 0,
          status: flags.flaggedTerms.length > 0 ? "flagged" : "published",
          reports: [],
          createdAt: now,
          updatedAt: now,
        };

        set({
          posts: [post, ...posts],
          profile: { ...profile, postCount: profile.postCount + 1 },
        });
        return id;
      },

      getPostsByCategory: (categoryId) => {
        return get()
          .posts.filter(
            (p) => p.categoryId === categoryId && p.status !== "hidden"
          )
          .sort((a, b) => b.createdAt - a.createdAt);
      },

      getPostById: (id) => {
        return get().posts.find((p) => p.id === id) ?? null;
      },

      getPostsByAuthor: (authorId) => {
        return get()
          .posts.filter((p) => p.authorId === authorId)
          .sort((a, b) => b.createdAt - a.createdAt);
      },

      getFeedPosts: () => {
        const { followedCategories } = get();
        if (followedCategories.length === 0) {
          // Show all published posts if not following any specific categories
          return get()
            .posts.filter((p) => p.status !== "hidden")
            .sort((a, b) => b.createdAt - a.createdAt);
        }
        return get()
          .posts.filter(
            (p) =>
              followedCategories.includes(p.categoryId) &&
              p.status !== "hidden"
          )
          .sort((a, b) => b.createdAt - a.createdAt);
      },

      toggleUpvotePost: (postId) => {
        const { profile } = get();
        if (!profile) return;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const has = p.upvotes.includes(profile.id);
            return {
              ...p,
              upvotes: has
                ? p.upvotes.filter((uid) => uid !== profile.id)
                : [...p.upvotes, profile.id],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      toggleHelpfulPost: (postId) => {
        const { profile } = get();
        if (!profile) return;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const has = p.helpfulMarks.includes(profile.id);
            return {
              ...p,
              helpfulMarks: has
                ? p.helpfulMarks.filter((uid) => uid !== profile.id)
                : [...p.helpfulMarks, profile.id],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      // ── Comments ──────────────────────────────────────────────────

      addComment: (data) => {
        const { profile } = get();
        if (!profile) return null;

        const flags = get().checkContentFlags(data.body);
        if (flags.blocked) return null;

        const id = generateId();
        const now = Date.now();
        const comment: ForumComment = {
          id,
          postId: data.postId,
          parentCommentId: data.parentCommentId ?? null,
          authorId: profile.id,
          authorName: profile.displayName,
          body: data.body,
          upvotes: [],
          isHelpful: false,
          status: flags.flaggedTerms.length > 0 ? "flagged" : "published",
          reports: [],
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({
          comments: [...s.comments, comment],
          posts: s.posts.map((p) =>
            p.id === data.postId
              ? { ...p, commentCount: p.commentCount + 1, updatedAt: now }
              : p
          ),
        }));
        return id;
      },

      getCommentsForPost: (postId) => {
        return get()
          .comments.filter(
            (c) => c.postId === postId && c.status !== "hidden"
          )
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      toggleUpvoteComment: (commentId) => {
        const { profile } = get();
        if (!profile) return;
        set((s) => ({
          comments: s.comments.map((c) => {
            if (c.id !== commentId) return c;
            const has = c.upvotes.includes(profile.id);
            return {
              ...c,
              upvotes: has
                ? c.upvotes.filter((uid) => uid !== profile.id)
                : [...c.upvotes, profile.id],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      markCommentHelpful: (commentId, postId) => {
        const { profile } = get();
        if (!profile) return;
        // Only the post author can mark comments as helpful
        const post = get().posts.find((p) => p.id === postId);
        if (!post || post.authorId !== profile.id) return;

        set((s) => ({
          comments: s.comments.map((c) =>
            c.id === commentId
              ? { ...c, isHelpful: !c.isHelpful, updatedAt: Date.now() }
              : c
          ),
        }));
      },

      // ── Moderation ────────────────────────────────────────────────

      reportPost: (postId, reason) => {
        const { profile } = get();
        if (!profile) return;
        const report: ForumReport = {
          reporterId: profile.id,
          reason,
          createdAt: Date.now(),
        };
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const reports = [...p.reports, report];
            // Auto-hide after 3 reports
            const status: PostStatus =
              reports.length >= 3 ? "hidden" : p.status;
            return { ...p, reports, status, updatedAt: Date.now() };
          }),
        }));
      },

      reportComment: (commentId, reason) => {
        const { profile } = get();
        if (!profile) return;
        const report: ForumReport = {
          reporterId: profile.id,
          reason,
          createdAt: Date.now(),
        };
        set((s) => ({
          comments: s.comments.map((c) => {
            if (c.id !== commentId) return c;
            const reports = [...c.reports, report];
            const status: PostStatus =
              reports.length >= 3 ? "hidden" : c.status;
            return { ...c, reports, status, updatedAt: Date.now() };
          }),
        }));
      },

      checkContentFlags: (text) => {
        const lower = text.toLowerCase();
        const flaggedTerms = FLAGGED_KEYWORDS.filter((kw) =>
          lower.includes(kw)
        );
        const hasCrisisKeywords = CRISIS_KEYWORDS.some((kw) =>
          lower.includes(kw)
        );
        // Block content with flagged MLM/sales terms; flag but allow medical concerns
        const blocked = flaggedTerms.some(
          (t) =>
            t.includes("sell") ||
            t.includes("join my") ||
            t.includes("dm me") ||
            t.includes("message me") ||
            t.includes("buy from") ||
            t.includes("boss babe") ||
            t.includes("side hustle")
        );
        return { blocked, hasCrisisKeywords, flaggedTerms };
      },

      // ── Local Groups ──────────────────────────────────────────────

      joinGroup: (groupId) => {
        const { profile, joinedGroupIds } = get();
        if (!profile || joinedGroupIds.includes(groupId)) return;
        set((s) => ({
          joinedGroupIds: [...s.joinedGroupIds, groupId],
          localGroups: s.localGroups.map((g) =>
            g.id === groupId
              ? { ...g, memberIds: [...g.memberIds, profile.id] }
              : g
          ),
        }));
      },

      leaveGroup: (groupId) => {
        const { profile } = get();
        if (!profile) return;
        set((s) => ({
          joinedGroupIds: s.joinedGroupIds.filter((id) => id !== groupId),
          localGroups: s.localGroups.map((g) =>
            g.id === groupId
              ? { ...g, memberIds: g.memberIds.filter((m) => m !== profile.id) }
              : g
          ),
        }));
      },

      getJoinedGroups: () => {
        const { localGroups, joinedGroupIds } = get();
        return localGroups.filter((g) => joinedGroupIds.includes(g.id));
      },

      // ── Topic Following ───────────────────────────────────────────

      followCategory: (categoryId) => {
        set((s) => ({
          followedCategories: s.followedCategories.includes(categoryId)
            ? s.followedCategories
            : [...s.followedCategories, categoryId],
        }));
      },

      unfollowCategory: (categoryId) => {
        set((s) => ({
          followedCategories: s.followedCategories.filter(
            (c) => c !== categoryId
          ),
        }));
      },

      isFollowing: (categoryId) => {
        return get().followedCategories.includes(categoryId);
      },
    }),
    {
      name: "coo-forum",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
