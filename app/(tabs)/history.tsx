import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Alert, Dimensions, Platform } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { CalendarDays, ChevronRight, Clock, Trash2, Plus } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAllMeals, SavedMeal, deleteMeal } from '@/services/mealsDb';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
            <ChevronRight color={colors.textSecondary} size={20} />
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
              onPress={handleStartAddMeal}
              style={[styles.headerIconButton, { backgroundColor: colors.glassBackgroundStrong }]}
              hitSlop={10}
            >
              <Plus color={colors.text} size={22} />
            </TouchableOpacity>
          </View>
        </View>
        
        {meals.length === 0 && !loading ? (
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
});
