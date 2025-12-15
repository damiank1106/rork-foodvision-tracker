import { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Alert, Image as RNImage, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { X } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { GlassButton } from '@/components/GlassButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 40; // Square crop area

export default function CropScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Load image size
  useState(() => {
    if (imageUri) {
      RNImage.getSize(imageUri, (w, h) => {
        setImageSize({ width: w, height: h });
        // Initialize scale to fit image in crop area cover
        const scaleW = CROP_SIZE / w;
        const scaleH = CROP_SIZE / h;
        const initialScale = Math.max(scaleW, scaleH);
        scale.value = initialScale;
        savedScale.value = initialScale;
      }, (err) => {
        console.error('Failed to get image size', err);
        Alert.alert('Error', 'Could not load image size.');
        router.back();
      });
    }
  });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleSave = async () => {
    if (!imageSize || !imageUri) return;
    setIsProcessing(true);

    try {
      // Calculate crop coordinates
      // The view is CROP_SIZE x CROP_SIZE
      // The image is at (translateX, translateY) with scale
      // We need to find which part of the image is under the view.
      
      // Coordinate system:
      // View origin is (0,0) relative to the crop area.
      // Image center is at (translateX, translateY) relative to View center? 
      // Wait, standard transform origin is center.
      
      // Let's assume standard transform logic:
      // Image is drawn centered at (CROP_SIZE/2, CROP_SIZE/2) if tx=0, ty=0?
      // No, Image is usually placed at 0,0 of container if not centered.
      // Let's assume the Image component is centered in the crop area.

      // Actually, easier logic:
      // The displayed image rect is:
      // Left: (CROP_SIZE - imageSize.width * scale) / 2 + translateX
      // Top: (CROP_SIZE - imageSize.height * scale) / 2 + translateY
      
      // We want the part of image that intersects with crop rect (0, 0, CROP_SIZE, CROP_SIZE).
      // Crop Rect relative to Image:
      // CropX_on_Image = (0 - ImageLeft) / scale
      // CropY_on_Image = (0 - ImageTop) / scale
      
      const currentScale = scale.value;
      const displayedWidth = imageSize.width * currentScale;
      const displayedHeight = imageSize.height * currentScale;

      const imageLeft = (CROP_SIZE - displayedWidth) / 2 + translateX.value;
      const imageTop = (CROP_SIZE - displayedHeight) / 2 + translateY.value;

      // The crop rectangle in displayed coordinates is (0, 0, CROP_SIZE, CROP_SIZE)
      // We map this back to original image coordinates.
      
      let originX = (0 - imageLeft) / currentScale;
      let originY = (0 - imageTop) / currentScale;
      let cropW = CROP_SIZE / currentScale;
      let cropH = CROP_SIZE / currentScale;

      // Clamping to image bounds
      originX = Math.max(0, originX);
      originY = Math.max(0, originY);
      
      if (originX + cropW > imageSize.width) cropW = imageSize.width - originX;
      if (originY + cropH > imageSize.height) cropH = imageSize.height - originY;

      const actions = [];
      actions.push({
        crop: {
          originX,
          originY,
          width: cropW,
          height: cropH,
        },
      });

      // Resize to max 1024x1024 to save tokens
      if (cropW > 1024 || cropH > 1024) {
        actions.push({
          resize: {
            width: cropW > cropH ? 1024 : undefined,
            height: cropH > cropW ? 1024 : undefined,
          }
        });
      }

      const result = await manipulateAsync(
        imageUri,
        actions,
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Navigate back with new URI
      // We use router.push to 'replace' the preview screen effectively
      // Or we can go back and pass params? 
      // Since preview is active, we can just push preview again with new URI?
      // No, let's navigate to preview, it will refresh.
      router.dismiss();
      router.replace({ pathname: '/scan/preview', params: { imageUri: result.uri } } as any);

    } catch (error) {
      console.error('Crop failed:', error);
      Alert.alert('Error', 'Failed to crop image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: '#000' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: '#fff' }]}>Crop & Resize</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => router.back()}
            >
              <X size={28} color="#FFF" />
            </TouchableOpacity>
        </View>

        <View style={styles.cropContainer}>
          <View style={[styles.cropFrame, { width: CROP_SIZE, height: CROP_SIZE }]}>
             {imageUri && imageSize && (
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={[styles.imageWrapper, { width: imageSize.width, height: imageSize.height }, animatedStyle]}>
                     <RNImage 
                        source={{ uri: imageUri }} 
                        style={{ width: imageSize.width, height: imageSize.height }} 
                      />
                  </Animated.View>
                </GestureDetector>
             )}
             {/* Grid Overlay */}
             <View style={styles.gridOverlay} pointerEvents="none">
                <View style={styles.gridLineH} />
                <View style={styles.gridLineH} />
                <View style={styles.gridLineV} />
                <View style={styles.gridLineV} />
             </View>
          </View>
          <Text style={styles.hintText}>Pinch to zoom, drag to move</Text>
        </View>

        <View style={styles.controls}>
          <GlassButton 
            title="Cancel" 
            variant="secondary" 
            onPress={() => router.back()} 
            style={{ flex: 1 }}
          />
          <View style={{ width: 16 }} />
          <GlassButton 
            title="Save" 
            onPress={handleSave} 
            isLoading={isProcessing}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20, // Align with header padding
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    // Center alignment handled by layout
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignContent: 'space-evenly',
  },
  gridLineH: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineV: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'absolute', 
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
  },
  hintText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
  }
});
