import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTheme } from '@/context/ThemeContext';
import { MessageSquare, Trash2, Clock, X } from 'lucide-react-native';
import { getAllConversations, deleteConversation, SavedConversation } from '@/services/coach';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ArchivesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await deleteConversation(id);
              setConversations(prev => prev.filter(c => c.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation.');
            }
          },
        },
      ]
    );
  };

  const handleViewConversation = (conversation: SavedConversation) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/coach/view' as any,
      params: { id: conversation.id },
    } as any);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item, index }: { item: SavedConversation; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={[styles.conversationCard, {
          backgroundColor: colors.glassBackgroundStrong,
          borderColor: colors.glassBorder,
        }]}
        onPress={() => handleViewConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(77, 184, 255, 0.1)' }]}>
            <MessageSquare size={20} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.conversationTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metaInfo}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {formatDate(item.lastUpdated)}
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                • {item.messages.length} messages
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Archived Conversations',
          headerBackTitle: 'Back',
          headerLeft: () => null,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.closeButton, { backgroundColor: colors.glassBackgroundStrong }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      {!isLoading && conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: 'rgba(77, 184, 255, 0.1)' }]}>
            <MessageSquare size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Conversations</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Your saved conversations will appear here. Start a chat with the AI coach and save it to view later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  conversationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
