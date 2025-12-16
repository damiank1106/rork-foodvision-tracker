import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Platform, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTheme } from '@/context/ThemeContext';
import { Send, Bot, User as UserIcon, Archive, Trash2, Save } from 'lucide-react-native';
import { sendCoachMessage, ChatMessage, saveConversation } from '@/services/coach';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

export default function CoachScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isIPhone15ProMax = Platform.OS === 'ios' && screenWidth === 430 && screenHeight === 932;
  const extraPadding = isIPhone15ProMax ? 40 : 0;

  useFocusEffect(
    React.useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  const handleSaveConversation = async () => {
    if (messages.length === 0) {
      Alert.alert('No messages', 'Start a conversation first before saving.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await saveConversation(messages);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Conversation Saved',
        'Your conversation has been archived successfully.',
        [
          {
            text: 'View Archives',
            onPress: () => router.push('/coach/archives' as any),
          },
          {
            text: 'Continue Chat',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error saving conversation:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save conversation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;

    Alert.alert(
      'Clear Conversation',
      'Do you want to save this conversation before clearing?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Without Saving',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
        {
          text: 'Save & Clear',
          onPress: async () => {
            await handleSaveConversation();
            setMessages([]);
          },
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    Haptics.selectionAsync();

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages; 
      
      const aiResponseText = await sendCoachMessage(userMsg.text, history);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: aiResponseText,
        createdAt: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: error.message || "Sorry, I couldn't respond. Please check your internet connection or API key and try again.",
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <Animated.View 
        entering={FadeInUp.springify().mass(0.5)} 
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

  return (
    <ScreenWrapper style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'AI Coach',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerRight: () => (
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={handleClearChat}
                  style={[styles.headerButton, { backgroundColor: colors.glassBackgroundStrong }]}
                  disabled={messages.length === 0}
                >
                  <Trash2 size={18} color={messages.length === 0 ? colors.textMuted : colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSaveConversation}
                  style={[styles.headerButton, { backgroundColor: colors.glassBackgroundStrong }]}
                  disabled={isSaving || messages.length === 0}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Save size={18} color={messages.length === 0 ? colors.textMuted : colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/coach/archives' as any)}
                  style={[styles.headerButton, { backgroundColor: colors.glassBackgroundStrong }]}
                >
                  <Archive size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <View key={`coach-view-${animationKey}`} style={styles.container}>
        <View style={styles.header}>
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ask me anything about your meals, nutrition, and vitamins.</Text>
          </Animated.View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: 'rgba(77, 184, 255, 0.1)' }]}>
                  <Bot size={48} color={colors.primary} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Hi! I&apos;m your nutrition coach. Ask me about your recent meals or general nutrition questions.
                </Text>
              </Animated.View>
            }
            ListFooterComponent={
              isLoading ? (
                <Animated.View entering={FadeIn} style={styles.loadingContainer}>
                  <View style={styles.avatarContainer}>
                    <Bot size={16} color={colors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.aiBubble, styles.loadingBubble, { backgroundColor: colors.glassBackgroundStrong }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                </Animated.View>
              ) : null
            }
          />

          <View
            style={[styles.inputWrapper, { 
              borderTopColor: colors.glassBorder,
              paddingBottom: insets.bottom + (Platform.OS === 'android' ? 46 : 14) + extraPadding
            }]}
          >
            <BlurView intensity={30} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.glassBackgroundStrong,
                  color: colors.text,
                  borderColor: colors.glassBorder
                }]}
                placeholder="Ask a question..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="default"
              />
              <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: colors.primary }, !inputText.trim() && styles.sendButtonDisabled]} 
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Send size={20} color={inputText.trim() ? '#FFF' : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        </View>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
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
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFF',
  },
  inputWrapper: {
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
});
