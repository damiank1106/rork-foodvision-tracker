import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useTheme } from '@/context/ThemeContext';
import { Key, ShieldCheck, Moon, Sun } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { useProfile } from '@/context/ProfileContext';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

const cmToFtIn = (cm: number | null) => {
  if (!cm) return { ft: '', in: '' };
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  // Handle case where rounding up inches results in 12 (e.g. 5'11.9 -> 5'12 -> 6'0)
  if (inches === 12) {
    return { ft: (ft + 1).toString(), in: '0' };
  }
  return { ft: ft.toString(), in: inches.toString() };
};

const ftInToCm = (ftStr: string, inStr: string) => {
  const ft = parseInt(ftStr) || 0;
  const inches = parseInt(inStr) || 0;
  if (ft === 0 && inches === 0) return null;
  return Math.round((ft * 12 + inches) * 2.54);
};

export default function ProfileScreen() {
  const { 
    apiKey, 
    deepSeekApiKey, 
    saveApiKey, 
    saveDeepSeekApiKey, 
    isLoading: isSettingsLoading 
  } = useSettings();
  const { colors, theme, toggleTheme } = useTheme();
  const { profile, updateProfile, recalculateTargets, isLoading: isProfileLoading } = useProfile();

  const [inputKey, setInputKey] = useState('');
  const [inputDeepSeekKey, setInputDeepSeekKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [isDeepSeekKeySaved, setIsDeepSeekKeySaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  // Profile handling via Context
  // const [isProfileSaving, setIsProfileSaving] = useState(false);

  useEffect(() => {
    if (apiKey) setInputKey(apiKey);
    if (deepSeekApiKey) setInputDeepSeekKey(deepSeekApiKey);
  }, [apiKey, deepSeekApiKey]);

  // Removed local loadProfile since context handles it


  const triggerToast = () => {
    setShowToast(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Error', 'Please enter a valid OpenAI API key');
      return;
    }
    const success = await saveApiKey(inputKey.trim());
    if (success) {
      setIsKeySaved(true);
      setTimeout(() => setIsKeySaved(false), 3000);
      triggerToast();
    }
  };

  const handleSaveDeepSeekKey = async () => {
    if (!inputDeepSeekKey.trim()) {
      Alert.alert('Error', 'Please enter a valid DeepSeek API key');
      return;
    }
    const success = await saveDeepSeekApiKey(inputDeepSeekKey.trim());
    if (success) {
      setIsDeepSeekKeySaved(true);
      setTimeout(() => setIsDeepSeekKeySaved(false), 3000);
      triggerToast();
    }
  };

  const handleSaveProfile = async () => {
    // Context handles auto-save via updateProfile but user clicked explicit save
    triggerToast();
  };

  const handleRecalculate = async () => {
    await recalculateTargets();
    Alert.alert('Updated', 'Targets recalculated based on your goal.');
  };

  const handleUpdateProfile = (key: keyof typeof profile, value: any) => {
    updateProfile({ ...profile, [key]: value });
  };

  const renderRadio = (label: string, value: string, currentValue: string | null, onSelect: (val: any) => void) => (
    <TouchableOpacity 
      style={[
        styles.radioOption, 
        { borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.05)' },
        currentValue === value && { backgroundColor: colors.tint, borderColor: colors.tint }
      ]}
      onPress={() => onSelect(value)}
    >
      <Text style={[
        styles.radioText, 
        { color: colors.textSecondary },
        currentValue === value && { color: '#FFF', fontWeight: '600' } // Ensure contrast on tint
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  const handleToggleTheme = () => {
    Haptics.selectionAsync();
    toggleTheme();
  };

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
       {showToast && (
          <Animated.View 
            entering={FadeInDown.springify()} 
            exiting={FadeOut.duration(200)} 
            style={styles.toast}
          >
            <GlassCard style={[styles.toastContent, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.8)' }]}>
               <ShieldCheck size={20} color={colors.success} style={{marginRight: 8}} />
               <Text style={[styles.toastText, { color: theme === 'dark' ? colors.text : '#FFF' }]}>Saved Successfully</Text>
            </GlassCard>
          </Animated.View>
       )}
      <KeyboardAvoidingView 
        key={`profile-content-${animationKey}`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
          </Animated.View>

          {/* Theme Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
             <GlassCard style={styles.themeCard}>
               <View style={styles.themeRow}>
                 <View style={styles.themeInfo}>
                    {theme === 'dark' ? <Moon size={24} color={colors.tint} /> : <Sun size={24} color={colors.tint} />}
                    <Text style={[styles.themeText, { color: colors.text }]}>Dark Mode</Text>
                 </View>
                 <Switch 
                   value={theme === 'dark'}
                   onValueChange={handleToggleTheme}
                   trackColor={{ false: '#767577', true: colors.tint }}
                   thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''}
                 />
               </View>
             </GlassCard>
          </Animated.View>

          {/* User Info & Goals Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Health & Goals</Text>
            <GlassCard>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                  value={profile?.name}
                  onChangeText={(t) => handleUpdateProfile('name', t)}
                  placeholder="Your Name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { width: 80, marginRight: 16 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Age</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                    value={profile?.age?.toString() || ''}
                    onChangeText={(t) => handleUpdateProfile('age', parseInt(t) || null)}
                    placeholder="25"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>Height</Text>
                    <View style={styles.unitToggle}>
                      <TouchableOpacity 
                        onPress={() => handleUpdateProfile('heightUnit', 'cm')}
                        style={[styles.unitButton, (profile?.heightUnit || 'cm') === 'cm' && { backgroundColor: colors.tint }]}
                      >
                        <Text style={[styles.unitText, (profile?.heightUnit || 'cm') === 'cm' ? { color: '#FFF' } : { color: colors.textSecondary }]}>CM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleUpdateProfile('heightUnit', 'ft')}
                        style={[styles.unitButton, profile?.heightUnit === 'ft' && { backgroundColor: colors.tint }]}
                      >
                        <Text style={[styles.unitText, profile?.heightUnit === 'ft' ? { color: '#FFF' } : { color: colors.textSecondary }]}>FT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {profile?.heightUnit === 'ft' ? (
                    <View style={[styles.row, { marginBottom: 0, justifyContent: 'flex-start', gap: 6 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <TextInput
                           style={[styles.input, { width: 40, marginBottom: 0, textAlign: 'center', color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                           value={cmToFtIn(profile?.heightCm).ft}
                           onChangeText={(t) => {
                              const currentIn = cmToFtIn(profile?.heightCm).in;
                              const newCm = ftInToCm(t, currentIn);
                              handleUpdateProfile('heightCm', newCm);
                           }}
                           placeholder="5"
                           keyboardType="numeric"
                           placeholderTextColor={colors.textSecondary}
                           maxLength={1}
                         />
                         <Text style={{ color: colors.text, marginLeft: 2, fontSize: 14, fontWeight: '600' }}>&apos;</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <TextInput
                           style={[styles.input, { width: 44, marginBottom: 0, textAlign: 'center', color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                           value={cmToFtIn(profile?.heightCm).in}
                           onChangeText={(t) => {
                              const currentFt = cmToFtIn(profile?.heightCm).ft;
                              const newCm = ftInToCm(currentFt, t);
                              handleUpdateProfile('heightCm', newCm);
                           }}
                           placeholder="10"
                           keyboardType="numeric"
                           placeholderTextColor={colors.textSecondary}
                           maxLength={2}
                         />
                         <Text style={{ color: colors.text, marginLeft: 2, fontSize: 14, fontWeight: '600' }}>&quot;</Text>
                      </View>
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.input, { width: 120, textAlign: 'center', color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                      value={profile?.heightCm?.toString() || ''}
                      onChangeText={(t) => handleUpdateProfile('heightCm', parseInt(t) || null)}
                      placeholder="175"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                  value={profile?.weightKg?.toString() || ''}
                  onChangeText={(t) => handleUpdateProfile('weightKg', parseInt(t) || null)}
                  placeholder="70"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sex</Text>
                <View style={styles.radioGroup}>
                  {renderRadio('Male', 'male', profile?.sex || null, (v) => handleUpdateProfile('sex', v))}
                  {renderRadio('Female', 'female', profile?.sex || null, (v) => handleUpdateProfile('sex', v))}
                  {renderRadio('Other', 'other', profile?.sex || null, (v) => handleUpdateProfile('sex', v))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Activity Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {renderRadio('Sedentary', 'sedentary', profile?.activityLevel || null, (v) => handleUpdateProfile('activityLevel', v))}
                  {renderRadio('Light', 'light', profile?.activityLevel || null, (v) => handleUpdateProfile('activityLevel', v))}
                  {renderRadio('Moderate', 'moderate', profile?.activityLevel || null, (v) => handleUpdateProfile('activityLevel', v))}
                  {renderRadio('Active', 'active', profile?.activityLevel || null, (v) => handleUpdateProfile('activityLevel', v))}
                  {renderRadio('Very Active', 'very_active', profile?.activityLevel || null, (v) => handleUpdateProfile('activityLevel', v))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Goal</Text>
                <View style={styles.radioGroup}>
                  {renderRadio('Lose Weight', 'lose_weight', profile?.goal || null, (v) => handleUpdateProfile('goal', v))}
                  {renderRadio('Maintain', 'maintain', profile?.goal || null, (v) => handleUpdateProfile('goal', v))}
                  {renderRadio('Gain Weight', 'gain_weight', profile?.goal || null, (v) => handleUpdateProfile('goal', v))}
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Calorie Target (kcal)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                  value={profile?.calorieTarget?.toString() || ''}
                  onChangeText={(t) => handleUpdateProfile('calorieTarget', parseInt(t) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                 <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Protein (g)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                      value={profile?.proteinTarget?.toString() || ''}
                      onChangeText={(t) => handleUpdateProfile('proteinTarget', parseInt(t) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                 </View>
                 <View style={[styles.formGroup, { flex: 1, marginHorizontal: 4 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                      value={profile?.carbsTarget?.toString() || ''}
                      onChangeText={(t) => handleUpdateProfile('carbsTarget', parseInt(t) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                 </View>
                 <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Fats (g)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                      value={profile?.fatsTarget?.toString() || ''}
                      onChangeText={(t) => handleUpdateProfile('fatsTarget', parseInt(t) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                 </View>
              </View>

              <GlassButton 
                title="Recalculate Suggested Targets" 
                onPress={handleRecalculate}
                style={styles.secondaryButton}
                textStyle={{ fontSize: 14 }}
              />

              <GlassButton 
                title="Save Profile & Goals" 
                onPress={handleSaveProfile}
                isLoading={false}
                style={styles.saveProfileButton}
              />

            </GlassCard>
          </Animated.View>

          {/* AI Settings Section */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AI Settings</Text>
            <GlassCard>
              <View style={styles.settingHeader}>
                <Key size={20} color={colors.tint} style={{ marginRight: 8 }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>OpenAI Vision API Key</Text>
              </View>
              
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enter your OpenAI API key for meal analysis (Food Vision).
              </Text>

              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                value={inputKey}
                onChangeText={setInputKey}
                placeholder="sk-..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                secureTextEntry={true} 
              />

              <GlassButton 
                title={isKeySaved ? "Saved!" : "Save OpenAI Key"}
                onPress={handleSaveKey}
                isLoading={isSettingsLoading}
                style={styles.saveButton}
              />

              {/* DeepSeek Section */}
              <View style={[styles.divider, { backgroundColor: colors.glassBorder, marginVertical: 24 }]} />

              <View style={styles.settingHeader}>
                <Key size={20} color={colors.tint} style={{ marginRight: 8 }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>DeepSeek API Key</Text>
              </View>
              
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enter your DeepSeek API key for the AI Nutrition Coach. 
                DeepSeek is very affordable ($0.14/1M input tokens).
              </Text>

              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.glassBorder, backgroundColor: colors.glassBackgroundStrong }]}
                value={inputDeepSeekKey}
                onChangeText={setInputDeepSeekKey}
                placeholder="sk-..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                secureTextEntry={true} 
              />

              <GlassButton 
                title={isDeepSeekKeySaved ? "Saved!" : "Save DeepSeek Key"}
                onPress={handleSaveDeepSeekKey}
                isLoading={isSettingsLoading}
                style={styles.saveButton}
              />
              
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 120, // Space for tab bar
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  themeCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  unitButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  radioText: {
    fontSize: 14,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  saveProfileButton: {
    marginTop: 8,
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
