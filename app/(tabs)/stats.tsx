import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Animated as RNAnimated, useWindowDimensions } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { Flame, TrendingUp, TrendingDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Award, Apple, BarChart3, ChevronDown } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

import { useProfile } from '@/context/ProfileContext';
import { getMealsByDateRange, SavedMeal } from '@/services/mealsDb';
import * as Haptics from 'expo-haptics';



const getResponsiveSizes = (width: number, height: number) => {
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const isLargeTablet = width >= 1024;
  const isMediumPhone = width >= 375 && width < 430;
  const isIPhone15ProMax = width === 430 && height === 932;
  
  return {
    isTablet,
    isSmallPhone,
    isLargeTablet,
    isMediumPhone,
    isIPhone15ProMax,
    titleSize: isTablet ? 40 : isSmallPhone ? 28 : 34,
    monthTextSize: isTablet ? 20 : isSmallPhone ? 16 : 18,
    calendarDayTextSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
    statValueSize: isTablet ? 28 : isSmallPhone ? 18 : isMediumPhone ? 20 : 24,
    detailsDateSize: isTablet ? 24 : isSmallPhone ? 18 : 20,
    caloriesValueSize: isTablet ? 36 : isSmallPhone ? 28 : 32,
    macroValueSize: isTablet ? 22 : isSmallPhone ? 18 : 20,
    padding: isTablet ? 24 : isSmallPhone ? 16 : 20,
    cardPadding: isTablet ? 20 : isSmallPhone ? 12 : 16,
    statsPerRow: isLargeTablet ? 4 : isTablet ? 3 : 2,
    gap: isTablet ? 20 : 12,
    statCardPadding: isTablet ? 16 : isSmallPhone ? 8 : isMediumPhone ? 10 : 14,
    statIconSize: isTablet ? 40 : isSmallPhone ? 28 : isMediumPhone ? 30 : 36,
    paddingBottom: isIPhone15ProMax ? 120 : 100,
  };
};

interface DayData {
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: SavedMeal[];
  goodFoodCount: number;
  badFoodCount: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface MonthStats {
  totalCalories: number;
  avgDailyCalories: number;
  totalMeals: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  goodFoodCount: number;
  badFoodCount: number;
  daysTracked: number;
  maxCaloriesDay: number;
  minCaloriesDay: number;
}

interface CompareMonthData {
  month: number;
  year: number;
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalFiber: number;
  hasMeals: boolean;
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { width, height } = useWindowDimensions();
  
  const responsive = getResponsiveSizes(width, height);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  
  const [compareMonth1, setCompareMonth1] = useState<number>(new Date().getMonth());
  const [compareYear1, setCompareYear1] = useState<number>(new Date().getFullYear());
  const [compareMonth2, setCompareMonth2] = useState<number>(new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1);
  const [compareYear2, setCompareYear2] = useState<number>(new Date().getMonth() - 1 < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());
  const [showMonth1Picker, setShowMonth1Picker] = useState<boolean>(false);
  const [showYear1Picker, setShowYear1Picker] = useState<boolean>(false);
  const [showMonth2Picker, setShowMonth2Picker] = useState<boolean>(false);
  const [showYear2Picker, setShowYear2Picker] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<{month1: CompareMonthData | null, month2: CompareMonthData | null}>({month1: null, month2: null});

  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const titleFadeAnim = useRef(new RNAnimated.Value(0)).current;
  const calendarFadeAnim = useRef(new RNAnimated.Value(0)).current;
  const detailsFadeAnim = useRef(new RNAnimated.Value(0)).current;
  const summaryFadeAnim = useRef(new RNAnimated.Value(0)).current;
  const compareBar1Anim = useRef(new RNAnimated.Value(0)).current;
  const compareBar2Anim = useRef(new RNAnimated.Value(0)).current;

