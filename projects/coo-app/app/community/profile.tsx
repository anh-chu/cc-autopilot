import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useForumStore } from "@/stores/forumStore";
import { PostCard } from "@/components/community/PostCard";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const profile = useForumStore((s) => s.profile);
  const updateProfile = useForumStore((s) => s.updateProfile);
  const getPostsByAuthor = useForumStore((s) => s.getPostsByAuthor);
  const toggleUpvotePost = useForumStore((s) => s.toggleUpvotePost);
  const toggleHelpfulPost = useForumStore((s) => s.toggleHelpfulPost);
  const followedCategories = useForumStore((s) => s.followedCategories);
  const getJoinedGroups = useForumStore((s) => s.getJoinedGroups);

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(profile?.bio ?? "");
  const [editLocation, setEditLocation] = useState(profile?.location ?? "");

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark justify-center items-center">
        <Text className="text-body text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
          No profile set up
        </Text>
      </SafeAreaView>
    );
  }

  const myPosts = getPostsByAuthor(profile.id);
  const joinedGroups = getJoinedGroups();
  const memberSince = formatDistanceToNow(profile.joinedAt, {
    addSuffix: true,
  });

  const handleSaveProfile = () => {
    updateProfile({
      bio: editBio.trim(),
      location: editLocation.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <View className="flex-row items-center justify-between px-base py-3">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-4">
            My Profile
          </Text>
        </View>
        <Pressable
          onPress={() => (editing ? handleSaveProfile() : setEditing(true))}
          hitSlop={8}
        >
          <Ionicons
            name={editing ? "checkmark" : "create-outline"}
            size={22}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-base">
        {/* Profile card */}
        <View className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-coo-primary/20 items-center justify-center">
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-body-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold">
                {profile.displayName}
              </Text>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                Joined {memberSince}
              </Text>
            </View>
          </View>

          {editing ? (
            <>
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
                Bio
              </Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textTertiary}
                multiline
                className="bg-coo-bg dark:bg-coo-bg-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark mb-3"
                style={{ textAlignVertical: "top", minHeight: 60 }}
              />
              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mb-1">
                Location
              </Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="City, State"
                placeholderTextColor={colors.textTertiary}
                className="bg-coo-bg dark:bg-coo-bg-dark border border-coo-divider dark:border-coo-divider-dark rounded-md px-3 py-2 text-body text-coo-text-primary dark:text-coo-text-primary-dark"
              />
            </>
          ) : (
            <>
              {profile.bio ? (
                <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-2">
                  {profile.bio}
                </Text>
              ) : null}

              <View className="flex-row flex-wrap gap-3 mt-1">
                {profile.babyAgeMonths !== undefined && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="happy-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
                      {profile.babyAgeMonths}mo old
                    </Text>
                  </View>
                )}
                {profile.feedingMethod && (
                  <View className="flex-row items-center">
                    <Ionicons name="nutrition-outline" size={14} color={colors.textTertiary} />
                    <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
                      {profile.feedingMethod} feeding
                    </Text>
                  </View>
                )}
                {profile.location && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark ml-1">
                      {profile.location}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 items-center">
            <Text className="text-heading-lg text-coo-primary font-bold">
              {profile.postCount}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              Posts
            </Text>
          </View>
          <View className="flex-1 bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 items-center">
            <Text className="text-heading-lg text-coo-secondary font-bold">
              {profile.helpfulCount}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              Helpful
            </Text>
          </View>
          <View className="flex-1 bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 items-center">
            <Text className="text-heading-lg text-coo-info font-bold">
              {followedCategories.length}
            </Text>
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              Following
            </Text>
          </View>
        </View>

        {/* Joined groups */}
        {joinedGroups.length > 0 && (
          <>
            <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-2">
              My Local Groups
            </Text>
            {joinedGroups.map((group) => (
              <View
                key={group.id}
                className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-3 mb-2 flex-row items-center"
              >
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark ml-2">
                  {group.name}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* My posts */}
        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark font-medium mb-2 mt-2">
          My Posts
        </Text>
        {myPosts.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
              No posts yet
            </Text>
          </View>
        ) : (
          myPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={profile.id}
              onPress={() => router.push(`/community/post/${post.id}`)}
              onUpvote={() => toggleUpvotePost(post.id)}
              onHelpful={() => toggleHelpfulPost(post.id)}
            />
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
