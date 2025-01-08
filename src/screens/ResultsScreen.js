import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const ResultsScreen = ({ route, navigation }) => {
  const { results } = route.params;
  const normalizedConfidence = (results?.confidence || 0) * 100;
  
  const getDiagnosisInfo = (confidence) => {
    if (confidence < 2000) {
      return {
        text: 'Healthy Eye',
        emoji: '✅',
        resultEmoji: '👁️',
        color: '#4CAF50',
        description: 'No signs of diabetic retinopathy detected.',
        recommendations: [
          ['🔍', 'Schedule regular eye check-ups'],
          ['📊', 'Monitor blood sugar levels'],
          ['🥗', 'Maintain a healthy diet'],
          ['⏰', 'Get routine screenings']
        ]
      };
    } else if (confidence >= 2000) {
      return {
        text: 'Signs of Retinopathy',
        emoji: '⚠️',
        resultEmoji: '🏥',
        color: '#F44336',
        description: 'Potential signs of diabetic retinopathy detected.',
        recommendations: [
          ['👨‍⚕️', 'See an eye specialist immediately'],
          ['📈', 'Track blood sugar closely'],
          ['📝', 'Document any vision changes'],
          ['📅', 'Keep all medical appointments']
        ]
      };
    }
    return {
      text: 'Inconclusive',
      emoji: '❓',
      resultEmoji: '📸',
      color: '#FFA500',
      description: 'Unable to make a confident assessment.',
      recommendations: [
        ['📱', 'Take another photo'],
        ['💡', 'Ensure better lighting'],
        ['🎯', 'Center the eye in frame'],
        ['🔎', 'Check image is clear']
      ]
    };
  };

  const diagnosisInfo = getDiagnosisInfo(normalizedConfidence);

  const generateHTML = () => {
    const recommendationsHTML = diagnosisInfo.recommendations
      .map(([emoji, text]) => `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 20px; margin-right: 10px;">${emoji}</span>
          <span style="font-size: 16px; color: #555;">${text}</span>
        </div>
      `)
      .join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${diagnosisInfo.color}; font-size: 24px;">
              ${diagnosisInfo.emoji} ${diagnosisInfo.text}
            </h1>
            <p style="color: #666; font-size: 16px;">${diagnosisInfo.description}</p>
          </div>
          
          <div style="background-color: #F8F9FA; padding: 20px; border-radius: 10px;">
            <h2 style="color: #444; font-size: 18px; text-align: center; margin-bottom: 20px;">
              Recommended Actions
            </h2>
            ${recommendationsHTML}
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; font-style: italic;">
            This is a screening tool only. Please consult healthcare professionals for medical advice.
          </p>
        </body>
      </html>
    `;
  };

  const generateAndSharePDF = async () => {
    try {
      const options = {
        html: generateHTML(),
        fileName: 'EyeScreeningReport',
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      
      const shareOptions = {
        title: 'Share Report',
        message: 'Eye Screening Report',
        url: Platform.OS === 'ios' ? `file://${file.filePath}` : file.filePath,
        type: 'application/pdf',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.resultCard}>
        <View style={[styles.emojiContainer, { backgroundColor: diagnosisInfo.color }]}>
          <Text style={styles.largeEmoji}>{diagnosisInfo.resultEmoji}</Text>
          <Text style={styles.resultEmoji}>{diagnosisInfo.emoji}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: diagnosisInfo.color }]}>
            {diagnosisInfo.text}
          </Text>
          <Text style={styles.description}>{diagnosisInfo.description}</Text>
        </View>

        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommended Actions</Text>
          {diagnosisInfo.recommendations.map(([emoji, text], index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationEmoji}>{emoji}</Text>
              <Text style={styles.recommendationText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.analyzeButton, { backgroundColor: diagnosisInfo.color }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonEmoji}>📸</Text>
        <Text style={styles.buttonText}>Analyze Another Image</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.shareButton]}
        onPress={generateAndSharePDF}
      >
        <Text style={styles.buttonEmoji}>📄</Text>
        <Text style={styles.shareButtonText}>Generate & Share Report</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This is a screening tool only. Please consult healthcare professionals for medical advice.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  resultCard: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  largeEmoji: {
    fontSize: 50,
  },
  resultEmoji: {
    fontSize: 24,
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  recommendationsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 15,
    textAlign: 'center',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 15,
    gap: 10,
  },
  buttonEmoji: {
    fontSize: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    gap: 10,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;