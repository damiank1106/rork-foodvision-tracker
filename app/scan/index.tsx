import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { GlassButton } from '@/components/GlassButton';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

export default function ScanMealScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const insets = useSafeAreaInsets();

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permissionContent}>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            We need access to your camera to scan your meals for analysis.
          </Text>
          <GlassButton 
            title="Grant Permission" 
            onPress={requestPermission} 
            style={styles.permissionButton}
          />
           <GlassButton 
            title="Cancel" 
            variant="secondary"
            onPress={() => router.back()} 
          />
        </View>
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current && !isTakingPhoto) {
      setIsTakingPhoto(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false, // Ensure correct orientation
        });

        if (photo) {
          router.push({
            pathname: '/scan/preview',
            params: { imageUri: photo.uri },
          } as any);
        }
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      } finally {
        setIsTakingPhoto(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, 
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        router.push({
          pathname: '/scan/preview',
          params: { imageUri: result.assets[0].uri },
        } as any);
      }
    } catch {
       Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {Platform.OS === 'web' ? (
         <View style={styles.webContainer}>
           <Text style={styles.webText}>Camera not supported on web preview.</Text>
           <Text style={styles.webText}>Please try on a real device.</Text>
           <GlassButton title="Go Back" onPress={() => router.back()} style={{marginTop: 20}}/>
         </View>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
           {/* Close Button - Positioned absolutely on screen */}
           <TouchableOpacity 
             style={[styles.closeButton, { top: insets.top + 20 }]} 
             onPress={() => router.back()}
           >
             <X size={32} color="#FFF" />
           </TouchableOpacity>

            <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 40 }]}>
               {/* Left spacer to balance layout */}
               <View style={styles.sideControl} />
               
               {/* Shutter */}
               <TouchableOpacity 
                  style={styles.shutterOuter} 
                  onPress={takePhoto}
                  disabled={isTakingPhoto}
                >
                  <View style={[
                    styles.shutterInner,
                    isTakingPhoto && styles.shutterInnerPressed
                  ]} />
                </TouchableOpacity>

               {/* Library Button */}
               <TouchableOpacity style={styles.sideControl} onPress={pickImage}>
                  <View style={styles.libraryButton}>
                    <ImageIcon size={24} color="#FFF" />
                  </View>
               </TouchableOpacity>
            </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    width: '100%',
    marginBottom: 12,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end', // Push controls to bottom
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  sideControl: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  libraryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  shutterInnerPressed: {
    transform: [{ scale: 0.9 }],
    backgroundColor: '#ddd',
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  }
});
