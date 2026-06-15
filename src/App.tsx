import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EmployeeListScreen from './screens/EmployeeListScreen';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <EmployeeListScreen />
    </SafeAreaProvider>
  );
};

export default App;
