import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForumStore } from "@/stores/forumStore";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function LocalGroupsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const localGroups = useForumStore((s) => s.localGroups);
  const joinedGroupIds = useForumStore((s) => s.joinedGroupIds);
  const joinGroup = useForumStore((s) => s.joinGroup);
  const leaveGroup = useForumStore((s) => s.leaveGroup);

  return (
    <SafeAreaView className="flex-1 bg-coo-bg dark:bg-coo-bg-dark">
      <View className="flex-row items-center px-base py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-heading-lg text-coo-text-primary dark:text-coo-text-primary-dark font-semibold ml-4">
          Local Groups
        </Text>
      </View>

      <ScrollView className="flex-1 px-base">
        <Text className="text-body text-coo-text-secondary dark:text-coo-text-secondary-dark mb-4">
          Connect with parents in your area. Location sharing is opt-in and
          rounded to city level for privacy.
        </Text>

        <View className="bg-coo-info/10 border border-coo-info/30 rounded-md p-3 mb-4 flex-row items-start">
          <Ionicons name="shield-checkmark-outline" size={18} color="#6BA3C7" />
          <Text className="text-caption text-coo-text-secondary dark:text-coo-text-secondary-dark ml-2 flex-1">
            Your exact location is never shared. Groups are organized by region
            to protect your privacy.
          </Text>
        </View>

        {localGroups.map((group) => {
          const isJoined = joinedGroupIds.includes(group.id);
          return (
            <View
              key={group.id}
              className="bg-coo-surface dark:bg-coo-surface-dark rounded-md p-base mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-coo-primary/20 items-center justify-center">
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-body text-coo-text-primary dark:text-coo-text-primary-dark font-medium">
                      {group.name}
                    </Text>
                    <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark">
                      {group.memberIds.length} member
                      {group.memberIds.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    isJoined ? leaveGroup(group.id) : joinGroup(group.id)
                  }
                  className={`px-4 py-2 rounded-md ${
                    isJoined
                      ? "bg-coo-surface-elevated dark:bg-coo-surface-elevated-dark border border-coo-divider dark:border-coo-divider-dark"
                      : "bg-coo-primary"
                  }`}
                >
                  <Text
                    className={`text-caption font-medium ${
                      isJoined
                        ? "text-coo-text-secondary dark:text-coo-text-secondary-dark"
                        : "text-white"
                    }`}
                  >
                    {isJoined ? "Joined" : "Join"}
                  </Text>
                </Pressable>
              </View>

              <Text className="text-caption text-coo-text-tertiary dark:text-coo-text-tertiary-dark mt-2">
                {group.description}
              </Text>
            </View>
          );
        })}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
