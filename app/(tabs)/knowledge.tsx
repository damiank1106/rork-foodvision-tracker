import React from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItem, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { FOOD_TOPICS, VITAMINS, KnowledgeItem, VitaminItem } from '@/constants/knowledgeData';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Calendar, ChevronLeft, ChevronRight, Flame, Apple } from 'lucide-react-native';
import { useNotes, Note } from '@/context/NotesContext';
import { getMealsByDateRange, SavedMeal } from '@/services/mealsDb';
import * as Haptics from 'expo-haptics';


interface SectionHeader {
  type: 'header';
  title: string;
}

type ListItem = 
  | { type: 'food'; data: KnowledgeItem }
  | { type: 'vitamin'; data: VitaminItem }
  | { type: 'note'; data: Note }
  | { type: 'addNote' }
  | SectionHeader;

export default function KnowledgeScreen() {
  const { colors } = useTheme();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [animationKey, setAnimationKey] = React.useState(0);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [showNewNote, setShowNewNote] = React.useState(false);
  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteContent, setNoteContent] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);
  const [showMealsCalendar, setShowMealsCalendar] = React.useState(false);
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const [monthMeals, setMonthMeals] = React.useState<SavedMeal[]>([]);
  const [selectedDayMeals, setSelectedDayMeals] = React.useState<SavedMeal[] | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  const loadMonthMeals = React.useCallback(async () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const meals = await getMealsByDateRange(firstDay.toISOString(), lastDay.toISOString());
    setMonthMeals(meals);
    setSelectedDayMeals(null);
    setSelectedDate(null);
  }, [calendarDate]);

  React.useEffect(() => {
    if (showMealsCalendar) {
      loadMonthMeals();
    }
  }, [calendarDate, showMealsCalendar, loadMonthMeals]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    Haptics.selectionAsync();
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setMonth(calendarDate.getMonth() - 1);
    } else {
      newDate.setMonth(calendarDate.getMonth() + 1);
    }
    setCalendarDate(newDate);
  };

  const handleDayPress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMeals = monthMeals.filter(meal => {
      const mealDate = new Date(meal.createdAt);
      return mealDate >= dayStart && mealDate <= dayEnd;
    });

    setSelectedDayMeals(dayMeals);
  };

  const getMealsByDay = () => {
    const dayMap = new Map<string, SavedMeal[]>();
    monthMeals.forEach(meal => {
      const mealDate = new Date(meal.createdAt);
      const key = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, []);
      }
      dayMap.get(key)!.push(meal);
    });
    return dayMap;
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOfCalendar = new Date(firstDay);
    startOfCalendar.setDate(firstDay.getDate() - firstDay.getDay());

    const endOfCalendar = new Date(lastDay);
    endOfCalendar.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDate = new Date(startOfCalendar);

    while (currentDate <= endOfCalendar) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };
  
  const data: ListItem[] = [
    { type: 'header', title: 'How Foods Affect Your Body' },
    ...FOOD_TOPICS.map(item => ({ type: 'food' as const, data: item })),
    { type: 'header', title: 'Complete Vitamin Guide' },
    ...VITAMINS.map(item => ({ type: 'vitamin' as const, data: item })),
    { type: 'header', title: 'My Notes' },
    { type: 'addNote' },
    ...notes.map(item => ({ type: 'note' as const, data: item })),
  ];

  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (editingNoteId) {
      updateNote(editingNoteId, noteTitle, noteContent);
      setEditingNoteId(null);
    } else {
      addNote(noteTitle, noteContent);
      setShowNewNote(false);
    }
    
    setNoteTitle('');
    setNoteContent('');
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowNewNote(false);
    
    setTimeout(() => {
      const noteIndex = data.findIndex(item => 
        item.type === 'note' && item.data.id === note.id
      );
      if (noteIndex !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: noteIndex,
          animated: true,
          viewPosition: 0.1,
        });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setShowNewNote(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteNote(noteId);
            if (editingNoteId === noteId) {
              handleCancelEdit();
            }
          }
        },
      ]
    );
  };

  const renderFoodItem = (item: KnowledgeItem, index: number) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.goodTitle, { color: colors.success }]}>Good Effects:</Text>
          {item.goodEffects.map((effect, i) => (
            <Text key={`good-${i}`} style={[styles.bullet, { color: colors.textSecondary }]}>• {effect}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.badTitle, { color: colors.error }]}>Bad Effects:</Text>
          {item.badEffects.map((effect, i) => (
            <Text key={`bad-${i}`} style={[styles.bullet, { color: colors.textSecondary }]}>• {effect}</Text>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderVitaminItem = (item: VitaminItem, index: number) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <GlassCard style={styles.card}>
        <Text style={[styles.vitaminTitle, { color: colors.accent }]}>{item.name}</Text>
        <Text style={[styles.vitaminFunction, { color: colors.text }]}>{item.function}</Text>
        
        <View style={styles.section}>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Deficiency:</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{item.deficiency}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Food Sources:</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{item.sources.join(', ')}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderAddNoteButton = () => (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <View style={styles.notesActionsRow}>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary, flex: 1 }]}
          onPress={() => {
            setShowNewNote(true);
            setEditingNoteId(null);
            setNoteTitle('');
            setNoteContent('');
            
            setTimeout(() => {
              const notesHeaderIndex = data.findIndex(item => 
                item.type === 'header' && item.title === 'My Notes'
              );
              if (notesHeaderIndex !== -1 && flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index: notesHeaderIndex,
                  animated: true,
                  viewPosition: 0.1,
                });
              }
            }, 100);
          }}
        >
          <Plus color={colors.primary} size={24} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.calendarIconButton, { borderColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowMealsCalendar(!showMealsCalendar);
            if (!showMealsCalendar) {
              setCalendarDate(new Date());
            }
          }}
        >
          <Calendar color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>
      {showMealsCalendar && renderMealsCalendar()}
    </Animated.View>
  );

  const renderNoteEditor = (isNew: boolean, note?: Note) => {
    const isEditing = editingNoteId === note?.id || (isNew && showNewNote);
    
    if (!isEditing) return null;

    return (
      <Animated.View entering={FadeInDown.springify()}>
        <GlassCard style={styles.noteEditorCard}>
          <View style={styles.noteEditorHeader}>
            <Text style={[styles.noteEditorTitle, { color: colors.text }]}>
              {isNew ? 'New Note' : 'Edit Note'}
            </Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.noteTitleInput, { 
              color: colors.text, 
              borderColor: colors.glassBorder,
              backgroundColor: colors.glassBackground,
            }]}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            value={noteTitle}
            onChangeText={setNoteTitle}
          />
          
          <TextInput
            style={[styles.noteContentInput, { 
              color: colors.text,
              borderColor: colors.glassBorder,
              backgroundColor: colors.glassBackground,
            }]}
            placeholder="Notes"
            placeholderTextColor={colors.textSecondary}
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveNote}
          >
            <Save color="#fff" size={20} />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  };

  const renderMealsCalendar = () => {
    const calendarDays = getCalendarDays();
    const mealsByDay = getMealsByDay();
    const currentMonth = calendarDate.getMonth();
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    const displayMeals = selectedDayMeals !== null ? selectedDayMeals : monthMeals;

    return (
      <View>
        <GlassCard style={styles.mealsCalendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.monthTitle}>
              <Calendar size={18} color={colors.tint} style={{ marginRight: 8 }} />
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

          {weeks.map((week, weekIdx) => (
            <View key={weekIdx} style={styles.calendarWeek}>
              {week.map((day, dayIdx) => {
                const isCurrentMonth = day.getMonth() === currentMonth;
                const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dayMeals = mealsByDay.get(dateKey) || [];
                const isSelected = selectedDate?.toDateString() === day.toDateString();
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <TouchableOpacity
                    key={dayIdx}
                    onPress={() => isCurrentMonth && handleDayPress(day)}
                    style={[
                      styles.calendarDay,
                      !isCurrentMonth && styles.calendarDayInactive,
                      isSelected && { 
                        borderColor: colors.tint, 
                        borderWidth: 2,
                        backgroundColor: `${colors.tint}20`,
                      },
                      dayMeals.length > 0 && isCurrentMonth && {
                        backgroundColor: `${colors.primary}30`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: isCurrentMonth ? colors.text : colors.textMuted },
                        isToday && { fontWeight: 'bold', color: colors.tint },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {dayMeals.length > 0 && isCurrentMonth && (
                      <View style={styles.mealDot}>
                        <Text style={styles.mealCount}>{dayMeals.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </GlassCard>

        {displayMeals.length > 0 && (
          <GlassCard style={styles.mealsListCard}>
            <View style={styles.mealsListHeader}>
              <Text style={[styles.mealsListTitle, { color: colors.text }]}>
                {selectedDate 
                  ? `Meals on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : `All meals in ${calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                }
              </Text>
              <Text style={[styles.mealsListCount, { color: colors.textSecondary }]}>
                {displayMeals.length} meal{displayMeals.length !== 1 ? 's' : ''}
              </Text>
              {selectedDate && (
                <TouchableOpacity
                  style={[styles.clearFilterButton, { backgroundColor: colors.glassBorder }]}
                  onPress={() => {
                    setSelectedDate(null);
                    setSelectedDayMeals(null);
                  }}
                >
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>View All Month</Text>
                </TouchableOpacity>
              )}
            </View>
            {displayMeals.map((meal, index) => (
              <View key={meal.id} style={[styles.mealListItem, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.mealIconContainer}>
                  <Apple size={24} color={colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                  <Text style={[styles.mealDate, { color: colors.textSecondary }]}>
                    {new Date(meal.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.mealCalories}>
                  <Flame size={16} color="#EF4444" />
                  <Text style={[styles.mealCaloriesText, { color: colors.text }]}>
                    {Math.round(meal.caloriesEstimate)}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {displayMeals.length === 0 && (
          <GlassCard style={styles.mealsListCard}>
            <View style={styles.noMealsContainer}>
              <Apple size={48} color={colors.textMuted} />
              <Text style={[styles.noMealsText, { color: colors.textSecondary }]}>
                {selectedDate ? 'No meals logged on this day' : 'No meals logged this month'}
              </Text>
            </View>
          </GlassCard>
        )}
      </View>
    );
  };

  const renderNoteItem = (note: Note, index: number) => {
    if (editingNoteId === note.id) {
      return renderNoteEditor(false, note);
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <GlassCard style={styles.card}>
          <View style={styles.noteHeader}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => handleEditNote(note)}
              >
                <Edit2 color={colors.primary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => handleDeleteNote(note.id)}
              >
                <Trash2 color={colors.error} size={20} />
              </TouchableOpacity>
            </View>
          </View>
          
          {note.content ? (
            <Text style={[styles.noteContent, { color: colors.textSecondary }]}>
              {note.content}
            </Text>
          ) : null}
        </GlassCard>
      </Animated.View>
    );
  };

  const renderItem: ListRenderItem<ListItem> = ({ item, index }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.headerContainer, { borderBottomColor: colors.glassBorder }]}>
          <Text style={[styles.headerText, { color: colors.primary }]}>{item.title}</Text>
        </View>
      );
    }
    
    if (item.type === 'food') {
      return renderFoodItem(item.data, index % 20);
    }
    
    if (item.type === 'vitamin') {
      return renderVitaminItem(item.data, index % 20);
    }

    if (item.type === 'addNote') {
      return (
        <>
          {renderAddNoteButton()}
          {showNewNote && renderNoteEditor(true)}
        </>
      );
    }

    if (item.type === 'note') {
      return renderNoteItem(item.data, index % 20);
    }
    
    return null;
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Animated.View 
          key={`header-${animationKey}`}
          entering={FadeInDown.duration(500).springify()}
          style={styles.topHeader}
        >
           <BookOpen color={colors.primary} size={28} />
           <Text style={[styles.screenTitle, { color: colors.text }]}>Knowledge Center</Text>
        </Animated.View>
        <FlatList
          ref={flatListRef}
          key={`knowledge-list-${animationKey}`}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            if (item.type === 'header') return `header-${index}`;
            if (item.type === 'food') return `food-${item.data.id}`;
            if (item.type === 'vitamin') return `vit-${item.data.id}`;
            if (item.type === 'note') return `note-${item.data.id}`;
            if (item.type === 'addNote') return 'addNote';
            return `item-${index}`;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 100));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.1 });
            });
          }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 400,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 28,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  vitaminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vitaminFunction: {
    fontSize: 16,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 8,
  },
  goodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bullet: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noteEditorCard: {
    marginBottom: 16,
    padding: 16,
  },
  noteEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteEditorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteTitleInput: {
    fontSize: 17,
    fontWeight: '600',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteContentInput: {
    fontSize: 15,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteActionButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  notesActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  calendarIconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  mealsCalendarCard: {
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    width: 40,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
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
  mealsListCard: {
    marginBottom: 16,
    padding: 16,
  },
  mealsListHeader: {
    marginBottom: 16,
  },
  mealsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealsListCount: {
    fontSize: 13,
    marginBottom: 8,
  },
  clearFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealDate: {
    fontSize: 13,
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealCaloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noMealsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMealsText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
});
