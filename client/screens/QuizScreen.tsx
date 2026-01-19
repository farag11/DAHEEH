import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Easing,
} from "react-native";
import ReanimatedAnimated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@/components/Header";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as haptics from "@/utils/haptics";
import Slider from "@react-native-community/slider";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudy } from "@/contexts/StudyContext";
import { useGamification } from "@/contexts/GamificationContext";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { generateQuestions, hasApiKey, QuestionType, GeneratedQuestion } from "@/services/aiService";
import { useImageInput } from "@/hooks/useImageInput";
import { ImageActionBar } from "@/components/ImageActionBar";
import { ImagePreviewList } from "@/components/ImagePreviewList";
import { ClipboardImageBadge } from "@/components/ClipboardImageBadge";
import { GlassButton, GlassPrimaryButton } from "@/components/GlassButton";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Normalize Arabic text: remove diacritics, normalize Alef variants, trim, lowercase
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Alef variants (أ إ آ ٱ) to ا
    .replace(/[أإآٱ]/g, "ا")
    // Normalize Taa Marbuta to Haa
    .replace(/ة/g, "ه")
    // Normalize Alef Maksura to Yaa
    .replace(/ى/g, "ي")
    // Remove extra whitespace
    .replace(/\s+/g, " ");
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if answer is correct with fuzzy matching
function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);
  
  // Exact match after normalization
  if (normalizedUser === normalizedCorrect) return true;
  
  // Allow tolerance based on word length (1-2 character difference)
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  const tolerance = maxLength <= 5 ? 1 : 2;
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  
  return distance <= tolerance;
}

type QuizScreenRouteProp = RouteProp<HomeStackParamList, "Quiz">;

type QuizPhase = "input" | "quiz";

function CircularProgress({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayPercentage(Math.round(value));
    });

    return () => animatedValue.removeListener(listener);
  }, [percentage]);

  const getColor = () => {
    if (percentage >= 80) return "#34C759";
    if (percentage >= 60) return "#FF9500";
    if (percentage >= 40) return "#FFD60A";
    return "#FF3B30";
  };

  const progressColor = getColor();
  const progressOffset = circumference - (displayPercentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: "rgba(255, 255, 255, 0.1)",
      }} />
      
      <View style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: progressColor,
        borderLeftColor: displayPercentage > 75 ? progressColor : "transparent",
        borderBottomColor: displayPercentage > 50 ? progressColor : "transparent",
        borderRightColor: displayPercentage > 25 ? progressColor : "transparent",
        borderTopColor: progressColor,
        transform: [{ rotate: "-90deg" }],
        opacity: displayPercentage > 0 ? 1 : 0,
      }} />
      
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.04)"]}
        style={{
          position: "absolute",
          width: size - strokeWidth * 2 - 8,
          height: size - strokeWidth * 2 - 8,
          borderRadius: (size - strokeWidth * 2 - 8) / 2,
        }}
      />
      
      <View style={{ alignItems: "center" }}>
        <ThemedText style={{
          fontSize: size * 0.32,
          fontWeight: "800",
          color: progressColor,
          textShadowColor: progressColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 15,
          letterSpacing: -1,
        }}>
          {displayPercentage}%
        </ThemedText>
      </View>
    </View>
  );
}

