import React, { useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as haptics from "@/utils/haptics";
import { ThemedText } from "./ThemedText";
import { useLanguage } from "@/contexts/LanguageContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GlassDateChipsProps {
  selectedDays?: number[];
  onDayToggle?: (dayIndex: number) => void;
  label?: string;
}

export function GlassDateChips({
  selectedDays = [],
  onDayToggle,
  label,
}: GlassDateChipsProps) {
  const { t, isRTL } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  
  const today = new Date();
  const currentDayIndex = today.getDay();
  
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayIndex);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.getDate());
    }
    return dates;
  };
  
  const weekDates = getWeekDates();
  const displayDays = isRTL ? [...dayKeys].reverse() : dayKeys;
  const displayDates = isRTL ? [...weekDates].reverse() : weekDates;

  const handleDayPress = (index: number) => {
    const actualIndex = isRTL ? 6 - index : index;
    haptics.lightTap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onDayToggle?.(actualIndex);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[styles.label, isRTL && styles.labelRTL]}>
          {label}
        </ThemedText>
      )}
      
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isRTL && styles.scrollContentRTL,
        ]}
      >
        {displayDays.map((dayKey, index) => {
          const actualIndex = isRTL ? 6 - index : index;
          const isSelected = selectedDays.includes(actualIndex);
          const isToday = actualIndex === currentDayIndex;
          
          return (
            <DayChip
              key={dayKey}
              dayName={t(dayKey)}
              dayNumber={displayDates[index]}
              isSelected={isSelected}
              isToday={isToday}
              onPress={() => handleDayPress(index)}
              delay={index * 50}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface DayChipProps {
  dayName: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  delay: number;
}

function DayChip({ 
  dayName, 
  dayNumber, 
  isSelected, 
  isToday, 
  onPress,
  delay,
}: DayChipProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.05 : 1, { 
      damping: 10, 
      stiffness: 300,
      mass: 0.8,
    });
    onPress();
  };

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.05, { damping: 10, stiffness: 300 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }
  }, [isSelected]);

  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(300).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.chipPressable}
      >
        {isSelected ? (
          <LinearGradient
            colors={["#7F00FF", "#0052D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chip, styles.chipSelected]}
          >
            <ThemedText style={styles.dayNameSelected}>{dayName}</ThemedText>
            <ThemedText style={styles.dayNumberSelected}>{dayNumber}</ThemedText>
          </LinearGradient>
        ) : (
          <View style={[styles.chip, isToday && styles.chipToday]}>
            <ThemedText style={[styles.dayName, isToday && styles.dayNameToday]}>
              {dayName}
            </ThemedText>
            <ThemedText style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
              {dayNumber}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  labelRTL: {
    textAlign: "right",
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  scrollContentRTL: {
    flexDirection: "row-reverse",
  },
  chipPressable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  chip: {
    width: 52,
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 4,
  },
  chipSelected: {
    borderWidth: 0,
    shadowColor: "#7F00FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  chipToday: {
    borderColor: "rgba(127, 0, 255, 0.3)",
    backgroundColor: "rgba(127, 0, 255, 0.1)",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
  },
  dayNameSelected: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  dayNameToday: {
    color: "rgba(127, 0, 255, 0.8)",
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  dayNumberSelected: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dayNumberToday: {
    color: "#7F00FF",
  },
});
