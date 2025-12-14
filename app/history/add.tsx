import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useTheme } from '@/context/ThemeContext';
import { insertMeal, SavedMeal } from '@/services/mealsDb';
import { Camera, Image as ImageIcon, CalendarClock } from 'lucide-react-native';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60';

export default function AddMealScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [mealName, setMealName] = useState('');
  const [notes, setNotes] = useState('');
  const [dateText, setDateText] = useState(new Date().toISOString());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCompactScreen = height <= 780;

  const parsedDate = new Date(dateText);
  const readableDate = isNaN(parsedDate.getTime()) ? 'Invalid date' : parsedDate.toLocaleString();

  const requestImage = async (mode: 'camera' | 'library') => {
    const permission = mode === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your camera or library to attach a photo.');
      return;
    }

    const pickerMethod = mode === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await pickerMethod({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Meal name required', 'Please enter a name for this meal.');
      return;
    }

    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please provide a valid date/time.');
      return;
    }

    setSaving(true);
    const id = Crypto.randomUUID();
    const timestamp = parsedDate.toISOString();

    const meal: SavedMeal = {
      id,
      name: mealName.trim(),
      dishName: mealName.trim(),
      dateTime: timestamp,
      createdAt: timestamp,
      notes: notes.trim(),
      photoUri: photoUri || DEFAULT_IMAGE,
      imageUri: photoUri || DEFAULT_IMAGE,
      ingredientsDescription: notes.trim() || 'Manual entry - update later',
      nutritionSummary: 'Manually added meal. Update nutrition after scanning.',
      caloriesEstimate: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      goodPoints: [],
      badPoints: [],
      source: 'manual',
    };

    try {
      await insertMeal(meal);
      Alert.alert('Saved', 'Meal added to your history.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save meal', error);
      Alert.alert('Error', 'Could not save your meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Meal',
          headerBackTitle: ' ',
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, isCompactScreen && styles.scrollContentCompact]}>
          <GlassCard style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Meal Name *</Text>
            <TextInput
              value={mealName}
              onChangeText={setMealName}
              placeholder="e.g. Veggie bowl"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
            />
          </GlassCard>

          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Date & Time</Text>
              <TouchableOpacity
                onPress={() => setDateText(new Date().toISOString())}
                style={[styles.dateButton, { backgroundColor: colors.glassBackgroundStrong }]}
              >
                <CalendarClock color={colors.text} size={16} />
                <Text style={[styles.dateText, { color: colors.text }]}>Now</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={dateText}
              onChangeText={setDateText}
              onBlur={() => {
                if (isNaN(new Date(dateText).getTime())) {
                  Alert.alert('Invalid date', 'Please use a valid ISO date/time.');
                  setDateText(new Date().toISOString());
                }
              }}
              placeholder="YYYY-MM-DDTHH:MM:SSZ"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder, marginTop: 10 }]}
            />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Local time: {readableDate}</Text>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes, ingredients or reminders"
              placeholderTextColor={colors.textMuted}
              style={[styles.textArea, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
              multiline
              numberOfLines={4}
            />
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Photo (optional)</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity
                onPress={() => requestImage('camera')}
                style={[styles.actionButton, { backgroundColor: colors.glassBackgroundStrong }]}
              >
                <Camera color={colors.text} size={18} />
                <Text style={[styles.actionText, { color: colors.text }]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => requestImage('library')}
                style={[styles.actionButton, { backgroundColor: colors.glassBackgroundStrong }]}
              >
                <ImageIcon color={colors.text} size={18} />
                <Text style={[styles.actionText, { color: colors.text }]}>Choose</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: photoUri || DEFAULT_IMAGE }}
              style={[styles.preview, { backgroundColor: colors.glassBackgroundStrong }]}
            />
          </GlassCard>

          <GlassButton
            title={saving ? 'Saving...' : 'Save Meal'}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 16,
  },
  scrollContentCompact: {
    paddingTop: 0,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
  },
  textArea: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dateText: {
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionText: {
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  saveButton: {
    marginTop: 8,
  },
});
