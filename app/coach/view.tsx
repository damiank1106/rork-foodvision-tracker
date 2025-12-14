import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTheme } from '@/context/ThemeContext';
import { Bot, User as UserIcon } from 'lucide-react-native';
import { loadConversation, SavedConversation } from '@/services/coach';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ViewConversationScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<SavedConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await loadConversation(id);
        setConversation(data);
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.sender === 'user';
    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 50).springify().mass(0.5)} 
        style={[
          styles.bubbleWrapper,
          isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={16} color={colors.primary} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? { backgroundColor: colors.primary, borderColor: colors.primary, borderBottomRightRadius: 4 } 
                 : { backgroundColor: colors.glassBackgroundStrong, borderColor: colors.glassBorder, borderBottomLeftRadius: 4 }
        ]}>
          <Text
            selectable
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : { color: colors.text }
            ]}
          >
            {item.text}
          </Text>
        </View>
        {isUser && (
           <View style={[styles.avatarContainer, styles.userAvatar, { backgroundColor: colors.primary }]}>
             <UserIcon size={16} color="#FFF" />
           </View>
        )}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Loading...',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackTitle: 'Archives',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!conversation) {
    return (
      <ScreenWrapper style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Not Found',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackTitle: 'Archives',
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Conversation not found
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: conversation.title,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      />
      
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          {formatDate(conversation.createdAt)}
        </Text>
      </View>

      <FlatList
        data={conversation.messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  userAvatar: {
    marginLeft: 8,
    marginRight: 0,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});
