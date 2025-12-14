import React from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItem } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { FOOD_TOPICS, VITAMINS, KnowledgeItem, VitaminItem } from '@/constants/knowledgeData';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookOpen } from 'lucide-react-native';


interface SectionHeader {
  type: 'header';
  title: string;
}

type ListItem = 
  | { type: 'food'; data: KnowledgeItem }
  | { type: 'vitamin'; data: VitaminItem }
  | SectionHeader;

export default function KnowledgeScreen() {
  const { colors } = useTheme();
  const [animationKey, setAnimationKey] = React.useState(0);

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
  ];

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

  const renderItem: ListRenderItem<ListItem> = ({ item, index }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.headerContainer, { borderBottomColor: colors.glassBorder }]}>
          <Text style={[styles.headerText, { color: colors.primary }]}>{item.title}</Text>
        </View>
      );
    }
    
    if (item.type === 'food') {
      return renderFoodItem(item.data, index % 20); // Reset delay for batches mostly
    }
    
    if (item.type === 'vitamin') {
      return renderVitaminItem(item.data, index % 20);
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
});
