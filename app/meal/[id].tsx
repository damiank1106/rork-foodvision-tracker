import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, Alert, Platform, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useTheme } from '@/context/ThemeContext';
import { getMealById, SavedMeal, updateMeal, deleteMeal } from '@/services/mealsDb';
import { askMealAI } from '@/services/mealAi';
import { ArrowLeft, Calendar, Flame, Utensils, AlertTriangle, CheckCircle2, Edit3, X, Save, Trash2, StickyNote, Bot } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [meal, setMeal] = useState<SavedMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedMeal, setEditedMeal] = useState<SavedMeal | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMeal(id);
    }
  }, [id]);

  const loadMeal = async (mealId: string) => {
    try {
      const data = await getMealById(mealId);
      setMeal(data);
    } catch {
      Alert.alert('Error', 'Failed to load meal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (meal) {
      setEditedMeal({ ...meal });
      setEditModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedMeal) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await updateMeal(editedMeal);
      setMeal(editedMeal);
      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Meal updated successfully!');
    } catch (error) {
      console.error('Failed to update meal:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditedMeal(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleOpenAi = () => {
    if (!meal) return;
    const baseQuestion = `What do you think about ${meal.dishName || meal.name}?`;
    setAiQuestion(baseQuestion);
    setAiResponse('');
    setAiModalVisible(true);
    Haptics.selectionAsync();
  };

  const handleAskAi = async () => {
    const targetMeal = editedMeal || meal;
    if (!targetMeal) return;

    if (!aiQuestion.trim()) {
      Alert.alert('Ask a question', 'Please enter a question for the AI.');
      return;
    }

    setAiLoading(true);
    try {
      const reply = await askMealAI(targetMeal, aiQuestion.trim());
      setAiResponse(reply);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('AI error', error);
      Alert.alert('AI unavailable', error?.message || 'Could not reach the AI service.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = () => {
    if (!meal) return;

    Alert.alert(
      'Delete meal',
      'Are you sure you want to remove this meal from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(meal.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              console.error('Failed to delete meal', error);
              Alert.alert('Error', 'Could not delete meal. Please try again.');
            }
          },
        },
      ]
    );
  };

  const updateEditedField = <K extends keyof SavedMeal>(field: K, value: SavedMeal[K]) => {
    if (editedMeal) {
      setEditedMeal({ ...editedMeal, [field]: value });
    }
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
          <GlassButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 20, width: 200 }} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Back and Edit Buttons */}
        <View style={styles.header}>
          <GlassButton 
            title="" 
            onPress={() => router.back()} 
            style={styles.backButton}
            textStyle={{ display: 'none' }} 
          />
          <View style={styles.backIconContainer} pointerEvents="none">
             <ArrowLeft color={colors.text} size={24} />
          </View>
        </View>
        <View style={styles.editButtonContainer}>
          <GlassButton
            title=""
            onPress={handleEdit}
            style={styles.editButton}
            textStyle={{ display: 'none' }}
          />
          <View style={styles.editIconContainer} pointerEvents="none">
             <Edit3 color={colors.primary} size={20} />
          </View>
        </View>
        <View style={styles.deleteButtonContainer}>
          <GlassButton
            title=""
            onPress={handleDelete}
            style={styles.editButton}
            textStyle={{ display: 'none' }}
          />
          <View style={styles.editIconContainer} pointerEvents="none">
             <Trash2 color={colors.error} size={20} />
          </View>
        </View>
        <View style={styles.aiButtonContainer}>
          <GlassButton
            title=""
            onPress={handleOpenAi}
            style={styles.editButton}
            textStyle={{ display: 'none' }}
          />
          <View style={styles.editIconContainer} pointerEvents="none">
             <Bot color={colors.primary} size={20} />
          </View>
        </View>

        {/* Image */}
        <Animated.View entering={ZoomIn.duration(500).springify()} style={[styles.imageContainer, { backgroundColor: colors.glassBackgroundStrong }]}>
          <Image source={{ uri: meal.photoUri || meal.imageUri }} style={styles.image} resizeMode="cover" />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard style={styles.card}>
              <Text style={[styles.dishName, { color: colors.text }]}>{meal.dishName}</Text>
              <View style={styles.metaRow}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{new Date(meal.dateTime || meal.createdAt).toLocaleString()}</Text>
              </View>
              <View style={styles.calRow}>
                <Flame size={20} color={colors.tint} />
                <Text style={[styles.calText, { color: colors.tint }]}>{Math.round(meal.caloriesEstimate)} kcal</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GlassCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <Utensils size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{meal.ingredientsDescription}</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition Summary</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{meal.nutritionSummary}</Text>
              
              <View style={[styles.macrosGrid, { borderTopColor: colors.glassBorder }]}>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: colors.text }]}>{meal.proteinGrams}g</Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: colors.text }]}>{meal.carbsGrams}g</Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: colors.text }]}>{meal.fatGrams}g</Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fats</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: colors.text }]}>{meal.fiberGrams}g</Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fiber</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <GlassCard style={styles.card}>
              <View style={styles.goodBadContainer}>
                <View style={styles.halfCol}>
                  <View style={styles.sectionHeader}>
                    <CheckCircle2 size={18} color={colors.success} style={{ marginRight: 6 }} />
                    <Text style={[styles.sectionTitle, { color: colors.success }]}>Good</Text>
                  </View>
                  {meal.goodPoints.map((p, i) => (
                    <Text key={i} style={[styles.pointText, { color: colors.textSecondary }]}>• {p}</Text>
                  ))}
                </View>
                <View style={[styles.colDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.halfCol}>
                  <View style={styles.sectionHeader}>
                    <AlertTriangle size={18} color={colors.error} style={{ marginRight: 6 }} />
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>Concerns</Text>
                  </View>
                  {meal.badPoints.map((p, i) => (
                    <Text key={i} style={[styles.pointText, { color: colors.textSecondary }]}>• {p}</Text>
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {!!meal.notes && (
            <Animated.View entering={FadeInDown.delay(550).springify()}>
              <GlassCard style={styles.card}>
                <View style={styles.sectionHeader}>
                  <StickyNote size={18} color={colors.text} style={{ marginRight: 6 }} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
                </View>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{meal.notes}</Text>
              </GlassCard>
            </Animated.View>
          )}
        </View>

      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.glassBorder }]}>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.modalHeaderButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Meal</Text>
              <TouchableOpacity onPress={handleSaveEdit} disabled={saving} style={styles.modalHeaderButton}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Save size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Dish Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.dishName}
                  onChangeText={(text) => updateEditedField('dishName', text)}
                  placeholder="Enter dish name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Ingredients</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.ingredientsDescription}
                  onChangeText={(text) => updateEditedField('ingredientsDescription', text)}
                  placeholder="Describe ingredients"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.notes || ''}
                  onChangeText={(text) => updateEditedField('notes', text)}
                  placeholder="Add personal notes or reminders"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nutrition Summary</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.nutritionSummary}
                  onChangeText={(text) => updateEditedField('nutritionSummary', text)}
                  placeholder="Nutrition summary"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.macrosRow}>
                <View style={styles.macroField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Calories</Text>
                  <TextInput
                    style={[styles.textInput, styles.numberInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                    value={editedMeal?.caloriesEstimate.toString()}
                    onChangeText={(text) => updateEditedField('caloriesEstimate', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.macroField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.textInput, styles.numberInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                    value={editedMeal?.proteinGrams.toString()}
                    onChangeText={(text) => updateEditedField('proteinGrams', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.macrosRow}>
                <View style={styles.macroField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Carbs (g)</Text>
                  <TextInput
                    style={[styles.textInput, styles.numberInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                    value={editedMeal?.carbsGrams.toString()}
                    onChangeText={(text) => updateEditedField('carbsGrams', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.macroField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.textInput, styles.numberInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                    value={editedMeal?.fatGrams.toString()}
                    onChangeText={(text) => updateEditedField('fatGrams', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Fiber (g)</Text>
                <TextInput
                  style={[styles.textInput, styles.numberInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.fiberGrams.toString()}
                  onChangeText={(text) => updateEditedField('fiberGrams', parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.success }]}>Good Points (comma separated)</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.goodPoints.join(', ')}
                  onChangeText={(text) => updateEditedField('goodPoints', text.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="High protein, Rich in vitamins"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.error }]}>Concerns (comma separated)</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                  value={editedMeal?.badPoints.join(', ')}
                  onChangeText={(text) => updateEditedField('badPoints', text.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="High sodium, High sugar"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={aiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={[styles.aiOverlay, { backgroundColor: colors.modalOverlay || 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.aiAvoider}
          >
            <View style={[styles.aiCard, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}>
              <View style={[styles.aiHeader, { borderBottomColor: colors.glassBorder }]}>
                <Text style={[styles.aiTitle, { color: colors.text }]}>Ask AI about this meal</Text>
                <TouchableOpacity onPress={() => setAiModalVisible(false)} style={styles.aiCloseButton}>
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TextInput
                value={aiQuestion}
                onChangeText={setAiQuestion}
                placeholder="Ask for healthier swaps, macro tips, or portion advice"
                placeholderTextColor={colors.textMuted}
                style={[styles.aiInput, { backgroundColor: colors.glassBackgroundStrong, color: colors.text, borderColor: colors.glassBorder }]}
                multiline
              />
              <TouchableOpacity
                onPress={handleAskAi}
                disabled={aiLoading}
                style={[styles.aiSendButton, { backgroundColor: aiLoading ? colors.glassBackgroundStrong : colors.primary }]}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={[styles.aiSendText, { color: '#fff' }]}>Ask</Text>
                )}
              </TouchableOpacity>
              <ScrollView style={[styles.aiResponseBox, { borderColor: colors.glassBorder }]} contentContainerStyle={{ padding: 4 }}>
                {aiResponse ? (
                  <Text style={[styles.aiResponseText, { color: colors.text }]}>{aiResponse}</Text>
                ) : (
                  <Text style={[styles.aiPlaceholder, { color: colors.textSecondary }]}>AI tips will appear here.</Text>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 40, 
    left: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginVertical: 0,
  },
  backIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 350,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    marginTop: -40, // Overlap image
  },
  card: {
    marginBottom: 16,
  },
  dishName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  macroBox: {
    alignItems: 'center',
    flex: 1,
  },
  macroVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  goodBadContainer: {
    flexDirection: 'row',
  },
  halfCol: {
    flex: 1,
  },
  colDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  pointText: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  editButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 40,
    right: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 96,
    right: 20,
    zIndex: 9,
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  aiButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 112 : 152,
    right: 20,
    zIndex: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
  },
  editButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginVertical: 0,
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHeaderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  numberInput: {
    textAlign: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  macroField: {
    flex: 1,
  },
  aiOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  aiAvoider: {
    width: '100%',
    alignItems: 'center',
  },
  aiCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  aiCloseButton: {
    padding: 6,
  },
  aiInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  aiSendButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSendText: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiResponseBox: {
    minHeight: 90,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  aiResponseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiPlaceholder: {
    fontSize: 14,
    textAlign: 'center',
  },
});
