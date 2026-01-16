import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as haptics from "@/utils/haptics";
import * as Clipboard from "expo-clipboard";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy } from "@/contexts/StudyContext";
import { useGamification } from "@/contexts/GamificationContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { createStudyPlan, hasApiKey } from "@/services/aiService";
import { GlassPrimaryButton } from "@/components/GlassButton";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { GlowingSlider } from "@/components/GlowingSlider";
import { GlassDateChips } from "@/components/GlassDateChips";
import { ProgressDashboard } from "@/components/ProgressDashboard";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { addStudyPlan, studyPlans } = useStudy();
  const { awardXP } = useGamification();
  const toast = useToast();

  const [planName, setPlanName] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [daysAvailable, setDaysAvailable] = useState(3);
  const [minutesPerDay, setMinutesPerDay] = useState(10);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getMinutesColor = (mins: number) => {
    if (mins <= 25) return { color: "#10B981", label: isRTL ? "سهل" : "Easy", gradient: ["#10B981", "#059669"] };
    if (mins <= 60) return { color: "#3B82F6", label: isRTL ? "تركيز" : "Focus", gradient: ["#3B82F6", "#2563EB"] };
    return { color: "#F97316", label: isRTL ? "مكثف" : "Intense", gradient: ["#F97316", "#EA580C"] };
  };

  const minutesStyle = getMinutesColor(minutesPerDay);

  const handleMinutesChange = (value: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMinutesPerDay(value);
    haptics.selection();
  };

  const handleDaysChange = (value: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDaysAvailable(value);
    haptics.selection();
  };

  const totalMinutes = daysAvailable * minutesPerDay;
  const existingPlansCount = studyPlans?.length || 0;
  const mockProgress = existingPlansCount > 0 ? Math.min(75, existingPlansCount * 15) : 0;

  const addTopic = () => {
    if (newTopic.trim()) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
      haptics.lightTap();
    }
  };

  const removeTopic = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setTopics(topics.filter((_, i) => i !== index));
    haptics.lightTap();
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  const handleGenerate = async () => {
    const allTopics = planName.trim() 
      ? [planName.trim(), ...topics] 
      : topics;

    if (allTopics.length === 0) {
      toast.show(t("provideStudyText"), "error");
      return;
    }

    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast.show(t("enterApiKey"), "error");
      return;
    }

    haptics.mediumTap();
    setIsLoading(true);

    try {
      const hoursPerDay = minutesPerDay / 60;
      const plan = await createStudyPlan(allTopics, daysAvailable, hoursPerDay);
      setResult(plan);

      addStudyPlan({
        id: Date.now().toString(),
        title: planName.trim() || `${allTopics.length} ${t("topics")} - ${daysAvailable} ${t("days")}`,
        topics: allTopics,
        daysAvailable,
        hoursPerDay,
        planDetails: plan,
        createdAt: new Date().toISOString(),
      });

      awardXP("study_plan");
      haptics.success();
    } catch (error: any) {
      toast.show(error.message || t("tryAgain"), "error");
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      haptics.success();
      toast.show(t("copied"), "success");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.container}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
      <Animated.View 
        entering={FadeInDown.delay(100).duration(600).springify()}
        style={styles.screenContent}
      >
        <Animated.View 
          entering={FadeInDown.delay(150).duration(500).springify()}
          style={styles.glassCard}
        >
          <BlurView intensity={15} tint="dark" style={styles.cardBlur}>
            <View style={styles.cardContent}>
              <ThemedText style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t("currentStudyPlans") || "Current Study Plans"}
              </ThemedText>
              
              <View style={styles.inputCapsule}>
                <TextInput
                  style={[
                    styles.planInput,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={t("enterPlanName") || "Enter plan name (e.g., Learn Programming)..."}
                  placeholderTextColor="rgba(142, 142, 147, 0.6)"
                  value={planName}
                  onChangeText={setPlanName}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.topicInputSection}>
                <View style={[styles.topicInputRow, isRTL && styles.rtl]}>
                  <View style={styles.topicInputCapsule}>
                    <TextInput
                      style={[
                        styles.topicInput,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                      placeholder={t("addTopic")}
                      placeholderTextColor="rgba(142, 142, 147, 0.6)"
                      value={newTopic}
                      onChangeText={setNewTopic}
                      onSubmitEditing={addTopic}
                      returnKeyType="done"
                    />
                  </View>
                  <AnimatedPressable
                    style={styles.addButton}
                    onPress={addTopic}
                  >
                    <LinearGradient
                      colors={["#7F00FF", "#0052D4"]}
                      style={styles.addButtonGradient}
                    >
                      <Feather name="plus" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </AnimatedPressable>
                </View>

                {topics.length > 0 && (
                  <Animated.View 
                    entering={FadeIn.duration(300)}
                    style={[styles.topicsContainer, isRTL && styles.rtl]}
                  >
                    {topics.map((topic, index) => (
                      <Animated.View
                        key={index}
                        entering={FadeIn.delay(index * 50).duration(200)}
                      >
                        <View style={styles.topicChip}>
                          <LinearGradient
                            colors={["rgba(127, 0, 255, 0.2)", "rgba(0, 82, 212, 0.2)"]}
                            style={styles.topicChipGradient}
                          >
                            <ThemedText style={styles.topicText}>{topic}</ThemedText>
                            <Pressable 
                              onPress={() => removeTopic(index)}
                              hitSlop={8}
                            >
                              <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
                            </Pressable>
                          </LinearGradient>
                        </View>
                      </Animated.View>
                    ))}
                  </Animated.View>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(250).duration(500).springify()}
          style={styles.glassCard}
        >
          <BlurView intensity={15} tint="dark" style={styles.cardBlur}>
            <View style={styles.cardContent}>
              <GlowingSlider
                value={daysAvailable}
                onValueChange={handleDaysChange}
                minimumValue={1}
                maximumValue={7}
                step={1}
                label={t("daysAvailable")}
                valueLabel={`${daysAvailable} ${t("days")}`}
              />
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(350).duration(500).springify()}
          style={styles.glassCard}
        >
          <BlurView intensity={15} tint="dark" style={styles.cardBlur}>
            <View style={styles.cardContent}>
              <View style={[styles.sliderHeader, isRTL && styles.rtl]}>
                <ThemedText style={styles.sliderLabel}>{t("minutesPerDay")}</ThemedText>
                <View style={[styles.neonBadgeRow, isRTL && styles.rtl]}>
                  <View style={[styles.neonBadge, { backgroundColor: minutesStyle.color + "25", borderColor: minutesStyle.color + "50" }]}>
                    <ThemedText style={[styles.neonBadgeText, { color: minutesStyle.color }]}>
                      {minutesStyle.label}
                    </ThemedText>
                  </View>
                  <Animated.Text style={[styles.minutesValue, { color: minutesStyle.color, textShadowColor: minutesStyle.color + "60" }]}>
                    {minutesPerDay} {t("minutes")}
                  </Animated.Text>
                </View>
              </View>
              <GlowingSlider
                value={minutesPerDay}
                onValueChange={handleMinutesChange}
                minimumValue={10}
                maximumValue={180}
                step={5}
                showValue={false}
                accentColor={minutesStyle.color}
                gradientColors={minutesStyle.gradient as [string, string]}
              />
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(450).duration(500).springify()}
          style={styles.glassCard}
        >
          <BlurView intensity={15} tint="dark" style={styles.cardBlur}>
            <View style={styles.cardContent}>
              <GlassDateChips
                selectedDays={selectedDays}
                onDayToggle={handleDayToggle}
                label={t("selectDays") || "Select Days"}
              />
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(500).duration(500).springify()}
          style={styles.statsCard}
        >
          <LinearGradient
            colors={["rgba(127, 0, 255, 0.15)", "rgba(0, 82, 212, 0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <View style={styles.statsIconContainer}>
                <Feather name="clock" size={24} color="#7F00FF" />
              </View>
              <ThemedText style={styles.statsText}>
                {t("totalMinutes")}: {totalMinutes} {t("minutes")}
              </ThemedText>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(550).duration(500).springify()}
          style={styles.progressSection}
        >
          <ProgressDashboard
            progress={mockProgress}
            totalMinutes={totalMinutes}
            daysRemaining={daysAvailable}
            label={t("planProgress") || "Plan Completion"}
          />
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(600).duration(500).springify()}
        >
          <GlassPrimaryButton
            title={t("createPlan")}
            onPress={handleGenerate}
            icon="calendar"
            disabled={isLoading}
            isLoading={isLoading}
          />
        </Animated.View>

        {result && (
          <Animated.View 
            entering={FadeInDown.delay(100).duration(500).springify()}
            style={styles.resultCard}
          >
            <BlurView intensity={15} tint="dark" style={styles.resultBlur}>
              <View style={styles.resultContent}>
                <View style={[styles.resultHeader, isRTL && styles.rtl]}>
                  <ThemedText style={styles.resultTitle}>{t("result")}</ThemedText>
                  <AnimatedPressable
                    style={styles.copyButton}
                    onPress={handleCopy}
                  >
                    <Feather name="copy" size={18} color="#7F00FF" />
                    <ThemedText style={styles.copyText}>{t("copy")}</ThemedText>
                  </AnimatedPressable>
                </View>
                <View style={styles.resultTextContainer}>
                  <ThemedText style={[styles.resultText, isRTL && styles.rtlText]}>
                    {result}
                  </ThemedText>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    gap: Spacing.lg,
  },
  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  cardBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.lg,
  },
  rtlText: {
    textAlign: "right",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  inputCapsule: {
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: Spacing.lg,
  },
  planInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: 16,
    color: "#FFFFFF",
  },
  topicInputSection: {
    gap: Spacing.md,
  },
  topicInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  topicInputCapsule: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  topicInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: 16,
    color: "#FFFFFF",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#7F00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  topicChip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  topicChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(127, 0, 255, 0.3)",
  },
  topicText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  statsCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  statsGradient: {
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(127, 0, 255, 0.2)",
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(127, 0, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  resultCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: Spacing.lg,
  },
  resultBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  resultContent: {
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: "rgba(127, 0, 255, 0.15)",
    gap: Spacing.xs,
  },
  copyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7F00FF",
  },
  resultTextContainer: {
    padding: Spacing.lg,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  resultText: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255, 255, 255, 0.85)",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  neonBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  neonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  neonBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  minutesValue: {
    fontSize: 18,
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
