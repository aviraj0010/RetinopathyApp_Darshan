import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  Text,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  PermissionsAndroid, // Add this import
  Dimensions
} from 'react-native';
import RNFS from 'react-native-fs'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {initModel, processImage } from '../services/modelService';


const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 20;
const IMAGE_WIDTH = width - (CONTAINER_PADDING * 2);



const sampleImages = {
  sample1: require('../../assets/healthy_eye.png'),
  sample2: require('../../assets/retinopathic.png'),
  sample3: require('../../assets/test.jpg'),
  sample4: require('../../assets/eye17.png'),
};

const HomeScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    const setupModel = async () => {
      try {
        const initialized = await initModel();
        setIsModelReady(initialized);
      } catch (error) {
        Alert.alert('Error', 'Failed to initialize model. Please restart the app.');
      }
    };
    
    setupModel();
  }, []);
  // Add permission check for Android
  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs camera permission to take pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleCameraLaunch = async () => {
    // Check permissions first on Android
    if (Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8, // Reduced quality for better performance
      saveToPhotos: true,
      includeBase64: true, // Enable base64 for reliable image processing
    };

    try {
      const response = await new Promise((resolve) => {
        launchCamera(options, resolve);
      });

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.error('Camera Error:', response.error);
        Alert.alert('Error', 'Failed to access camera: ' + response.error);
      } else if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera Launch Error:', error);
      Alert.alert('Error', 'Failed to launch camera');
    }
  };

  const handleGalleryLaunch = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    };

    try {
      const response = await new Promise((resolve) => {
        launchImageLibrary(options, resolve);
      });

      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery Launch Error:', error);
      Alert.alert('Error', 'Failed to access gallery');
    }
  };

  const handleSampleSelect = async (imagePath) => {
    try {
      setIsLoading(true);
      const resolvedUri = Image.resolveAssetSource(imagePath).uri;
      
      // For sample images from assets, we need to copy them to a local file
      const filename = `sample_${Date.now()}.jpg`;
      const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      // If on Android and in debug mode, handle the dev server URL
      if (Platform.OS === 'android' && resolvedUri.startsWith('http')) {
        await RNFS.downloadFile({
          fromUrl: resolvedUri,
          toFile: localPath,
          background: false
        }).promise;
      } else {
        // For release builds or iOS, copy from assets
        await RNFS.copyFile(resolvedUri, localPath);
      }
      
      setSelectedImage(localPath);
    } catch (error) {
      console.error('Sample Image Error:', error);
      Alert.alert('Error', 'Failed to load sample image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !isModelReady) {
      Alert.alert('Error', 'Please wait for model initialization or select an image');
      return;
    }

    if (!selectedImage) return;

    try {
      setIsLoading(true);
      
      // Add error handling and logging for processImage
      console.log('Starting image analysis...', selectedImage);
      const results = await processImage(selectedImage);
      
      if (!results) {
        throw new Error('No results returned from image processing');
      }
      
      console.log('Analysis completed successfully');
      navigation.navigate('Results', { results });
    } catch (error) {
      console.error('Analysis Error:', error);
      Alert.alert(
        'Analysis Error',
        'Failed to analyze image. Please ensure the image is clear and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Eye Analysis</Text>
          <Text style={styles.headerSubtitle}>Upload or capture an eye image for analysis</Text>
        </View>

        <View style={styles.mainImageContainer}>
          {selectedImage ? (
            <>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.mainImage}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSelectedImage(null)}
              >
                 <Text style={styles.emoji}>❌</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>👁️</Text>
              <Text style={styles.placeholderText}>Select or capture an image</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cameraButton]} 
            onPress={handleCameraLaunch}
          >
            <Text style={styles.emoji}>📸</Text>
            <Text style={styles.actionButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.galleryButton]} 
            onPress={handleGalleryLaunch}
          >
            <Text style={styles.emoji}>🖼️</Text>
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        
        {selectedImage && (
          <TouchableOpacity 
            style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
              <Text style={styles.emoji}>🔍</Text>
                <Text style={styles.analyzeButtonText}>Analyze Image</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.sampleSection}>
          <Text style={styles.sampleTitle}>Sample Images</Text>
          <ScrollView 
            horizontal 
            style={styles.samplesContainer}
            showsHorizontalScrollIndicator={false}
          >
            {Object.entries(sampleImages).map(([key, image]) => (
              <TouchableOpacity
                key={key}
                style={styles.sampleImageContainer}
                onPress={() => handleSampleSelect(image)}
              >
                <Image
                  source={image}
                  style={styles.sampleImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  mainImageContainer: {
    height: 300,
    margin: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#673AB7',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sampleSection: {
    marginTop: 20,
  },
  sampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 10,
    color: '#333',
  },
  samplesContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sampleImageContainer: {
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    backgroundColor: '#fff',
  },
  sampleImage: {
    width: 100,
    height: 100,
  }
});

export default HomeScreen;