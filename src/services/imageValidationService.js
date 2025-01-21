import { Image } from 'react-native';

export const validateEyeImage = (imageUri) => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      imageUri,
      (width, height) => {
        
        const aspectRatio = width / height;
        const isReasonableSize = width >= 300 && height >= 300;
        const hasValidAspectRatio = aspectRatio >= 0.8 && aspectRatio <= 1.5;

        if (!isReasonableSize) {
          reject(new Error('Image resolution is too low. Please provide a higher quality image.'));
        } else if (!hasValidAspectRatio) {
          reject(new Error('Image does not appear to be an eye photo. Please provide a properly cropped eye image.'));
        } else {
          resolve(true);
        }
      },
      (error) => reject(new Error('Failed to load image. Please try again.'))
    );
  });
};