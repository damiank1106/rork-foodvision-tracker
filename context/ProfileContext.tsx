import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, saveUserProfile as saveProfileService, UserProfile, DEFAULT_PROFILE, calculateTargets } from '@/services/userProfile';

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await getUserProfile();
      setProfile(p);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    // Optimistic update
    setProfile(newProfile);
    try {
      await saveProfileService(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Revert on failure? Or just log.
    }
  }, []);

  const recalculateTargets = useCallback(async () => {
    const { calorieTarget, protein, carbs, fats } = calculateTargets(profile);
    const updated = {
      ...profile,
      calorieTarget,
      proteinTarget: protein,
      carbsTarget: carbs,
      fatsTarget: fats,
    };
    await updateProfile(updated);
  }, [profile, updateProfile]);

  return {
    profile,
    isLoading,
    updateProfile,
    recalculateTargets,
    refreshProfile: loadProfile,
  };
});
