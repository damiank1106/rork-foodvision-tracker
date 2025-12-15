import { getStoredDeepSeekKey } from '@/hooks/useSettings';
import { getAllMeals } from '@/services/mealsDb';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdated: number;
}

const CONVERSATIONS_KEY = 'coach_conversations';

export async function sendCoachMessage(userMessage: string, previousMessages: ChatMessage[] = []): Promise<string> {
  const apiKey = await getStoredDeepSeekKey();
  if (!apiKey) {
    throw new Error('DeepSeek API key not found. Please add it in Settings.');
  }

  try {
    // 1. Fetch recent meals for context
    const allMeals = await getAllMeals();
    const recentMeals = allMeals.slice(0, 10);
    
    const mealsContext = recentMeals.map(m => {
      const date = new Date(m.createdAt).toLocaleDateString();
      const good = m.goodPoints.join(', ');
      const bad = m.badPoints.join(', ');
      return `[${date}] ${m.dishName} (${m.caloriesEstimate} kcal). Good: ${good}. Concerns: ${bad}.`;
    }).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are a friendly nutrition and food coach for the FoodVision Tracker app.
The user logs meals with calories, macros, vitamins and good/bad points.
Give concise, clear, encouraging advice.
Use simple language.
If they ask about their logged meals, focus on patterns and suggestions, not strict medical advice.

Context - Last 10 meals logged by user:
${mealsContext}`
      },
      ...previousMessages.map(m => ({
        role: m.sender,
        content: m.text
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error (Coach):', response.status, errorText);
      throw new Error(`DeepSeek API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "I couldn't generate a response.";

  } catch (error: any) {
    console.error('Error in sendCoachMessage:', error);
    
    // Handle Web CORS specific error
    if (Platform.OS === 'web' && error instanceof TypeError && error.message === 'Load failed') {
      throw new Error('AI Chat is not available in the web preview due to browser security restrictions (CORS). Please test this feature on a mobile device.');
    }
    
    // Handle generic network errors
    if (error instanceof TypeError && error.message === 'Load failed') {
      throw new Error('Network request failed. Please check your internet connection.');
    }

    throw error;
  }
}

export async function saveConversation(messages: ChatMessage[]): Promise<SavedConversation> {
  if (messages.length === 0) {
    throw new Error('Cannot save empty conversation');
  }

  const firstUserMessage = messages.find(m => m.sender === 'user');
  const title = firstUserMessage?.text.slice(0, 50) + (firstUserMessage?.text.length && firstUserMessage.text.length > 50 ? '...' : '') || 'New Conversation';
  
  const conversation: SavedConversation = {
    id: Date.now().toString(),
    title,
    messages,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };

  const existingConversations = await getAllConversations();
  const updatedConversations = [conversation, ...existingConversations];
  
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));
  console.log('Conversation saved:', conversation.id);
  
  return conversation;
}

export async function getAllConversations(): Promise<SavedConversation[]> {
  try {
    const stored = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored) as SavedConversation[];
    return conversations.sort((a, b) => b.lastUpdated - a.lastUpdated);
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await getAllConversations();
  const filtered = conversations.filter(c => c.id !== id);
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
  console.log('Conversation deleted:', id);
}

export async function loadConversation(id: string): Promise<SavedConversation | null> {
  const conversations = await getAllConversations();
  return conversations.find(c => c.id === id) || null;
}
