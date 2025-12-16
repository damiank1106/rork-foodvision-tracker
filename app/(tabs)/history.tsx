import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Alert, Dimensions, Platform, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { CalendarDays, Clock, Trash2, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAllMeals, SavedMeal, deleteMeal, getMealsByDateRange } from '@/services/mealsDb';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MOCK_MEAL: SavedMeal = {
  id: 'mock-history-1',
  imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
  photoUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
  createdAt: new Date().toISOString(),
  dateTime: new Date().toISOString(),
  name: 'Grilled Salmon Salad',
  dishName: 'Grilled Salmon Salad',
  ingredientsDescription: 'Fresh atlantic salmon, mixed greens, cherry tomatoes, cucumber, avocado',
  notes: 'Heart-healthy omega 3s and plenty of greens.',
  nutritionSummary: 'High in protein and healthy omega-3 fatty acids. Low carbohydrate content.',
  caloriesEstimate: 450,
  proteinGrams: 35,
  carbsGrams: 12,
  fatGrams: 28,
  fiberGrams: 6,
  goodPoints: ['Rich in Omega-3', 'High Protein'],
  badPoints: [],
  source: 'scanned',
};

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filteredMeals, setFilteredMeals] = useState<SavedMeal[]>([]);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isIPhone15ProMax = Platform.OS === 'ios' && screenWidth === 430 && screenHeight === 932;

  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1);
      loadMeals();
    }, [])
  );

  const loadMeals = async () => {
    try {
      setLoading(true);
      const data = await getAllMeals();
      if (data.length === 0) {
        setMeals([MOCK_MEAL]);
      } else {
        setMeals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(mealId);
              await loadMeals();
            } catch (e) {
              console.error('Failed to delete meal', e);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: SavedMeal; index: number }) => {
    const isMockMeal = item.id === 'mock-history-1';
    const thumbnail = item.photoUri || item.imageUri;
    const mealName = item.name || item.dishName;
    const mealDate = item.dateTime || item.createdAt;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <GlassCard style={styles.mealCard}>
          <TouchableOpacity
            onPress={() => {
              router.push(`/meal/${item.id}`);
            }}
            activeOpacity={0.8}
            style={styles.mealTouchable}
          >
            <Image source={{ uri: thumbnail }} style={[styles.thumbnail, { backgroundColor: colors.glassBackgroundStrong }]} />
            <View style={styles.mealInfo}>
              <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>{mealName}</Text>
              <View style={styles.metaRow}>
                <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(mealDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.calsText, { color: colors.tint }]}>{Math.round(item.caloriesEstimate)} kcal</Text>
            </View>
          </TouchableOpacity>
          {!isMockMeal && (
            <TouchableOpacity
              onPress={() => handleDeleteMeal(item.id, item.dishName)}
              style={[
                styles.deleteIconButton,
                isIPhone15ProMax ? styles.deleteIconButtonIPhone15ProMax : styles.deleteIconButtonDefault,
                { backgroundColor: colors.glassBackgroundStrong }
              ]}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </GlassCard>
      </Animated.View>
    );
  };

  const handleStartAddMeal = () => {
    router.push('/history/add');
  };

  const handleToggleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCalendar(!showCalendar);
    if (!showCalendar) {
      loadCalendarMeals(calendarDate, null);
    }
  };

  const loadCalendarMeals = async (date: Date, day: Date | null) => {
    try {
      if (day) {
        const startOfDay = new Date(day);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 999);
        const dayMeals = await getMealsByDateRange(startOfDay.toISOString(), endOfDay.toISOString());
        setFilteredMeals(dayMeals);
      } else {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        const monthMeals = await getMealsByDateRange(firstDay.toISOString(), lastDay.toISOString());
        setFilteredMeals(monthMeals);
      }
    } catch (e) {
      console.error('Error loading calendar meals:', e);
      setFilteredMeals([]);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.selectionAsync();
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setMonth(calendarDate.getMonth() - 1);
    } else {
      newDate.setMonth(calendarDate.getMonth() + 1);
    }
    setCalendarDate(newDate);
    setSelectedDay(null);
    loadCalendarMeals(newDate, null);
  };

  const handleDayPress = (day: Date, hasMeals: boolean) => {
    if (hasMeals) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedDay(day);
      loadCalendarMeals(calendarDate, day);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startOfCalendar = new Date(firstDay);
    startOfCalendar.setDate(firstDay.getDate() - firstDay.getDay());
    
    const endOfCalendar = new Date(lastDay);
    endOfCalendar.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: Date[] = [];
    const currentDate = new Date(startOfCalendar);
    
    while (currentDate <= endOfCalendar) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getMealCountForDay = (day: Date): number => {
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return meals.filter(meal => {
      const mealDate = new Date(meal.createdAt);
      const mealKey = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`;
      return mealKey === dayKey;
    }).length;
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.Text
            key={`title-${animationKey}`}
            entering={FadeInDown.duration(500).springify()}
            style={[styles.title, { color: colors.text }]}
          >
            History
          </Animated.Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleToggleCalendar}
              style={[styles.headerIconButton, { backgroundColor: colors.glassBackgroundStrong }]}
              hitSlop={10}
            >
              <CalendarIcon color={colors.text} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStartAddMeal}
              style={[styles.headerIconButton, { backgroundColor: colors.glassBackgroundStrong }]}
              hitSlop={10}
            >
              <Plus color={colors.text} size={22} />
            </TouchableOpacity>
          </View>
        </View>
        
        {showCalendar ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            <GlassCard style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                  <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                
                <View style={styles.monthTitle}>
                  <CalendarIcon size={20} color={colors.tint} style={{ marginRight: 8 }} />
                  <Text style={[styles.monthText, { color: colors.text }]}>
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                
                <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                  <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <Text key={idx} style={[styles.weekDayText, { color: colors.textSecondary }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {(() => {
                const days = getDaysInMonth(calendarDate);
                const weeks: Date[][] = [];
                for (let i = 0; i < days.length; i += 7) {
                  weeks.push(days.slice(i, i + 7));
                }
                
                return weeks.map((week, weekIdx) => (
                  <View key={weekIdx} style={styles.calendarWeek}>
                    {week.map((day, dayIdx) => {
                      const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                      const mealCount = getMealCountForDay(day);
                      const hasMeals = mealCount > 0;
                      const isSelected = selectedDay?.toDateString() === day.toDateString();
                      const today = new Date();
                      const isToday = day.toDateString() === today.toDateString();
                      
                      return (
                        <TouchableOpacity
                          key={dayIdx}
                          onPress={() => handleDayPress(day, hasMeals)}
                          disabled={!hasMeals}
                          style={[
                            styles.calendarDay,
                            !isCurrentMonth && styles.calendarDayInactive,
                            isSelected && { 
                              borderColor: colors.tint, 
                              borderWidth: 2,
                              backgroundColor: `${colors.tint}20`,
                            },
                            hasMeals && {
                              backgroundColor: `${colors.tint}30`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              { color: isCurrentMonth ? colors.text : colors.textMuted },
                              isToday && styles.todayText,
                              hasMeals && { fontWeight: 'bold' },
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                          {hasMeals && (
                            <View style={styles.mealDot}>
                              <Text style={styles.mealCount}>{mealCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ));
              })()}
            </GlassCard>

            <View style={styles.filteredMealsSection}>
              <Text style={[styles.filteredMealsTitle, { color: colors.text }]}>
                {selectedDay 
                  ? `Meals on ${selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : `Meals in ${calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                }
              </Text>
              {filteredMeals.length === 0 ? (
                <View style={styles.emptyFiltered}>
                  <Text style={[styles.emptyFilteredText, { color: colors.textSecondary }]}>No meals found</Text>
                </View>
              ) : (
                filteredMeals.map((item, index) => {
                  const thumbnail = item.photoUri || item.imageUri;
                  const mealName = item.name || item.dishName;
                  const mealDate = item.dateTime || item.createdAt;

                  return (
                    <GlassCard key={item.id} style={styles.mealCard}>
                      <TouchableOpacity
                        onPress={() => {
                          router.push(`/meal/${item.id}`);
                        }}
                        activeOpacity={0.8}
                        style={styles.mealTouchable}
                      >
                        <Image source={{ uri: thumbnail }} style={[styles.thumbnail, { backgroundColor: colors.glassBackgroundStrong }]} />
                        <View style={styles.mealInfo}>
                          <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>{mealName}</Text>
                          <View style={styles.metaRow}>
                            <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                              {new Date(mealDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <Text style={[styles.calsText, { color: colors.tint }]}>{Math.round(item.caloriesEstimate)} kcal</Text>
                        </View>
                      </TouchableOpacity>
                    </GlassCard>
                  );
                })
              )}
            </View>
          </ScrollView>
        ) : (
          meals.length === 0 && !loading ? (
            <View key={`empty-${animationKey}`} style={styles.emptyState}>
              <CalendarDays size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No meals saved yet.</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Scan your first meal to see it here.</Text>
            </View>
          ) : (
            <FlatList
              key={`list-${animationKey}`}
              data={meals}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  deleteIconButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButtonIPhone15ProMax: {
    top: 6,
    right: 6,
  },
  deleteIconButtonDefault: {
    top: 8,
    right: 8,
  },
  listContent: {
    paddingBottom: 100, // Space for tab bar
  },
  mealCard: {
    marginBottom: 12,
    padding: 12,
    position: 'relative',
  },
  mealTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
  },
  calsText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  calendarCard: {
    marginBottom: 20,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  mealDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  mealCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filteredMealsSection: {
    marginTop: 8,
  },
  filteredMealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyFiltered: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFilteredText: {
    fontSize: 16,
  },
});
