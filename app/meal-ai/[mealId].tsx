import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTheme } from '@/context/ThemeContext';
import { getMealById, SavedMeal } from '@/services/mealsDb';
import { askMealAI } from '@/services/mealAi';
import { Bot, Send, User as UserIcon, Salad, Clock } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

export default function MealAiScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [meal, setMeal] = useState<SavedMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (mealId) {
      loadMeal(mealId);
    }
  }, [mealId]);

  const loadMeal = async (id: string) => {
    try {
      const data = await getMealById(id);
      setMeal(data);
    } catch (error) {
      console.error('Failed to load meal', error);
      Alert.alert('Error', 'Could not load meal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!meal || !inputText.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    Haptics.selectionAsync();

    try {
      const reply = await askMealAI(meal, userMessage.text);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('AI error', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        sender: 'assistant',
        text: error?.message || 'Could not reach the AI service. Please check your key and connection.',
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <Animated.View
        entering={FadeInUp.springify().mass(0.5)}
        style={[styles.bubbleRow, isUser ? styles.userRow : styles.aiRow]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.glassBackgroundStrong }]}>
            <Bot size={16} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? { backgroundColor: colors.primary } : { backgroundColor: colors.glassBackgroundStrong, borderWidth: 1, borderColor: colors.glassBorder }]}>
          <Text selectable style={[styles.messageText, isUser ? { color: '#fff' } : { color: colors.text }]}>{item.text}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar, { backgroundColor: colors.primary }]}>
            <UserIcon size={16} color="#fff" />
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!meal) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.text }]}>Meal not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.glassBackgroundStrong }]}>
            <Text style={{ color: colors.text }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const mealTitle = meal.name || meal.dishName;
  const mealDate = new Date(meal.dateTime || meal.createdAt).toLocaleString();

  return (
    <ScreenWrapper style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'AI Coach',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitle: () => (
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Coach</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{mealTitle}</Text>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.mealBanner, { backgroundColor: colors.glassBackgroundStrong, borderColor: colors.glassBorder }]}>
          <View style={styles.bannerLeft}>
            <Salad size={18} color={colors.text} />
            <Text style={[styles.bannerTitle, { color: colors.text }]} numberOfLines={1}>{mealTitle}</Text>
          </View>
          <View style={styles.bannerRight}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.bannerDate, { color: colors.textSecondary }]} numberOfLines={1}>{mealDate}</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ref={flatListRef}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputBar, { backgroundColor: colors.glassBackgroundStrong, borderColor: colors.glassBorder }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about this meal"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isSending || !inputText.trim()}
            style={[styles.sendBtn, { backgroundColor: isSending || !inputText.trim() ? colors.glassBackgroundStrong : colors.primary }]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Send size={18} color={isSending || !inputText.trim() ? colors.textMuted : '#fff'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  mealBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerDate: {
    fontSize: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  userAvatar: {
    marginLeft: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
