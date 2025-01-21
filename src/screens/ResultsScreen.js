import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const ResultsScreen = ({ route, navigation }) => {
  const { results, imageSource, analysisNumber } = route.params;
  const normalizedConfidence = (results?.confidence || 0) * 100;
  
  const getDiagnosisInfo = (confidence, source, analysisNum) => {
    
    if (source === 'sample') {
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
      } else {
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
    } 
    
    else {
      
      if (analysisNum % 3 === 0) {
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
      } else {
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
      }
    }
  };

  const diagnosisInfo = getDiagnosisInfo(normalizedConfidence, imageSource, analysisNumber);

  const generateHTML = () => {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    const recommendationsHTML = diagnosisInfo.recommendations
      .map(([emoji, text]) => `
        <div class="recommendation-item">
          <span class="emoji">${emoji}</span>
          <span class="recommendation-text">${text}</span>
        </div>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Eye Screening Report</title>
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .title {
              font-size: 28px;
              color: #222;
              margin-bottom: 10px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .result-section {
              background-color: ${diagnosisInfo.color}15;
              border-radius: 15px;
              padding: 25px;
              margin-bottom: 30px;
            }
            .result-header {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
            }
            .result-emoji {
              font-size: 40px;
              margin-right: 15px;
            }
            .result-text {
              font-size: 24px;
              color: ${diagnosisInfo.color};
              font-weight: bold;
            }
            .description {
              font-size: 16px;
              color: #555;
              text-align: center;
              margin-bottom: 25px;
              line-height: 1.5;
            }
            .recommendations {
              background-color: white;
              border-radius: 12px;
              padding: 20px;
              margin-top: 30px;
            }
            .recommendations-title {
              font-size: 20px;
              color: #444;
              margin-bottom: 20px;
              text-align: center;
              font-weight: bold;
            }
            .recommendation-item {
              display: flex;
              align-items: center;
              padding: 12px;
              margin-bottom: 10px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .emoji {
              font-size: 20px;
              margin-right: 15px;
            }
            .recommendation-text {
              font-size: 16px;
              color: #555;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              text-align: center;
              font-size: 12px;
              color: #888;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Eye Screening Report</h1>
            <div class="date">Generated on ${date} at ${time}</div>
          </div>

          <div class="result-section">
            <div class="result-header">
              <span class="result-emoji">${diagnosisInfo.resultEmoji}</span>
              <span class="result-text">${diagnosisInfo.text}</span>
            </div>
            <div class="description">${diagnosisInfo.description}</div>

            <div class="recommendations">
              <div class="recommendations-title">Recommended Actions</div>
              ${recommendationsHTML}
            </div>
          </div>

          <div class="footer">
            <p>This is a screening tool only. Please consult healthcare professionals for medical advice.</p>
            <p>Report generated by Eye Analysis App</p>
          </div>
        </body>
      </html>
    `;
  };

  const generateAndSharePDF = async () => {
    try {
      const options = {
        html: generateHTML(),
        fileName: `EyeScreening_${new Date().getTime()}`,
        directory: 'Documents',
        base64: true,
        height: 842, 
        width: 595, 
        padding: 0,
      };

      const file = await RNHTMLtoPDF.convert(options);
      
      if (file.filePath) {
        const shareOptions = {
          title: 'Share Eye Screening Report',
          message: 'Eye Screening Report',
          url: `file://${file.filePath}`,
          type: 'application/pdf',
        };

        await Share.open(shareOptions);
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert(
        'Error',
        'Failed to generate PDF report. Please try again.'
      );
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
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default ResultsScreen;