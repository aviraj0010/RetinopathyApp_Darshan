import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
// import { initModel } from './src/services/modelService';
import { initModel } from './src/services/modelService';
const Stack = createNativeStackNavigator();

const App = () => {

    useEffect(() => {
        const setupModel = async () => {
          const success = await initModel();
          if (!success) {
            console.error('Failed to initialize TFLite model');
          }
        };
        setupModel();
      }, []);


  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Retinopathy Detection' }}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen}
          options={{ title: 'Analysis Results' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;