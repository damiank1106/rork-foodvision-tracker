import React from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItem, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { FOOD_TOPICS, VITAMINS, KnowledgeItem, VitaminItem } from '@/constants/knowledgeData';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookOpen, Plus, Edit2, Trash2, Save, X } from 'lucide-react-native';
import { useNotes, Note } from '@/context/NotesContext';


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

  useFocusEffect(
    React.useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );
  
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
      <TouchableOpacity
        style={[styles.addButton, { borderColor: colors.primary }]}
        onPress={() => {
          setShowNewNote(true);
          setEditingNoteId(null);
          setNoteTitle('');
          setNoteContent('');
        }}
      >
        <Plus color={colors.primary} size={24} />
        <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Note</Text>
      </TouchableOpacity>
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
          key={`knowledge-list-${animationKey}`}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            if (item.type === 'header') return `header-${index}`;
            if (item.type === 'food') return `food-${item.data.id}`;
            if (item.type === 'vitamin') return `vit-${item.data.id}`;
            return `item-${index}`;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingBottom: 100, // Space for tab bar
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
});
