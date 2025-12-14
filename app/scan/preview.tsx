import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { analyzeMealWithOpenAi, MealAnalysisResult } from '@/services/openai';
import { useTheme } from '@/context/ThemeContext';
import { getStoredOpenAiKey } from '@/hooks/useSettings';
import { insertMeal } from '@/services/mealsDb';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';

export default function PhotoPreviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysisResult | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const key = await getStoredOpenAiKey();
    setHasApiKey(!!key);
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    Haptics.selectionAsync();
    
    if (!hasApiKey) {
      Alert.alert(
        'Missing API Key',
        'Please add your OpenAI Vision API key in Settings to analyze meals.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/profile' as any) }
        ]
      );
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeMealWithOpenAi(imageUri);
      setResult(analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Analysis Failed', 'We could not analyze this meal. Please check your internet connection or API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !imageUri) return;
    setIsSaving(true);

    try {
      const mealId = Crypto.randomUUID();
      const timestamp = new Date().toISOString();
      await insertMeal({
        id: mealId,
        imageUri,
        photoUri: imageUri,
        createdAt: timestamp,
        dateTime: timestamp,
        name: result.dishName,
        dishName: result.dishName,
        ingredientsDescription: result.ingredientsDescription,
        nutritionSummary: result.nutritionSummary,
        caloriesEstimate: result.caloriesEstimate,
        proteinGrams: result.proteinGrams,
        carbsGrams: result.carbsGrams,
        fatGrams: result.fatGrams,
        fiberGrams: result.fiberGrams,
        goodPoints: result.goodPoints,
        badPoints: result.badPoints,
        source: 'scanned',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Meal saved to history!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/history' as any) }
      ]);
    } catch (e) {
      console.error(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save meal.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!imageUri) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>No image provided.</Text>
          <GlassButton title="Go Back" onPress={() => router.back()} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.Image 
        entering={ZoomIn.duration(500)}
        source={{ uri: imageUri }} 
        style={styles.imageBackground} 
        resizeMode="cover" 
      />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
           {/* Close Button */}
           <TouchableOpacity 
             style={[styles.closeButton]} 
             onPress={() => router.navigate('/(tabs)' as any)}
           >
             <X size={32} color="#FFF" />
           </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {!result && (
              <View style={styles.initialStateContainer}>
                {isAnalyzing ? (
                  <Animated.View entering={FadeInUp.springify()}>
                    <GlassCard style={styles.loadingCard}>
                      <ActivityIndicator size="large" color={colors.tint} />
                      <Text style={[styles.loadingText, { color: colors.text }]}>Analyzing your meal...</Text>
                    </GlassCard>
                  </Animated.View>
                ) : (
                  <View style={styles.buttonContainer}>
                    <Animated.View entering={FadeInUp.delay(100).springify()}>
                      <GlassButton 
                        title="Analyze with OpenAI Vision" 
                        onPress={handleAnalyze} 
                        style={styles.analyzeButton}
                      />
                    </Animated.View>
                    <Animated.View entering={FadeInUp.delay(150).springify()}>
                      <GlassButton 
                        title="Crop & Resize" 
                        variant="secondary"
                        onPress={() => router.push({ pathname: '/scan/crop', params: { imageUri } } as any)} 
                        style={styles.cropButton}
                      />
                    </Animated.View>
                    <Animated.View entering={FadeInUp.delay(200).springify()}>
                      <GlassButton 
                        title="Retake" 
                        variant="secondary"
                        onPress={() => router.back()} 
                        style={styles.retakeButton}
                      />
                    </Animated.View>
                    {!hasApiKey && hasApiKey !== null && (
                      <Animated.View entering={FadeInUp.delay(300).springify()}>
                        <GlassCard style={styles.warningCard}>
                          <Text style={[styles.warningText, { color: colors.text }]}>
                            OpenAI API key not found. Please add it in Settings first.
                          </Text>
                          <GlassButton 
                            title="Go to Settings" 
                            onPress={() => router.push('/(tabs)/profile' as any)}
                            style={{ marginTop: 8 }}
                          />
                        </GlassCard>
                      </Animated.View>
                    )}
                  </View>
                )}
              </View>
            )}

            {result && (
              <View style={styles.resultContainer}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <GlassCard style={styles.resultCard}>
                    <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Detected Dish</Text>
                    <Text style={[styles.cardBody, { color: colors.text }]}>{result.dishName}</Text>
                  </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <GlassCard style={styles.resultCard}>
                    <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Likely Ingredients</Text>
                    <Text style={[styles.cardBody, { color: colors.text }]}>{result.ingredientsDescription}</Text>
                  </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <GlassCard style={styles.resultCard}>
                    <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Nutrition Overview</Text>
                    <Text style={[styles.cardBody, { color: colors.text }]}>{result.nutritionSummary}</Text>
                    <View style={styles.macrosRow}>
                      <Text style={[styles.macroText, { color: colors.tint }]}>Prot: {result.proteinGrams}g</Text>
                      <Text style={[styles.macroText, { color: colors.tint }]}>Carbs: {result.carbsGrams}g</Text>
                      <Text style={[styles.macroText, { color: colors.tint }]}>Fat: {result.fatGrams}g</Text>
                    </View>
                  </GlassCard>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                   <GlassButton 
                    title="Save Meal" 
                    onPress={handleSave} 
                    isLoading={isSaving}
                    style={styles.saveButton}
                  />
                  <GlassButton 
                    title="Discard & Home" 
                    variant="secondary"
                    onPress={() => router.navigate('/(tabs)' as any)} 
                    style={styles.doneButton}
                  />
                </Animated.View>
              </View>
            )}
            
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Darken image slightly
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  initialStateContainer: {
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  analyzeButton: {
    marginBottom: 0,
  },
  cropButton: {
    marginBottom: 0,
  },
  retakeButton: {
    marginTop: 0,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    marginTop: 16,
    padding: 16,
  },
  warningText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  resultContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  resultCard: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardBody: {
    fontSize: 18,
    lineHeight: 26,
  },
  macrosRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  macroText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginBottom: 8,
  },
  doneButton: {
    marginTop: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  }
});
