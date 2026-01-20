import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import MainTabNavigator from './MainTabNavigator';
import ModalScreen from '../screens/ModalScreen';
import { useTheme } from '../hooks/useTheme';
import { useColorScheme } from 'react-native';

const Stack = createStackNavigator();

export default function RootStackNavigator() {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen
        name="Modal"
        component={ModalScreen}
        options={{
          presentation: 'modal',
          cardStyle: {
            backgroundColor:
              colorScheme === 'dark'
                ? 'rgba(0,0,0,0.5)'
                : 'rgba(0,0,0,0.3)',
          },

          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
