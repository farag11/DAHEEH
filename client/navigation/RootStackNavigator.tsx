import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen"; // Default import to match the fixed screen
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator();

export default function RootStackNavigator() {
  return (
    <>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </>
  );
}
