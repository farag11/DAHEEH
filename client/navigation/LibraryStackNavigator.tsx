import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LibraryScreen from "@/screens/LibraryScreen";
import CollectionsScreen from "@/screens/CollectionsScreen";
import { HeaderTitleText } from "@/components/HeaderTitleText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useLanguage } from "@/contexts/LanguageContext";

export type LibraryStackParamList = {
  Library: undefined;
  Collections: { collectionId?: string } | undefined;
};

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useLanguage();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("library")} tintColor={tintColor} />
          ),
        }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("collections")} tintColor={tintColor} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
