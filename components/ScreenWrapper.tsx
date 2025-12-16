import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, Animated } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedBgIntensity } from '@/hooks/useSettings';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
}

const intensityToScale: Record<AnimatedBgIntensity, number> = {
  'low': 0.3,
  'medium': 0.5,
  'high': 0.7,
  'super-high': 1.0,
};

const AnimatedBackground: React.FC<{ color: string; intensity: AnimatedBgIntensity }> = ({ color, intensity }) => {
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateY1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(0)).current;
  const translateY2 = useRef(new Animated.Value(0)).current;
  const translateX3 = useRef(new Animated.Value(0)).current;
  const translateY3 = useRef(new Animated.Value(0)).current;

  const scale = intensityToScale[intensity];

  useEffect(() => {
    const duration = 8000;
    
    const animate1 = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateX1, {
              toValue: 150,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateY1, {
              toValue: 200,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX1, {
              toValue: -100,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateY1, {
              toValue: -150,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX1, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(translateY1, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const animate2 = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateX2, {
              toValue: -120,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
            Animated.timing(translateY2, {
              toValue: 180,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX2, {
              toValue: 100,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
            Animated.timing(translateY2, {
              toValue: -120,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX2, {
              toValue: 0,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
            Animated.timing(translateY2, {
              toValue: 0,
              duration: duration * 1.2,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const animate3 = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateX3, {
              toValue: 80,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
            Animated.timing(translateY3, {
              toValue: -160,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX3, {
              toValue: -140,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
            Animated.timing(translateY3, {
              toValue: 140,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateX3, {
              toValue: 0,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
            Animated.timing(translateY3, {
              toValue: 0,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animate1();
    animate2();
    animate3();
  }, [translateX1, translateY1, translateX2, translateY2, translateX3, translateY3]);

  return (
    <>
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: color,
            opacity: 0.15 * scale,
            width: 300,
            height: 300,
            top: '10%',
            left: '10%',
            transform: [
              { translateX: translateX1 },
              { translateY: translateY1 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: color,
            opacity: 0.12 * scale,
            width: 350,
            height: 350,
            top: '40%',
            right: '5%',
            transform: [
              { translateX: translateX2 },
              { translateY: translateY2 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: color,
            opacity: 0.1 * scale,
            width: 280,
            height: 280,
            bottom: '15%',
            left: '20%',
            transform: [
              { translateX: translateX3 },
              { translateY: translateY3 },
            ],
          },
        ]}
      />
    </>
  );
};

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style, contentContainerStyle, edges }) => {
  const { colors, animatedBgEnabled, animatedBgColor, animatedBgIntensity } = useTheme();

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.background}
    >
      {animatedBgEnabled && (
        <AnimatedBackground color={animatedBgColor} intensity={animatedBgIntensity} />
      )}
      <SafeAreaView
        style={[styles.container, style]}
        edges={edges ?? ['top', 'left', 'right']}
      >
         {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
});
