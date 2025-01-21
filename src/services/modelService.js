import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const { TFLiteModule } = NativeModules;


const getModelPath = () => {
  return Platform.select({
    android: `${RNFS.DocumentDirectoryPath}/model.tflite`,
    ios: `${RNFS.MainBundlePath}/model.tflite`,
  });
};

export const initModel = async () => {
  try {
    console.log('Starting model initialization...');
    const modelPath = getModelPath();
    console.log('Model path:', modelPath);

    const modelExists = await RNFS.exists(modelPath);
    if (!modelExists) {
     
      await RNFS.copyFileAssets('model.tflite', modelPath);
     
    } else {
      
    }

    
    await TFLiteModule.loadModel(modelPath);
    
    
    return true;
  } catch (error) {
    console.error(':', error);
    throw error;
  }
};


const ensureLocalImage = async (imagePath) => {
 
  
  
  if (imagePath.startsWith('file://') || imagePath.startsWith('/')) {
    return imagePath;
  }

  
  if (imagePath.startsWith('http')) {
    const filename = `temp_${Date.now()}.jpg`;
    const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;
    
    console.log('Downloading image to:', localPath);
    
    try {
      await RNFS.downloadFile({
        fromUrl: imagePath,
        toFile: localPath,
        background: false
      }).promise;
      
      console.log('Image downloaded successfully');
      return localPath;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw new Error('Failed to download image: ' + error.message);
    }
  }

  throw new Error('Unsupported image path format');
};

export const processImage = async (imagePath) => {
  try {
    

    
    const localImagePath = await ensureLocalImage(imagePath);
   

    
    const imageExists = await RNFS.exists(localImagePath);
    if (!imageExists) {
      throw new Error(':');
    }

    
    const imageStats = await RNFS.stat(localImagePath);
    console.log('Image stats:', imageStats);

    if (imageStats.size === 0) {
      throw new Error('Image file is empty');
    }

    
    console.log('Calling TFLiteModule.analyzeImage...');
    const results = await TFLiteModule.analyzeImage(localImagePath);
    
    if (!results) {
      throw new Error('No results returned from TFLite module');
    }

    console.log('Raw results:', results);

    const processedResults = {
      confidence: parseFloat((results.confidence * 100).toFixed(2)),
      classification: results.classification,
      condition: mapClassificationToCondition(results.classification)
    };

    
    if (localImagePath.startsWith(RNFS.CachesDirectoryPath)) {
      RNFS.unlink(localImagePath).catch(err => 
        console.warn('Failed to cleanup temporary image:', err)
      );
    }

    console.log('Processed results:', processedResults);
    return processedResults;

  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }
};

const mapClassificationToCondition = (classification) => {
  const conditions = [
    'No DR',
    'Mild',
    'Moderate', 
    'Severe',
    'Proliferative DR'
  ];
  
  if (classification < 0 || classification >= conditions.length) {
    console.warn(`Invalid classification number: ${classification}`);
    return 'Unknown';
  }
  
  return conditions[classification];
};