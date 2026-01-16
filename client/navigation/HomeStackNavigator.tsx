import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import SummarizeScreen from "@/screens/SummarizeScreen";
import QuizScreen from "@/screens/QuizScreen";
import ExplainScreen from "@/screens/ExplainScreen";
import PlannerScreen from "@/screens/PlannerScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { HeaderTitleText } from "@/components/HeaderTitleText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useLanguage } from "@/contexts/LanguageContext";

export type HomeStackParamList = {
  Home: undefined;
  Summarize: { sessionId?: string } | undefined;
  Quiz: { sourceText?: string } | undefined;
  Explain: { sessionId?: string } | undefined;
  Planner: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useLanguage();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: HeaderTitle,
        }}
      />
      <Stack.Screen
        name="Summarize"
        component={SummarizeScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("textSummarizer")} tintColor={tintColor} />
          ),
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("questionGenerator")} tintColor={tintColor} />
          ),
        }}
      />
      <Stack.Screen
        name="Explain"
        component={ExplainScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("conceptExplainer")} tintColor={tintColor} />
          ),
        }}
      />
      <Stack.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          headerTitle: ({ tintColor }) => (
            <HeaderTitleText title={t("studyPlanner")} tintColor={tintColor} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
