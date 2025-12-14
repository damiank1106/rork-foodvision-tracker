import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useTheme } from '@/context/ThemeContext';
import { Scan, UtensilsCrossed, Flame, Trophy } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { getTodaySummary, getStreak, TodaySummary } from '@/services/mealsStats';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [streak, setStreak] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  // Animation values
  const progressWidth = useSharedValue(0);
  const scanButtonScale = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for scan button
    scanButtonScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [scanButtonScale]);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      // Profile is loaded from context, but we need it for summary calc
      if (profile) {
        const s = await getTodaySummary(today, profile.calorieTarget);
        setSummary(s);
        // Animate progress bar
        if (s) {
           progressWidth.value = withSpring(Math.min(s.progress * 100, 100), { damping: 15 });
        }
      }

      const st = await getStreak();
      setStreak(st);
      
    } catch (e) {
      console.error(e);
    }
  }, [profile, progressWidth]);

  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1);
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      backgroundColor: (summary?.progress || 0) > 1 ? colors.error : colors.tint,
    };
  });

  const scanButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scanButtonScale.value }],
    };
  });

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <Animated.View key={`header-${animationKey}`} entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.titleRow}>
             <UtensilsCrossed size={28} color={colors.tint} style={{ marginRight: 12 }} />
             <Text style={[styles.title, { color: colors.text }]}>FoodVision</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{getFormattedDate()}</Text>
        </Animated.View>

        {/* Today Summary Card */}
        <Animated.View key={`summary-${animationKey}`} entering={FadeInUp.delay(300).springify()} style={styles.section}>
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Today&apos;s Summary</Text>
                <Text style={[styles.streakText, { color: colors.tint }]}>
                   <Trophy size={14} color={colors.tint} /> Streak: {streak} day{streak !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.calContainer}>
                 <Flame size={24} color={colors.tint} />
                 <Text style={[styles.calText, { color: colors.text }]}>
                   {Math.round(summary?.totalCalories || 0)} <Text style={[styles.calTarget, { color: colors.textSecondary }]}>/ {summary?.caloriesTarget || profile?.calorieTarget || 2000}</Text>
                 </Text>
                 <Text style={[styles.calUnit, { color: colors.textSecondary }]}>kcal</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>

            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                   {Math.round(summary?.protein || 0)}g
                   <Text style={{fontSize: 12, color: colors.textSecondary, fontWeight: 'normal'}}>{profile?.proteinTarget ? ` / ${profile.proteinTarget}g` : ''}</Text>
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
              </View>
              <View style={[styles.macroDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                   {Math.round(summary?.carbs || 0)}g
                   <Text style={{fontSize: 12, color: colors.textSecondary, fontWeight: 'normal'}}>{profile?.carbsTarget ? ` / ${profile.carbsTarget}g` : ''}</Text>
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
              </View>
              <View style={[styles.macroDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                   {Math.round(summary?.fats || 0)}g
                   <Text style={{fontSize: 12, color: colors.textSecondary, fontWeight: 'normal'}}>{profile?.fatsTarget ? ` / ${profile.fatsTarget}g` : ''}</Text>
                </Text>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fats</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View key={`scan-${animationKey}`} entering={FadeInUp.delay(500).springify()} style={styles.mainAction}>
          <GlassCard style={styles.scanCard}>
            <Scan size={48} color={colors.tint} style={styles.scanIcon} />
            <Text style={[styles.scanText, { color: colors.text }]}>Ready to track?</Text>
            <Text style={[styles.scanHint, { color: colors.textSecondary }]}>Scan and save your meals to keep this summary up to date.</Text>
            <Animated.View style={[{ width: '100%' }, scanButtonStyle]}>
              <GlassButton 
                title="Scan a Meal" 
                onPress={() => router.push('/scan' as any)} 
                style={styles.scanButton}
              />
            </Animated.View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    marginLeft: 40,
  },
  section: {
    marginBottom: 24,
  },
  summaryCard: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  calContainer: {
    alignItems: 'flex-end',
  },
  calText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  calTarget: {
    fontSize: 14,
    fontWeight: '400',
  },
  calUnit: {
    fontSize: 11,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
  },
  macroDivider: {
    width: 1,
    height: 24,
  },
  mainAction: {
    alignItems: 'stretch',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  mealsScroll: {
    gap: 12,
    paddingRight: 24,
  },
  mealCardWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  mealCard: {
    width: 140,
    padding: 12,
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  mealInfo: {
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  mealCals: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 16,
    borderRadius: 16,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
  },
  modalStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  pointsSection: {
    marginBottom: 20,
  },
  pointHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  pointText: {
    fontSize: 14,
  },
  scanCard: {
    alignItems: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  scanIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  scanText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scanHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  scanButton: {
    width: '100%',
    minWidth: 200,
  },
});
