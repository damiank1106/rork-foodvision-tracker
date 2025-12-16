import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle, Animated } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedBgIntensity } from '@/hooks/useSettings';
import { Pizza, Coffee, Apple, Croissant, Cherry, IceCream, Candy, Cookie, Cake, Beer, Wine, Sandwich, Egg, Fish, Beef, Grape, Banana, Salad, Soup } from 'lucide-react-native';

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

const foodIcons = [
  { Icon: Pizza, size: 48 },
  { Icon: Coffee, size: 42 },
  { Icon: Apple, size: 40 },
  { Icon: Croissant, size: 46 },
  { Icon: Cherry, size: 38 },
  { Icon: IceCream, size: 44 },
  { Icon: Candy, size: 40 },
  { Icon: Cookie, size: 42 },
  { Icon: Cake, size: 46 },
  { Icon: Beer, size: 44 },
  { Icon: Wine, size: 42 },
  { Icon: Sandwich, size: 48 },
  { Icon: Egg, size: 38 },
  { Icon: Fish, size: 46 },
  { Icon: Beef, size: 44 },
  { Icon: Grape, size: 40 },
  { Icon: Banana, size: 42 },
  { Icon: Salad, size: 46 },
  { Icon: Soup, size: 44 },
];

const AnimatedFoodIcons: React.FC<{ color: string; intensity: AnimatedBgIntensity }> = ({ color, intensity }) => {
  const positions = useRef(
    foodIcons.map(() => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = positions.map((pos, index) => {
      const duration = 8000 + index * 800;
      const delay = index * 400;

      const xRange = [-120 + index * 20, 120 - index * 15];
      const yRange = [-150 + index * 25, 150 - index * 20];

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(pos.translateX, {
              toValue: xRange[1],
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.translateY, {
              toValue: yRange[1],
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.rotate, {
              toValue: 360,
              duration: duration * 1.5,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pos.translateX, {
              toValue: xRange[0],
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.translateY, {
              toValue: yRange[0],
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.rotate, {
              toValue: 720,
              duration: duration * 1.5,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pos.translateX, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.translateY, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(pos.rotate, {
              toValue: 1080,
              duration: duration * 1.5,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animation.start();
      return animation;
    });

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [positions]);

  const iconPositions = [
    { top: '8%', left: '10%' },
    { top: '15%', right: '15%' },
    { top: '25%', left: '5%' },
    { top: '35%', right: '8%' },
    { top: '50%', left: '12%' },
    { top: '60%', right: '10%' },
    { top: '70%', left: '8%' },
    { top: '78%', right: '12%' },
    { bottom: '12%', left: '15%' },
    { top: '12%', left: '45%' },
    { top: '20%', right: '35%' },
    { top: '42%', left: '35%' },
    { top: '55%', right: '30%' },
    { top: '68%', left: '42%' },
    { top: '82%', right: '35%' },
    { bottom: '8%', left: '50%' },
    { top: '30%', left: '75%' },
    { top: '45%', right: '75%' },
    { top: '65%', left: '70%' },
  ];

  return (
    <>
      {foodIcons.map(({ Icon, size }, index) => {
        const pos = positions[index];
        const position = iconPositions[index];
        const rotate = pos.rotate.interpolate({
          inputRange: [0, 1080],
          outputRange: ['0deg', '1080deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.foodIcon,
              position,
              {
                opacity: 0.35 * intensityToScale[intensity],
                transform: [
                  { translateX: pos.translateX },
                  { translateY: pos.translateY },
                  { rotate },
                ],
              },
            ]}
          >
            <Icon size={size} color={color} strokeWidth={1.5} />
          </Animated.View>
        );
      })}
    </>
  );
};

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style, contentContainerStyle, edges }) => {
  const { colors, animatedBgEnabled, animatedBgColor, animatedBgIntensity, animatedFoodIconsEnabled, animatedFoodIconsColor, animatedFoodIconsIntensity } = useTheme();

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.background}
    >
      {animatedBgEnabled && (
        <AnimatedBackground color={animatedBgColor} intensity={animatedBgIntensity} />
      )}
      {animatedFoodIconsEnabled && (
        <AnimatedFoodIcons color={animatedFoodIconsColor} intensity={animatedFoodIconsIntensity} />
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
  foodIcon: {
    position: 'absolute' as const,
  },
});