function InlineScoreCard({ 
  visible, 
  correctCount, 
  wrongCount, 
  totalQuestions,
  percentage,
  isRTL,
  onContinueLearning,
  onNewExam,
  onReviewAnswers,
  isLoading,
  t,
}: {
  visible: boolean;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  percentage: number;
  isRTL: boolean;
  onContinueLearning: () => void;
  onNewExam: () => void;
  onReviewAnswers: () => void;
  isLoading: boolean;
  t: (key: string) => string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const getMotivationalMessage = (): { text: string; icon: keyof typeof Feather.glyphMap } => {
    if (percentage >= 90) return { text: isRTL ? "أنت عبقري!" : "You're a genius!", icon: "award" };
    if (percentage >= 80) return { text: isRTL ? "أداء ممتاز!" : "Excellent performance!", icon: "star" };
    if (percentage >= 70) return { text: isRTL ? "عمل رائع!" : "Great job!", icon: "thumbs-up" };
    if (percentage >= 60) return { text: isRTL ? "جيد، استمر!" : "Good, keep going!", icon: "trending-up" };
    if (percentage >= 50) return { text: isRTL ? "تحتاج مراجعة" : "Needs review", icon: "book-open" };
    return { text: isRTL ? "حاول مرة أخرى" : "Try again", icon: "refresh-cw" };
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.scoreCardContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }
    ]}>
      <BlurView intensity={40} tint="dark" style={styles.scoreCardBlur}>
        <LinearGradient
          colors={["rgba(30, 30, 40, 0.95)", "rgba(20, 20, 30, 0.98)"]}
          style={styles.scoreCardGradient}
        >
          <View style={styles.scoreCardInnerGlow}>
            <ThemedText style={styles.scoreCardTitle}>
              {isRTL ? "نتيجتك" : "Your Score"}
            </ThemedText>
            
            <CircularProgress percentage={percentage} size={140} />
            
            <View style={styles.motivationalContainer}>
              <Feather name={getMotivationalMessage().icon} size={24} color="#FFFFFF" />
              <ThemedText style={styles.motivationalMessage}>
                {getMotivationalMessage().text}
              </ThemedText>
            </View>

            <ThemedText style={styles.scoreDetailText}>
              {isRTL 
                ? `أجبت على ${correctCount} من ${totalQuestions} أسئلة بشكل صحيح`
                : `You answered ${correctCount} out of ${totalQuestions} questions correctly`
              }
            </ThemedText>

            <View style={[styles.scoreStatsRow, isRTL && styles.rtl]}>
              <View style={styles.scoreStatItem}>
                <View style={[styles.scoreStatIcon, { backgroundColor: "rgba(52, 199, 89, 0.2)" }]}>
                  <Feather name="check-circle" size={20} color="#34C759" />
                </View>
                <ThemedText style={[styles.scoreStatValue, { color: "#34C759" }]}>
                  {correctCount}
                </ThemedText>
                <ThemedText style={styles.scoreStatLabel}>
                  {t("correct")}
                </ThemedText>
              </View>
              
              <View style={styles.scoreStatDivider} />
              
              <View style={styles.scoreStatItem}>
                <View style={[styles.scoreStatIcon, { backgroundColor: "rgba(255, 59, 48, 0.2)" }]}>
                  <Feather name="x-circle" size={20} color="#FF3B30" />
                </View>
                <ThemedText style={[styles.scoreStatValue, { color: "#FF3B30" }]}>
                  {wrongCount}
                </ThemedText>
                <ThemedText style={styles.scoreStatLabel}>
                  {t("wrong")}
                </ThemedText>
              </View>
              
              <View style={styles.scoreStatDivider} />
              
              <View style={styles.scoreStatItem}>
                <View style={[styles.scoreStatIcon, { backgroundColor: "rgba(99, 102, 241, 0.2)" }]}>
                  <Feather name="list" size={20} color="#6366F1" />
                </View>
                <ThemedText style={[styles.scoreStatValue, { color: "#6366F1" }]}>
                  {totalQuestions}
                </ThemedText>
                <ThemedText style={styles.scoreStatLabel}>
                  {t("total")}
                </ThemedText>
              </View>
            </View>

            <View style={styles.scoreActionsContainer}>
              <Pressable
                style={styles.continueButton}
                onPress={onContinueLearning}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#00C9A7", "#00B4D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Feather name="plus" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.continueButtonText}>
                        {isRTL ? "توليد أسئلة إضافية" : "Generate More Questions"}
                      </ThemedText>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={[styles.secondaryActionsRow, isRTL && styles.rtl]}>
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={onNewExam}
                >
                  <Feather name="edit-3" size={16} color="#FF9500" />
                  <ThemedText style={[styles.secondaryActionText, { color: "#FF9500" }]}>
                    {t("newExam")}
                  </ThemedText>
                </Pressable>
                
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={onReviewAnswers}
                >
                  <Feather name="eye" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.secondaryActionText}>
                    {t("reviewAnswers")}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const route = useRoute<QuizScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { addQuestions, incrementQuestionsAnswered } = useStudy();
  const { awardXP } = useGamification();
  const toast = useToast();
  const scrollViewRef = useRef<ScrollView>(null);

  const [text, setText] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["mcq"]);
  const [questionCount, setQuestionCount] = useState(25);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [lastSourceText, setLastSourceText] = useState("");
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("input");
  const [hasSourceText, setHasSourceText] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [shortAnswerInputs, setShortAnswerInputs] = useState<Map<number, string>>(new Map());
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [isSourceEditing, setIsSourceEditing] = useState(false);

  useEffect(() => {
    const sourceText = route.params?.sourceText;
    if (sourceText && sourceText.trim()) {
      setText(sourceText.trim());
      setHasSourceText(true);
      setIsSourceEditing(false); // Ensure read-only mode when source comes from params
    }
  }, [route.params]);

  const {
    images,
    isLoading: isImageLoading,
    takePhoto,
    pickFromGallery,
    pasteFromClipboard,
    removeImage,
    clearImages,
    getBase64Images,
    hasClipboardImage,
    checkClipboardForImage,
    pasteDetectedImage,
  } = useImageInput();

  const typeOptions: { key: QuestionType; label: string }[] = [
    { key: "mcq", label: t("multipleChoice") },
    { key: "trueFalse", label: t("trueFalse") },
    { key: "shortAnswer", label: t("shortAnswer") },
  ];

  const handlePasteImage = async () => {
    haptics.lightTap();
    const success = await pasteFromClipboard();
    if (success) {
      toast.show(t("imagePasted"), "success");
    } else {
      toast.show(t("noImageInClipboard"), "error");
    }
  };

  const toggleType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
    haptics.selection();
  };

  const handleGenerate = async (generateMore = false) => {
    if (!generateMore && !text.trim() && images.length === 0) {
      toast.show(t("provideStudyText"), "error");
      return;
    }

    const hasKey = await hasApiKey();
    if (!hasKey) {
      toast.show(t("enterApiKey"), "error");
      return;
    }

    if (generateMore) {
      setIsGeneratingMore(true);
    } else {
      setIsLoading(true);
      setQuestions([]);
      setSelectedAnswers(new Map());
      setAnsweredQuestions(new Set());
      setShowScoreCard(false);
    }
    haptics.mediumTap();

    try {
      let combinedText = generateMore ? lastSourceText : text.trim();
      const base64Images = (!generateMore && images.length > 0) ? getBase64Images() : undefined;

      if (base64Images) {
        setIsProcessingOCR(true);
      }

      if (!combinedText.trim() && !base64Images) {
        toast.show(t("noTextExtracted"), "error");
        setIsLoading(false);
        setIsGeneratingMore(false);
        return;
      }

      setLastSourceText(combinedText || "[Image Content]");
      
      // Combine source text with additional instructions if provided
      let promptText = combinedText || "";
      if (!generateMore && additionalInstructions.trim()) {
        promptText = `${combinedText}\n\n[Additional Instructions: ${additionalInstructions.trim()}]`;
      }
      
      const batchCount = generateMore ? 10 : questionCount;
      const generatedQuestions = await generateQuestions(promptText, questionTypes, batchCount, base64Images);
      setIsProcessingOCR(false);
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      if (generateMore) {
        setQuestions(prev => [...prev, ...generatedQuestions]);
        setShowScoreCard(false);
      } else {
        setQuestions(generatedQuestions);
      }

      const questionsToSave = generatedQuestions.map((q, index) => ({
        id: `${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        type: q.type,
        sourceText: combinedText.substring(0, 200),
        createdAt: new Date().toISOString(),
      }));
      addQuestions(questionsToSave);
      
      if (!generateMore) {
        clearImages();
        setText("");
        setQuizPhase("quiz");
      }

      haptics.success();
    } catch (error: any) {
      toast.show(error.message || t("tryAgain"), "error");
      haptics.error();
    } finally {
      setIsLoading(false);
      setIsGeneratingMore(false);
    }
  };

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    if (answeredQuestions.has(questionIndex)) return;
    
    const question = questions[questionIndex];
    // Use fuzzy matching for short answer, exact match for others
    const isCorrect = question?.type === "shortAnswer" 
      ? isAnswerCorrect(answer, question.correctAnswer)
      : answer === question?.correctAnswer;
    
    setSelectedAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(questionIndex, answer);
      return newMap;
    });
    
    setAnsweredQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(questionIndex);
      return newSet;
    });
    
    incrementQuestionsAnswered();
    
    if (isCorrect) {
      awardXP("quiz_correct");
    }
    
    haptics.lightTap();
  };

  const handleViewResults = () => {
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: "easeOut", property: "opacity" },
      update: { type: "easeOut" },
    });
    setShowScoreCard(true);
    
    if (scorePercentage >= 50) {
      haptics.success();
    } else {
      haptics.error();
    }
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleGenerateMore = () => {
    handleGenerate(true);
  };

  const handleContinueLearning = () => {
    setShowScoreCard(false);
    handleGenerate(true);
  };

  const handleNewExam = () => {
    setQuestions([]);
    setSelectedAnswers(new Map());
    setAnsweredQuestions(new Set());
    setText("");
    setLastSourceText("");
    setShowScoreCard(false);
    setQuizPhase("input");
  };

  const handleReviewAnswers = () => {
    setShowScoreCard(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const getOptionVariant = (questionIndex: number, option: string, correctAnswer: string): "option" | "selected" | "correct" | "incorrect" => {
    const isAnswered = answeredQuestions.has(questionIndex);
    const selectedAnswer = selectedAnswers.get(questionIndex);
    const isSelected = selectedAnswer === option;
    const isCorrect = option === correctAnswer;

    if (!isAnswered) {
      return "option";
    }

    if (isCorrect) {
      return "correct";
    }

    if (isSelected && !isCorrect) {
      return "incorrect";
    }

    return "option";
  };

  const renderQuestion = ({ item, index }: { item: GeneratedQuestion; index: number }) => {
    const isAnswered = answeredQuestions.has(index);
    const selectedAnswer = selectedAnswers.get(index);
    const isCorrect = selectedAnswer === item.correctAnswer;

    return (
      <View key={`question-${index}-${item.question.substring(0, 20)}`} style={[styles.questionCard, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.questionHeader, isRTL && styles.rtl]}>
          <View style={[styles.questionBadge, { backgroundColor: theme.accent + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: theme.accent }]}>
              Q{index + 1}
            </ThemedText>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              {item.type}
            </ThemedText>
          </View>
          {isAnswered ? (
            <View style={[styles.resultBadge, { backgroundColor: isCorrect ? theme.success + "20" : theme.error + "20" }]}>
              <Feather 
                name={isCorrect ? "check-circle" : "x-circle"} 
                size={14} 
                color={isCorrect ? theme.success : theme.error} 
              />
              <ThemedText style={[styles.badgeText, { color: isCorrect ? theme.success : theme.error, marginLeft: 4 }]}>
                {isCorrect ? t("correct") : t("wrong")}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText style={[styles.questionText, isRTL && styles.rtlText]}>
          {item.question}
        </ThemedText>

        {item.options.length > 0 ? (
          <View style={styles.optionsContainer}>
            {item.options.map((option, optIndex) => {
              const variant = getOptionVariant(index, option, item.correctAnswer);
              const letterPrefix = item.type !== "trueFalse" ? String.fromCharCode(65 + optIndex) : undefined;
              const showCheckIcon = isAnswered && option === item.correctAnswer;
              const showXIcon = isAnswered && selectedAnswers.get(index) === option && option !== item.correctAnswer;
              
              return (
                <GlassButton
                  key={`option-${index}-${optIndex}`}
                  title={option}
                  onPress={() => handleSelectAnswer(index, option)}
                  variant={variant}
                  letterPrefix={letterPrefix}
                  disabled={isAnswered}
                  icon={showCheckIcon ? "check" : showXIcon ? "x" : undefined}
                  iconPosition="right"
                  style={styles.glassOption}
                  textStyle={isRTL ? styles.rtlText : undefined}
                />
              );
            })}
          </View>
        ) : (
          <View style={[styles.shortAnswerContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.shortAnswerLabel, { color: theme.textSecondary }]}>
              {t("yourAnswer")}:
            </ThemedText>
            <TextInput
              style={[styles.shortAnswerInput, { color: theme.text, borderColor: theme.border }]}
              placeholder={t("typeAnswer")}
              placeholderTextColor={theme.textSecondary}
              value={shortAnswerInputs.get(index) || ""}
              onChangeText={(text) => {
                setShortAnswerInputs(prev => {
                  const newMap = new Map(prev);
                  newMap.set(index, text);
                  return newMap;
                });
              }}
              onSubmitEditing={() => {
                const answer = shortAnswerInputs.get(index) || "";
                if (answer.trim()) handleSelectAnswer(index, answer);
              }}
              editable={!isAnswered}
              returnKeyType="done"
            />
            {!isAnswered && (
              <Pressable
                style={[styles.checkAnswerButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const answer = shortAnswerInputs.get(index) || "";
                  if (answer.trim()) handleSelectAnswer(index, answer);
                }}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
                <ThemedText style={styles.checkAnswerText}>
                  {isRTL ? "تحقق" : "Check"}
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {isAnswered ? (
          <View style={[styles.answerContainer, { backgroundColor: isCorrect ? theme.success + "10" : theme.error + "10" }]}>
            <ThemedText style={[styles.answerLabel, { color: isCorrect ? theme.success : theme.error }]}>
              {t("correctAnswer")}: {item.correctAnswer}
            </ThemedText>
            <ThemedText style={[styles.explanation, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
              {item.explanation}
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  const allQuestionsAnswered = questions.length > 0 && answeredQuestions.size >= questions.length;
  const correctCount = Array.from(answeredQuestions).filter(i => 
    selectedAnswers.get(i) === questions[i]?.correctAnswer
  ).length;
  const wrongCount = answeredQuestions.size - correctCount;
  const scorePercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <KeyboardAwareScrollViewCompat
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {quizPhase === "input" ? (
        <>
          <ReanimatedAnimated.View entering={FadeInDown.delay(100).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <ThemedText style={[styles.label, isRTL && styles.rtlText]}>{t("questionType")}</ThemedText>
              <View style={[styles.chipsContainer, isRTL && styles.rtl]}>
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: questionTypes.includes(option.key)
                          ? theme.primary
                          : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => toggleType(option.key)}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        { color: questionTypes.includes(option.key) ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ReanimatedAnimated.View>

          <ReanimatedAnimated.View entering={FadeInDown.delay(200).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.sliderHeader, isRTL && styles.rtl]}>
                <ThemedText style={styles.label}>{t("numberOfQuestions")}</ThemedText>
                <ThemedText style={[styles.sliderValue, { color: theme.primary }]}>{questionCount}</ThemedText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={25}
                step={1}
                value={questionCount}
                onValueChange={(value) => {
                  if (value !== questionCount) {
                    haptics.selection();
                  }
                  setQuestionCount(value);
                }}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.backgroundSecondary}
                thumbTintColor={theme.primary}
              />
              <ThemedText style={[styles.helperText, { color: theme.textSecondary }, isRTL && styles.rtlText]}>
                {t("canGenerateMore")}
              </ThemedText>
            </View>
          </ReanimatedAnimated.View>

          <ReanimatedAnimated.View entering={FadeInDown.delay(300).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.sourceHeader, isRTL && styles.rtl]}>
                <ThemedText style={[styles.label, isRTL && styles.rtlText]}>
                  {isRTL ? "المحتوى المصدر" : "Source Context"}
                </ThemedText>
                {hasSourceText && !isSourceEditing && (
                  <Pressable
                    style={[styles.sourceEditButton, { backgroundColor: theme.primary + "20" }]}
                    onPress={() => setIsSourceEditing(true)}
                  >
                    <Feather name="edit-2" size={14} color={theme.primary} />
                    <ThemedText style={[styles.sourceEditButtonText, { color: theme.primary }]}>
                      {isRTL ? "تعديل" : "Edit"}
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              
              {hasSourceText && !isSourceEditing ? (
                <View style={[styles.sourcePreviewContainer, { backgroundColor: theme.inputBackground }]}>
                  <ThemedText 
                    style={[styles.sourcePreviewText, { color: theme.text }, isRTL && styles.rtlText]}
                    numberOfLines={isSourceExpanded ? undefined : 3}
                  >
                    {text}
                  </ThemedText>
                  {text.split('\n').length > 3 || text.length > 200 ? (
                    <Pressable
                      style={styles.expandButton}
                      onPress={() => setIsSourceExpanded(!isSourceExpanded)}
                    >
                      <ThemedText style={[styles.expandButtonText, { color: theme.primary }]}>
                        {isSourceExpanded 
                          ? (isRTL ? "إظهار أقل" : "Show Less")
                          : (isRTL ? "إظهار المزيد" : "Show More")
                        }
                      </ThemedText>
                      <Feather 
                        name={isSourceExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={theme.primary} 
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.textInputWrapper}>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    placeholder={isRTL ? "أدخل النص للاختبار..." : "Enter text to quiz..."}
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={6}
                    maxLength={3000}
                    value={text}
                    onChangeText={setText}
                    textAlignVertical="top"
                    onFocus={checkClipboardForImage}
                  />
                  <ClipboardImageBadge
                    visible={hasClipboardImage}
                    onPress={async () => {
                      const success = await pasteDetectedImage();
                      if (success) {
                        toast.show(t("imagePasted"), "success");
                      }
                    }}
                    isLoading={isImageLoading}
                  />
                </View>
              )}
              
              {isSourceEditing && (
                <Pressable
                  style={[styles.doneEditingButton, { backgroundColor: theme.success + "20" }]}
                  onPress={() => {
                    setIsSourceEditing(false);
                    if (text.trim()) setHasSourceText(true);
                  }}
                >
                  <Feather name="check" size={14} color={theme.success} />
                  <ThemedText style={[styles.sourceEditButtonText, { color: theme.success }]}>
                    {isRTL ? "تم" : "Done"}
                  </ThemedText>
                </Pressable>
              )}

              <View style={styles.imageSection}>
                <ImageActionBar
                  onCameraPress={takePhoto}
                  onGalleryPress={pickFromGallery}
                  disabled={isLoading || isProcessingOCR}
                  isLoading={isImageLoading}
                />
                <ImagePreviewList
                  images={images}
                  onRemove={removeImage}
                  isScanning={isProcessingOCR}
                  scanningText={t("analyzing")}
                />
              </View>
            </View>
          </ReanimatedAnimated.View>

          <ReanimatedAnimated.View entering={FadeInDown.delay(350).springify().damping(12).mass(0.8)}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <ThemedText style={[styles.label, isRTL && styles.rtlText]}>
                {isRTL ? "تعليمات إضافية (اختياري)" : "Additional Instructions (Optional)"}
              </ThemedText>
              <TextInput
                style={[
                  styles.instructionsInput,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={isRTL ? 'مثال: "ركز على التعريفات" أو "اجعلها صعبة"' : 'e.g. "Focus on definitions" or "Make it hard"'}
                placeholderTextColor={theme.textSecondary}
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                maxLength={200}
              />
            </View>
          </ReanimatedAnimated.View>

          {isProcessingOCR ? (
            <View style={[styles.ocrLoadingContainer, { backgroundColor: theme.cardBackground }]}>
              <ActivityIndicator color={theme.primary} />
              <ThemedText style={[styles.ocrLoadingText, { color: theme.textSecondary }]}>
                {t("extractingText")}...
              </ThemedText>
            </View>
          ) : null}

          <ReanimatedAnimated.View entering={FadeInDown.delay(400).springify().damping(12).mass(0.8)}>
            <GlassPrimaryButton
              title={t("generateQuestions")}
              onPress={() => handleGenerate(false)}
              icon="help-circle"
              disabled={isLoading}
              isLoading={isLoading}
            />
          </ReanimatedAnimated.View>
        </>
      ) : (
        <>
          <View style={[styles.statsCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                  {answeredQuestions.size}/{questions.length}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {t("answered")}
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.success }]}>
                  {correctCount}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {t("correct")}
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.error }]}>
                  {wrongCount}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {t("wrong")}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.questionsContainer}>
            {questions.map((item, index) => renderQuestion({ item, index }))}
          </View>

          {!showScoreCard ? (
            <View style={styles.buttonsContainer}>
              <Pressable
                style={styles.generateMoreButton}
                onPress={handleGenerateMore}
                disabled={isGeneratingMore}
              >
                <LinearGradient
                  colors={["#00C9A7", "#00B4D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateMoreGradient}
                >
                  {isGeneratingMore ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Feather name="plus" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.generateMoreText}>
                        {isRTL ? "توليد أسئلة إضافية" : "Generate More Questions"}
                      </ThemedText>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {allQuestionsAnswered ? (
                <GlassPrimaryButton
                  title={isRTL ? "إظهار النتيجة" : "View Results"}
                  onPress={handleViewResults}
                  icon="bar-chart-2"
                />
              ) : null}
            </View>
          ) : null}

          <InlineScoreCard
            visible={showScoreCard}
            correctCount={correctCount}
            wrongCount={wrongCount}
            totalQuestions={questions.length}
            percentage={scorePercentage}
            isRTL={isRTL}
            onContinueLearning={handleContinueLearning}
            onNewExam={handleNewExam}
            onReviewAnswers={handleReviewAnswers}
            isLoading={isGeneratingMore}
            t={t}
          />
        </>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  rtlText: {
    textAlign: "right",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  helperText: {
    fontSize: 13,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  textInputWrapper: {
    position: "relative",
  },
  textInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    minHeight: 150,
    fontSize: 16,
  },
  imageSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  ocrLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  ocrLoadingText: {
    fontSize: 14,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  questionsContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  questionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  questionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  glassOption: {
    marginBottom: Spacing.xs,
  },
  shortAnswerContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  shortAnswerLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  shortAnswerInput: {
    fontSize: 16,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    minHeight: 44,
  },
  checkAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
    gap: 6,
  },
  checkAnswerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  answerContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  generateMoreButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#00C9A7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  generateMoreGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 30,
    gap: Spacing.sm,
  },
  generateMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scoreCardContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  scoreCardBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  scoreCardGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  scoreCardInnerGlow: {
    padding: Spacing["2xl"],
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  scoreCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xl,
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  motivationalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  motivationalMessage: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.2)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreDetailText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  scoreStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  scoreStatItem: {
    alignItems: "center",
    flex: 1,
  },
  scoreStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  scoreStatValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  scoreStatLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  scoreStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scoreActionsContainer: {
    width: "100%",
    gap: Spacing.md,
  },
  continueButton: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#00C9A7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: 30,
    gap: Spacing.sm,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  sourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sourceEditButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  sourceEditButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  doneEditingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
    gap: 4,
  },
  sourcePreviewContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  sourcePreviewText: {
    fontSize: 14,
    lineHeight: 22,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  instructionsInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
  },
});
