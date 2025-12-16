import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface AnimatedBotIconProps {
  size?: number;
  color?: string;
}

export function AnimatedBotIcon({ size = 24, color }: AnimatedBotIconProps) {
  const { colors } = useTheme();
  const iconColor = color || colors.primary;
  
  const leftEyeScale = useRef(new Animated.Value(1)).current;
  const rightEyeScale = useRef(new Animated.Value(1)).current;
  const leftEyeTranslateY = useRef(new Animated.Value(0)).current;
  const rightEyeTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const blink = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftEyeScale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rightEyeScale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(leftEyeScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rightEyeScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    const lookAround = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftEyeTranslateY, {
            toValue: -size * 0.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(rightEyeTranslateY, {
            toValue: -size * 0.08,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(leftEyeTranslateY, {
            toValue: size * 0.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(rightEyeTranslateY, {
            toValue: size * 0.08,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(leftEyeTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(rightEyeTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    const blinkInterval = setInterval(() => {
      const random = Math.random();
      if (random > 0.7) {
        blink();
      }
    }, 2000);

    const lookInterval = setInterval(() => {
      const random = Math.random();
      if (random > 0.6) {
        lookAround();
      }
    }, 4000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(lookInterval);
    };
  }, [leftEyeScale, rightEyeScale, leftEyeTranslateY, rightEyeTranslateY, size]);

  const eyeSize = size * 0.2;
  const antennaHeight = size * 0.25;
  const antennaWidth = size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.antenna, { 
        width: antennaWidth, 
        height: antennaHeight,
        backgroundColor: iconColor,
        left: size * 0.3,
        top: -antennaHeight * 0.3,
      }]} />
      <View style={[styles.antenna, { 
        width: antennaWidth, 
        height: antennaHeight,
        backgroundColor: iconColor,
        right: size * 0.3,
        top: -antennaHeight * 0.3,
      }]} />
      
      <View style={[styles.head, { 
        width: size * 0.85, 
        height: size * 0.7,
        borderRadius: size * 0.15,
        borderWidth: size * 0.08,
        borderColor: iconColor,
      }]}>
        <View style={[styles.eyesContainer, { gap: size * 0.15 }]}>
          <Animated.View 
            style={[
              styles.eye, 
              { 
                width: eyeSize, 
                height: eyeSize,
                backgroundColor: iconColor,
                transform: [
                  { scaleY: leftEyeScale },
                  { translateY: leftEyeTranslateY }
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.eye, 
              { 
                width: eyeSize, 
                height: eyeSize,
                backgroundColor: iconColor,
                transform: [
                  { scaleY: rightEyeScale },
                  { translateY: rightEyeTranslateY }
                ]
              }
            ]} 
          />
        </View>
        
        <View style={[styles.mouth, { 
          width: size * 0.4,
          height: size * 0.15,
          borderBottomWidth: size * 0.06,
          borderColor: iconColor,
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  antenna: {
    position: 'absolute',
    borderRadius: 100,
  },
  head: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  eyesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eye: {
    borderRadius: 100,
  },
  mouth: {
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    marginTop: 2,
  },
});