  // Keep track of currentDate in a ref to avoid triggering useFocusEffect when it changes
  const currentDateRef = useRef(currentDate);

  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  const loadMonthData = useCallback(async (date: Date, animate: boolean = true) => {
    if (animate) {
      RNAnimated.parallel([
        RNAnimated.timing(calendarFadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        RNAnimated.timing(detailsFadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        RNAnimated.timing(summaryFadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startOfCalendar = new Date(firstDay);
      startOfCalendar.setDate(firstDay.getDate() - firstDay.getDay());
      
      const endOfCalendar = new Date(lastDay);
      endOfCalendar.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
      
      const meals = await getMealsByDateRange(
        startOfCalendar.toISOString(),
        endOfCalendar.toISOString()
      );
      
      const dayDataMap = new Map<string, DayData>();
      
      const currentDateObj = new Date(startOfCalendar);
      const localNow = new Date();
      const localTodayKey = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
      
      while (currentDateObj <= endOfCalendar) {
        const localDateKey = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
        const isToday = localDateKey === localTodayKey;
        const isCurrentMonth = currentDateObj.getMonth() === month;
        
        dayDataMap.set(localDateKey, {
          date: new Date(currentDateObj),
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          meals: [],
          goodFoodCount: 0,
          badFoodCount: 0,
          isToday,
          isCurrentMonth,
        });
        
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      
      meals.forEach(meal => {
        const mealDate = new Date(meal.createdAt);
        const mealLocalDateKey = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`;
        const dayData = dayDataMap.get(mealLocalDateKey);
        if (dayData) {
          dayData.calories += meal.caloriesEstimate;
          dayData.protein += meal.proteinGrams;
          dayData.carbs += meal.carbsGrams;
          dayData.fats += meal.fatGrams;
          dayData.meals.push(meal);
          dayData.goodFoodCount += meal.goodPoints.length;
          dayData.badFoodCount += meal.badPoints.length;
        }
      });
      
      const daysArray = Array.from(dayDataMap.values());
      setCalendarDays(daysArray);
      
      const currentMonthDays = daysArray.filter(d => d.isCurrentMonth && d.calories > 0);
      const totalCalories = currentMonthDays.reduce((sum, d) => sum + d.calories, 0);
      const totalMeals = currentMonthDays.reduce((sum, d) => sum + d.meals.length, 0);
      const totalProtein = currentMonthDays.reduce((sum, d) => sum + d.protein, 0);
      const totalCarbs = currentMonthDays.reduce((sum, d) => sum + d.carbs, 0);
      const totalFats = currentMonthDays.reduce((sum, d) => sum + d.fats, 0);
      const goodFoodCount = currentMonthDays.reduce((sum, d) => sum + d.goodFoodCount, 0);
      const badFoodCount = currentMonthDays.reduce((sum, d) => sum + d.badFoodCount, 0);
      const daysTracked = currentMonthDays.length;
      
      const caloriesPerDay = currentMonthDays.map(d => d.calories).filter(c => c > 0);
      const maxCaloriesDay = caloriesPerDay.length > 0 ? Math.max(...caloriesPerDay) : 0;
      const minCaloriesDay = caloriesPerDay.length > 0 ? Math.min(...caloriesPerDay) : 0;
      
      setMonthStats({
        totalCalories,
        avgDailyCalories: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
        totalMeals,
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFats: Math.round(totalFats),
        goodFoodCount,
        badFoodCount,
        daysTracked,
        maxCaloriesDay: Math.round(maxCaloriesDay),
        minCaloriesDay: Math.round(minCaloriesDay),
      });
      
      const todayData = dayDataMap.get(localTodayKey);
      if (todayData) {
        setSelectedDay(todayData);
      }
      
      if (animate) {
        RNAnimated.parallel([
          RNAnimated.timing(calendarFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          RNAnimated.timing(detailsFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          RNAnimated.timing(summaryFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (e) {
      console.error('Error loading month data:', e);
      if (animate) {
        RNAnimated.parallel([
          RNAnimated.timing(calendarFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          RNAnimated.timing(detailsFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          RNAnimated.timing(summaryFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [calendarFadeAnim, detailsFadeAnim, summaryFadeAnim]);

  useFocusEffect(
    useCallback(() => {
      console.log('StatsScreen focused, starting animations and loading data');
      
      titleFadeAnim.setValue(0);
      calendarFadeAnim.setValue(0);
      detailsFadeAnim.setValue(0);
      summaryFadeAnim.setValue(0);
      
      loadMonthData(currentDateRef.current, false).then(() => {
        RNAnimated.stagger(100, [
          RNAnimated.timing(titleFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          RNAnimated.timing(calendarFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          RNAnimated.timing(detailsFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          RNAnimated.timing(summaryFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, [loadMonthData, titleFadeAnim, calendarFadeAnim, detailsFadeAnim, summaryFadeAnim])
  );

  useEffect(() => {
    if (selectedDay && profile) {
      const progress = profile.calorieTarget > 0 
        ? Math.min(selectedDay.calories / profile.calorieTarget, 1) 
        : 0;
      
      RNAnimated.spring(progressAnim, {
        toValue: progress,
        useNativeDriver: false,
        tension: 40,
        friction: 7,
      }).start();
    }
  }, [selectedDay, profile, progressAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonthData(currentDate, false);
    setRefreshing(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.selectionAsync();
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    loadMonthData(newDate, true);
  };

  const handleDayPress = (day: DayData) => {
    if (day.isCurrentMonth) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      RNAnimated.sequence([
        RNAnimated.timing(detailsFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        RNAnimated.timing(detailsFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      setSelectedDay(day);
    }
  };

  const getCalorieColor = (calories: number) => {
    if (!profile?.calorieTarget) return colors.textMuted;
    const ratio = calories / profile.calorieTarget;
    if (ratio < 0.5) return '#60A5FA';
    if (ratio < 0.8) return '#34D399';
    if (ratio < 1.2) return '#FBBF24';
    return '#F87171';
  };

  const getCalorieIntensity = (calories: number) => {
    if (calories === 0) return 0;
    if (!profile?.calorieTarget) return 0.3;
    const ratio = calories / profile.calorieTarget;
    return Math.min(ratio, 1);
  };

  const renderCalendar = () => {
    const weeks: DayData[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    const daySize = (width - (responsive.padding * 2) - (responsive.cardPadding * 2) - 12) / 7;

    return (
      <RNAnimated.View style={{ opacity: calendarFadeAnim }}>
        <GlassCard 
          style={styles.calendarCard} 
          contentStyle={{ padding: responsive.cardPadding }}
        >
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.monthTitle}>
            <CalendarIcon size={responsive.isSmallPhone ? 16 : 20} color={colors.tint} style={{ marginRight: 8 }} />
            <Text style={[styles.monthText, { color: colors.text, fontSize: responsive.monthTextSize }]}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={idx} style={[styles.weekDayText, { color: colors.textSecondary, width: daySize, fontSize: responsive.isSmallPhone ? 10 : 12 }]}>
              {day}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIdx) => (
          <View key={weekIdx} style={styles.calendarWeek}>
            {week.map((day, dayIdx) => {
              const intensity = getCalorieIntensity(day.calories);
              const calorieColor = getCalorieColor(day.calories);
              const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();
              
              return (
                <TouchableOpacity
                  key={dayIdx}
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.calendarDay,
                    { width: daySize, height: daySize },
                    !day.isCurrentMonth && styles.calendarDayInactive,
                    isSelected && { 
                      borderColor: colors.tint, 
                      borderWidth: responsive.isSmallPhone ? 1.5 : 2,
                      backgroundColor: `${colors.tint}20`,
                    },
                    day.calories > 0 && {
                      backgroundColor: `${calorieColor}${Math.round(intensity * 50 + 20).toString(16).padStart(2, '0')}`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      { color: day.isCurrentMonth ? colors.text : colors.textMuted, fontSize: responsive.calendarDayTextSize },
                      day.isToday && styles.todayText,
                      day.calories > 0 && { fontWeight: 'bold' },
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                  {day.meals.length > 0 && (
                    <View style={[styles.mealDot, responsive.isSmallPhone && { minWidth: 14, height: 14 }]}>
                      <Text style={[styles.mealCount, responsive.isSmallPhone && { fontSize: 8 }]}>{day.meals.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </GlassCard>
      </RNAnimated.View>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDay) return null;

    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    const hasData = selectedDay.calories > 0;

    return (
      <RNAnimated.View style={[styles.detailsSection, { opacity: detailsFadeAnim }]}>
        <GlassCard 
          style={styles.detailsCard} 
          contentStyle={{ padding: responsive.isSmallPhone ? 16 : 20 }}
        >
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsDate, { color: colors.text, fontSize: responsive.detailsDateSize }]}>
              {selectedDay.isToday ? 'Today' : selectedDay.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {!hasData ? (
            <View style={styles.noDataContainer}>
              <Apple size={48} color={colors.textMuted} />
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No meals logged
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.caloriesRow}>
                <View style={[styles.iconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: responsive.isSmallPhone ? 40 : 48, height: responsive.isSmallPhone ? 40 : 48, borderRadius: responsive.isSmallPhone ? 20 : 24 }]}>
                  <Flame size={responsive.isSmallPhone ? 20 : 24} color="#EF4444" />
                </View>
                <View style={styles.caloriesInfo}>
                  <Text style={[styles.caloriesValue, { color: colors.text, fontSize: responsive.caloriesValueSize }]}>
                    {Math.round(selectedDay.calories)}
                  </Text>
                  <Text style={[styles.caloriesLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>
                    {profile?.calorieTarget ? ` / ${profile.calorieTarget} kcal` : ' kcal'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: colors.glassBorder }]}>
                  <RNAnimated.View
                    style={[
                      styles.progressBar,
                      { 
                        width: progressWidth,
                        backgroundColor: getCalorieColor(selectedDay.calories),
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macrosGrid}>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroValue, { color: '#60A5FA', fontSize: responsive.macroValueSize }]}>
                    {Math.round(selectedDay.protein)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Protein</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroValue, { color: '#FBBF24', fontSize: responsive.macroValueSize }]}>
                    {Math.round(selectedDay.carbs)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Carbs</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroValue, { color: '#F87171', fontSize: responsive.macroValueSize }]}>
                    {Math.round(selectedDay.fats)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Fats</Text>
                </View>
              </View>

              {(selectedDay.goodFoodCount > 0 || selectedDay.badFoodCount > 0) && (
                <View style={styles.foodQualityRow}>
                  {selectedDay.goodFoodCount > 0 && (
                    <View style={styles.foodQualityItem}>
                      <View style={[styles.qualityBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <TrendingUp size={16} color="#22C55E" />
                        <Text style={[styles.qualityText, { color: '#22C55E' }]}>
                          {selectedDay.goodFoodCount} Good
                        </Text>
                      </View>
                    </View>
                  )}
                  {selectedDay.badFoodCount > 0 && (
                    <View style={styles.foodQualityItem}>
                      <View style={[styles.qualityBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <TrendingDown size={16} color="#EF4444" />
                        <Text style={[styles.qualityText, { color: '#EF4444' }]}>
                          {selectedDay.badFoodCount} Bad
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.mealsInfo}>
                <Text style={[styles.mealsText, { color: colors.textSecondary }]}>
                  {selectedDay.meals.length} meal{selectedDay.meals.length !== 1 ? 's' : ''} logged
                </Text>
              </View>
            </>
          )}
        </GlassCard>
      </RNAnimated.View>
    );
  };

  const renderMonthSummary = () => {
    // Safety check for width to prevent negative calculations
    if (width <= 0) return null;

    const cardWidth = responsive.isTablet 
      ? (width - (responsive.padding * 2) - (responsive.gap * (responsive.statsPerRow - 1))) / responsive.statsPerRow
      : (width - (responsive.padding * 2) - responsive.gap - 16) / 2;

    // Ensure cardWidth is positive
    const finalCardWidth = Math.max(0, cardWidth);
    
    const hasData = monthStats && monthStats.daysTracked > 0;
    const displayStats = hasData ? monthStats : {
      daysTracked: 0,
      avgDailyCalories: 0,
      totalMeals: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      goodFoodCount: 0,
      badFoodCount: 0,
      maxCaloriesDay: 0,
      minCaloriesDay: 0,
    };

    return (
      <RNAnimated.View style={[styles.summarySection, { opacity: summaryFadeAnim }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: responsive.isTablet ? 26 : responsive.isSmallPhone ? 20 : 22 }]}>Month Summary</Text>
        
        <View style={[styles.statsGrid, { gap: responsive.gap }]}>
          <GlassCard style={{ width: finalCardWidth }} contentStyle={[styles.statCardContent, { padding: responsive.statCardPadding }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)', width: responsive.statIconSize, height: responsive.statIconSize, borderRadius: responsive.statIconSize / 2 }]}>
              <CalendarIcon size={responsive.statIconSize * 0.5} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontSize: responsive.statValueSize }]}>{displayStats.daysTracked}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Days Tracked</Text>
          </GlassCard>

          <GlassCard style={{ width: finalCardWidth }} contentStyle={[styles.statCardContent, { padding: responsive.statCardPadding }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: responsive.statIconSize, height: responsive.statIconSize, borderRadius: responsive.statIconSize / 2 }]}>
              <Flame size={responsive.statIconSize * 0.5} color="#EF4444" />
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontSize: responsive.statValueSize }]}>{displayStats.avgDailyCalories}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Avg/Day</Text>
          </GlassCard>

          <GlassCard style={{ width: finalCardWidth }} contentStyle={[styles.statCardContent, { padding: responsive.statCardPadding }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)', width: responsive.statIconSize, height: responsive.statIconSize, borderRadius: responsive.statIconSize / 2 }]}>
              <Apple size={responsive.statIconSize * 0.5} color="#8B5CF6" />
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontSize: responsive.statValueSize }]}>{displayStats.totalMeals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Total Meals</Text>
          </GlassCard>

          <GlassCard style={{ width: finalCardWidth }} contentStyle={[styles.statCardContent, { padding: responsive.statCardPadding }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', width: responsive.statIconSize, height: responsive.statIconSize, borderRadius: responsive.statIconSize / 2 }]}>
              <Award size={responsive.statIconSize * 0.5} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontSize: responsive.statValueSize }]}>
              {Math.round((displayStats.totalCalories / 1000))}k
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Total Kcal</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.macrosSummaryCard} contentStyle={{ padding: responsive.isSmallPhone ? 16 : 20 }}>
          <View style={styles.macrosSummaryHeader}>
            <Text style={[styles.macrosSummaryTitle, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>Total Macros This Month</Text>
            <Text style={[styles.macrosSummarySubtitle, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 10 : 11 }]}>Monthly macro totals • Scale max: P:2000g C:3000g F:1000g</Text>
          </View>
          <View style={[styles.macrosSummaryRow, { height: responsive.isSmallPhone ? 120 : responsive.isTablet ? 180 : 150 }]}>
            <View style={styles.macroSummaryItem}>
              <View style={[styles.macroSummaryBar, { backgroundColor: '#60A5FA', height: `${Math.min((displayStats.totalProtein / 2000) * 100, 100)}%`, width: responsive.isSmallPhone ? 50 : responsive.isTablet ? 70 : 60 }]} />
              <Text style={[styles.macroSummaryValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>{displayStats.totalProtein}g</Text>
              <Text style={[styles.macroSummaryLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Protein</Text>
              <Text style={[styles.macroSummaryPercentage, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 9 : 10 }]}>{Math.round((displayStats.totalProtein / 2000) * 100)}%</Text>
            </View>
            <View style={styles.macroSummaryItem}>
              <View style={[styles.macroSummaryBar, { backgroundColor: '#FBBF24', height: `${Math.min((displayStats.totalCarbs / 3000) * 100, 100)}%`, width: responsive.isSmallPhone ? 50 : responsive.isTablet ? 70 : 60 }]} />
              <Text style={[styles.macroSummaryValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>{displayStats.totalCarbs}g</Text>
              <Text style={[styles.macroSummaryLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Carbs</Text>
              <Text style={[styles.macroSummaryPercentage, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 9 : 10 }]}>{Math.round((displayStats.totalCarbs / 3000) * 100)}%</Text>
            </View>
            <View style={styles.macroSummaryItem}>
              <View style={[styles.macroSummaryBar, { backgroundColor: '#F87171', height: `${Math.min((displayStats.totalFats / 1000) * 100, 100)}%`, width: responsive.isSmallPhone ? 50 : responsive.isTablet ? 70 : 60 }]} />
              <Text style={[styles.macroSummaryValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>{displayStats.totalFats}g</Text>
              <Text style={[styles.macroSummaryLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Fats</Text>
              <Text style={[styles.macroSummaryPercentage, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 9 : 10 }]}>{Math.round((displayStats.totalFats / 1000) * 100)}%</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.rangeCard} contentStyle={{ padding: responsive.isSmallPhone ? 16 : 20 }}>
          <Text style={[styles.rangeTitle, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>Calorie Range</Text>
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <TrendingUp size={responsive.isSmallPhone ? 18 : 20} color="#22C55E" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 18 : 20 }]}>{displayStats.maxCaloriesDay}</Text>
                <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Highest</Text>
              </View>
            </View>
            <View style={[styles.rangeDivider, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.rangeItem}>
              <TrendingDown size={responsive.isSmallPhone ? 18 : 20} color="#F59E0B" />
              <View style={styles.rangeInfo}>
                <Text style={[styles.rangeValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 18 : 20 }]}>{displayStats.minCaloriesDay}</Text>
                <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Lowest</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.foodQualityCard} contentStyle={{ padding: responsive.isSmallPhone ? 16 : 20 }}>
          <View style={styles.foodQualityHeader}>
            <Text style={[styles.foodQualityTitle, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>Food Quality</Text>
            <Text style={[styles.foodQualitySubtitle, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 10 : 11 }]}>Nutritional assessment of your meals</Text>
          </View>
          {displayStats.goodFoodCount === 0 && displayStats.badFoodCount === 0 ? (
            <View style={styles.noQualityDataContainer}>
              <Text style={[styles.noQualityDataText, { color: colors.textSecondary }]}>No food quality data yet</Text>
            </View>
          ) : (
            <>
              <View style={styles.foodQualityBars}>
                <View style={styles.foodQualityBarContainer}>
                  <View style={styles.foodQualityBarHeader}>
                    <TrendingUp size={responsive.isSmallPhone ? 14 : 16} color="#22C55E" />
                    <View style={styles.foodQualityBarHeaderText}>
                      <Text style={[styles.foodQualityBarLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 13 : 14 }]}>Good Points</Text>
                      <Text style={[styles.foodQualityBarDescription, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 10 : 11 }]}>Healthy ingredients & balanced portions</Text>
                    </View>
                  </View>
                  <View style={[styles.foodQualityBarBg, { backgroundColor: colors.glassBorder, height: responsive.isSmallPhone ? 20 : 24 }]}>
                    <View 
                      style={[
                        styles.foodQualityBarFill, 
                        { 
                          backgroundColor: '#22C55E',
                          width: `${Math.min((displayStats.goodFoodCount / (displayStats.goodFoodCount + displayStats.badFoodCount)) * 100, 100)}%`,
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.foodQualityBarFooter}>
                    <Text style={[styles.foodQualityBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>{displayStats.goodFoodCount} points</Text>
                    <Text style={[styles.foodQualityBarPercentage, { color: '#22C55E', fontSize: responsive.isSmallPhone ? 13 : 14 }]}>{Math.round((displayStats.goodFoodCount / (displayStats.goodFoodCount + displayStats.badFoodCount)) * 100)}%</Text>
                  </View>
                </View>
                <View style={styles.foodQualityBarContainer}>
                  <View style={styles.foodQualityBarHeader}>
                    <TrendingDown size={responsive.isSmallPhone ? 14 : 16} color="#EF4444" />
                    <View style={styles.foodQualityBarHeaderText}>
                      <Text style={[styles.foodQualityBarLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 13 : 14 }]}>Bad Points</Text>
                      <Text style={[styles.foodQualityBarDescription, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 10 : 11 }]}>Processed foods & excessive portions</Text>
                    </View>
                  </View>
                  <View style={[styles.foodQualityBarBg, { backgroundColor: colors.glassBorder, height: responsive.isSmallPhone ? 20 : 24 }]}>
                    <View 
                      style={[
                        styles.foodQualityBarFill, 
                        { 
                          backgroundColor: '#EF4444',
                          width: `${Math.min((displayStats.badFoodCount / (displayStats.goodFoodCount + displayStats.badFoodCount)) * 100, 100)}%`,
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.foodQualityBarFooter}>
                    <Text style={[styles.foodQualityBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>{displayStats.badFoodCount} points</Text>
                    <Text style={[styles.foodQualityBarPercentage, { color: '#EF4444', fontSize: responsive.isSmallPhone ? 13 : 14 }]}>{Math.round((displayStats.badFoodCount / (displayStats.goodFoodCount + displayStats.badFoodCount)) * 100)}%</Text>
                  </View>
                </View>
              </View>
              <View style={styles.foodQualityFooter}>
                <Text style={[styles.foodQualityFooterText, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>💡 Higher good points indicate better nutrition choices</Text>
              </View>
            </>
          )}
        </GlassCard>

        <GlassCard style={styles.compareCard} contentStyle={{ padding: responsive.isSmallPhone ? 16 : 20 }}>
          <View style={styles.compareHeader}>
            <BarChart3 size={responsive.isSmallPhone ? 18 : 20} color={colors.tint} />
            <View style={styles.compareHeaderText}>
              <Text style={[styles.compareTitle, { color: colors.text, fontSize: responsive.isSmallPhone ? 14 : 16 }]}>Compare</Text>
              <Text style={[styles.compareSubtitle, { color: colors.textMuted, fontSize: responsive.isSmallPhone ? 10 : 11 }]}>Compare nutrition data between months</Text>
            </View>
          </View>
          {renderCompareSection()}
        </GlassCard>
      </RNAnimated.View>
    );
  };

  const getMonthCompareData = async (year: number, month: number): Promise<CompareMonthData> => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    
    const meals = await getMealsByDateRange(firstDay.toISOString(), lastDay.toISOString());
    
    if (meals.length === 0) {
      return {
        month,
        year,
        totalCalories: 0,
        totalProtein: 0,
        totalFats: 0,
        totalFiber: 0,
        hasMeals: false,
      };
    }
    
    const totals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + meal.caloriesEstimate,
      totalProtein: acc.totalProtein + meal.proteinGrams,
      totalFats: acc.totalFats + meal.fatGrams,
      totalFiber: acc.totalFiber + meal.fiberGrams,
    }), { totalCalories: 0, totalProtein: 0, totalFats: 0, totalFiber: 0 });
    
    return {
      month,
      year,
      totalCalories: Math.round(totals.totalCalories),
      totalProtein: Math.round(totals.totalProtein),
      totalFats: Math.round(totals.totalFats),
      totalFiber: Math.round(totals.totalFiber),
      hasMeals: true,
    };
  };

  const loadCompareData = useCallback(async () => {
    try {
      const data1 = await getMonthCompareData(compareYear1, compareMonth1);
      const data2 = await getMonthCompareData(compareYear2, compareMonth2);
      setCompareData({ month1: data1, month2: data2 });
      
      compareBar1Anim.setValue(0);
      compareBar2Anim.setValue(0);
      
      RNAnimated.parallel([
        RNAnimated.spring(compareBar1Anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 40,
          friction: 7,
        }),
        RNAnimated.spring(compareBar2Anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 40,
          friction: 7,
        }),
      ]).start();
    } catch (e) {
      console.error('Error loading compare data:', e);
    }
  }, [compareYear1, compareMonth1, compareYear2, compareMonth2, compareBar1Anim, compareBar2Anim]);

  useEffect(() => {
    loadCompareData();
  }, [loadCompareData]);

  const renderCompareSection = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    
    const data1 = compareData.month1;
    const data2 = compareData.month2;
    
    const maxCalories = data1 && data2 ? Math.max(data1.totalCalories, data2.totalCalories, 1) : 1;
    const maxProtein = data1 && data2 ? Math.max(data1.totalProtein, data2.totalProtein, 1) : 1;
    const maxFats = data1 && data2 ? Math.max(data1.totalFats, data2.totalFats, 1) : 1;
    const maxFiber = data1 && data2 ? Math.max(data1.totalFiber, data2.totalFiber, 1) : 1;
    
    return (
      <View style={styles.compareContent}>
        <View style={styles.comparePickersRow}>
          <View style={styles.compareColumn}>
            <Text style={[styles.compareColumnLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Period 1</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity 
                style={[styles.pickerButton, { backgroundColor: colors.glassBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowMonth1Picker(!showMonth1Picker);
                  setShowYear1Picker(false);
                  setShowMonth2Picker(false);
                  setShowYear2Picker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{months[compareMonth1]}</Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pickerButton, { backgroundColor: colors.glassBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowYear1Picker(!showYear1Picker);
                  setShowMonth1Picker(false);
                  setShowMonth2Picker(false);
                  setShowYear2Picker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{compareYear1}</Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {showMonth1Picker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.glassBackgroundStrong }]}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {months.map((m, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={styles.pickerOption}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCompareMonth1(idx);
                        setShowMonth1Picker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: compareMonth1 === idx ? colors.tint : colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {showYear1Picker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.glassBackgroundStrong }]}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {years.map((y) => (
                    <TouchableOpacity 
                      key={y}
                      style={styles.pickerOption}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCompareYear1(y);
                        setShowYear1Picker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: compareYear1 === y ? colors.tint : colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.compareColumn}>
            <Text style={[styles.compareColumnLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>Period 2</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity 
                style={[styles.pickerButton, { backgroundColor: colors.glassBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowMonth2Picker(!showMonth2Picker);
                  setShowMonth1Picker(false);
                  setShowYear1Picker(false);
                  setShowYear2Picker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{months[compareMonth2]}</Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pickerButton, { backgroundColor: colors.glassBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowYear2Picker(!showYear2Picker);
                  setShowMonth1Picker(false);
                  setShowYear1Picker(false);
                  setShowMonth2Picker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{compareYear2}</Text>
                <ChevronDown size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {showMonth2Picker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.glassBackgroundStrong }]}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {months.map((m, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={styles.pickerOption}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCompareMonth2(idx);
                        setShowMonth2Picker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: compareMonth2 === idx ? colors.tint : colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {showYear2Picker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.glassBackgroundStrong }]}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {years.map((y) => (
                    <TouchableOpacity 
                      key={y}
                      style={styles.pickerOption}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCompareYear2(y);
                        setShowYear2Picker(false);
                      }}
                    >
                      <Text style={[styles.pickerOptionText, { color: compareYear2 === y ? colors.tint : colors.text, fontSize: responsive.isSmallPhone ? 12 : 14 }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {(!data1?.hasMeals && !data2?.hasMeals) ? (
          <View style={styles.noCompareDataContainer}>
            <Text style={[styles.noCompareDataText, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 13 : 14 }]}>No available Data</Text>
          </View>
        ) : (
          <View style={styles.compareCharts}>
            <View style={styles.compareMetric}>
              <Text style={[styles.compareMetricLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 12 : 13 }]}>Calories (kcal)</Text>
              <View style={styles.compareBarsRow}>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#EF4444',
                          width: compareBar1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data1 ? (data1.totalCalories / maxCalories) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data1?.hasMeals ? data1.totalCalories : 0}</Text>
                </View>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#F97316',
                          width: compareBar2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data2 ? (data2.totalCalories / maxCalories) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data2?.hasMeals ? data2.totalCalories : 0}</Text>
                </View>
              </View>
            </View>

            <View style={styles.compareMetric}>
              <Text style={[styles.compareMetricLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 12 : 13 }]}>Protein (g)</Text>
              <View style={styles.compareBarsRow}>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#60A5FA',
                          width: compareBar1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data1 ? (data1.totalProtein / maxProtein) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data1?.hasMeals ? data1.totalProtein : 0}</Text>
                </View>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#3B82F6',
                          width: compareBar2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data2 ? (data2.totalProtein / maxProtein) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data2?.hasMeals ? data2.totalProtein : 0}</Text>
                </View>
              </View>
            </View>

            <View style={styles.compareMetric}>
              <Text style={[styles.compareMetricLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 12 : 13 }]}>Fats (g)</Text>
              <View style={styles.compareBarsRow}>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#F87171',
                          width: compareBar1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data1 ? (data1.totalFats / maxFats) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data1?.hasMeals ? data1.totalFats : 0}</Text>
                </View>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#EF4444',
                          width: compareBar2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data2 ? (data2.totalFats / maxFats) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data2?.hasMeals ? data2.totalFats : 0}</Text>
                </View>
              </View>
            </View>

            <View style={styles.compareMetric}>
              <Text style={[styles.compareMetricLabel, { color: colors.textSecondary, fontSize: responsive.isSmallPhone ? 12 : 13 }]}>Fiber (g)</Text>
              <View style={styles.compareBarsRow}>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#34D399',
                          width: compareBar1Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data1 ? (data1.totalFiber / maxFiber) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data1?.hasMeals ? data1.totalFiber : 0}</Text>
                </View>
                <View style={styles.compareBarContainer}>
                  <View style={[styles.compareBarBg, { backgroundColor: colors.glassBorder }]}>
                    <RNAnimated.View 
                      style={[
                        styles.compareBarFill,
                        {
                          backgroundColor: '#10B981',
                          width: compareBar2Anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${data2 ? (data2.totalFiber / maxFiber) * 100 : 0}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.compareBarValue, { color: colors.text, fontSize: responsive.isSmallPhone ? 11 : 12 }]}>{data2?.hasMeals ? data2.totalFiber : 0}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const hasValidDimensions = width > 0 && height > 0;

  return (
    <ScreenWrapper>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { padding: responsive.padding, paddingBottom: responsive.paddingBottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <RNAnimated.Text style={[styles.title, { color: colors.text, opacity: titleFadeAnim, fontSize: responsive.titleSize }]}>Stats</RNAnimated.Text>
        
        {hasValidDimensions && renderCalendar()}
        {hasValidDimensions && renderDayDetails()}
        {hasValidDimensions && renderMonthSummary()}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  calendarCard: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDay: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontWeight: '500',
  },
  todayText: {
    fontWeight: 'bold',
  },
  mealDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mealCount: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsCard: {
    // padding handled by contentStyle
  },
  detailsHeader: {
    marginBottom: 16,
  },
  detailsDate: {
    fontSize: 20,
    fontWeight: '700',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  caloriesInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
  },
  foodQualityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  foodQualityItem: {
    flex: 1,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealsInfo: {
    alignItems: 'center',
  },
  mealsText: {
    fontSize: 14,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    // Width handled dynamically
  },
  statCardContent: {
    alignItems: 'center',
  },
  statIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  macrosSummaryCard: {
    marginBottom: 16,
  },
  macrosSummaryHeader: {
    marginBottom: 20,
  },
  macrosSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  macrosSummarySubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  macrosSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  macroSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroSummaryBar: {
    borderRadius: 8,
    marginBottom: 12,
  },
  macroSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroSummaryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  macroSummaryPercentage: {
    fontSize: 10,
  },
  rangeCard: {
    marginBottom: 16,
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInfo: {
    flex: 1,
  },
  rangeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rangeLabel: {
    fontSize: 12,
  },
  rangeDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  foodQualityCard: {
    // padding handled by contentStyle
  },
  foodQualityHeader: {
    marginBottom: 16,
  },
  foodQualityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodQualitySubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  foodQualityBars: {
    gap: 16,
  },
  foodQualityBarContainer: {
    gap: 8,
  },
  foodQualityBarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  foodQualityBarHeaderText: {
    flex: 1,
  },
  foodQualityBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodQualityBarDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  foodQualityBarBg: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodQualityBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  foodQualityBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodQualityBarValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodQualityBarPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodQualityFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptySummaryContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noQualityDataContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noQualityDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  foodQualityFooterText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  compareCard: {
    marginTop: 16,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  compareHeaderText: {
    flex: 1,
  },
  compareTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  compareSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  compareContent: {
    gap: 20,
  },
  comparePickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compareColumn: {
    flex: 1,
  },
  compareColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerDropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compareCharts: {
    gap: 16,
  },
  compareMetric: {
    gap: 8,
  },
  compareMetricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  compareBarsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compareBarContainer: {
    flex: 1,
    gap: 6,
  },
  compareBarBg: {
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
  },
  compareBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  compareBarValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  noCompareDataContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noCompareDataText: {
    fontSize: 14,
  },
});
