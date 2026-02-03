import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProgressScreen from "@/screens/ProgressScreen";
import { HeaderTitleText } from "@/components/HeaderTitleText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useLanguage } from "@/contexts/LanguageContext";

export type ProgressStackParamList = {
  Progress: undefined;
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressStackNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useLanguage();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("progress")} tintColor={tintColor} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
