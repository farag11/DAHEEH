import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = "en" | "ar";

type Translations = {
  [key: string]: {
    en: string;
    ar: string;
  };
};

const translations: Translations = {
  appName: { en: "Daheeh", ar: "دحيح" },
  home: { en: "Home", ar: "الرئيسية" },
  library: { en: "Library", ar: "المكتبة" },
  progress: { en: "Progress", ar: "التقدم" },
  profile: { en: "Profile", ar: "الملف الشخصي" },
  welcomeBack: { en: "Welcome Back", ar: "يا اهلا وسهلا" },
  readyToStudy: { en: "Ready to achieve your goals today?", ar: "مستعد لتحقيق أهدافك اليوم؟" },
  readyToAchieve: { en: "Ready to achieve your goals today?", ar: "مستعد لتحقيق أهدافك اليوم؟" },
  dayStreak: { en: "Day Streak", ar: "أيام متتالية" },
  quickActions: { en: "Command Center", ar: "مركز القيادة" },
  allFeatures: { en: "All Features", ar: "جميع الميزات" },
  summarize: { en: "Summarize", ar: "تلخيص" },
  summarizeDesc: { en: "Turn any text into a clear, easy-to-understand summary", ar: "حوّل النصوص الطويلة إلى ملخصات واضحة وسهلة الفهم" },
  quiz: { en: "Quiz", ar: "اختبار" },
  quizDesc: { en: "Create smart practice questions to test yourself", ar: "اختبر معلوماتك بأسئلة ذكية ومتنوعة" },
  explain: { en: "Explain", ar: "شرح" },
  explainDesc: { en: "Get any concept explained in a way you'll actually understand", ar: "اشرح أي مفهوم بأسلوب بسيط وواضح" },
  plan: { en: "Plan", ar: "خطة" },
  planDesc: { en: "Build a study schedule that fits your time", ar: "أنشئ خطة دراسية تناسب وقتك وأهدافك" },
  textSummarizer: { en: "Text Summarizer", ar: "ملخص النصوص" },
  questionGenerator: { en: "Question Generator", ar: "مولد الأسئلة" },
  conceptExplainer: { en: "Concept Explainer", ar: "شارح المفاهيم" },
  studyPlanner: { en: "Study Planner", ar: "مخطط الدراسة" },
  enterText: { en: "Enter your text here...", ar: "أدخل النص هنا..." },
  generate: { en: "Generate", ar: "توليد" },
  generateSummary: { en: "Generate Summary", ar: "توليد الملخص" },
  generateQuestions: { en: "Generate Questions", ar: "توليد الأسئلة" },
  getExplanation: { en: "Get Explanation", ar: "احصل على الشرح" },
  createPlan: { en: "Create Plan", ar: "إنشاء الخطة" },
  complexity: { en: "Complexity", ar: "مستوى التفصيل" },
  simple: { en: "Simple", ar: "بسيط" },
  detailed: { en: "Detailed", ar: "مفصل" },
  comprehensive: { en: "Comprehensive", ar: "شامل" },
  questionType: { en: "Question Type", ar: "نوع السؤال" },
  multipleChoice: { en: "Multiple Choice", ar: "اختيار من متعدد" },
  trueFalse: { en: "True/False", ar: "صح/خطأ" },
  shortAnswer: { en: "Short Answer", ar: "إجابة قصيرة" },
  numberOfQuestions: { en: "Number of Questions", ar: "عدد الأسئلة" },
  audienceLevel: { en: "Student Level", ar: "مستوى الطالب" },
  beginner: { en: "Easy Mode", ar: "مبتدئ" },
  intermediate: { en: "Getting There", ar: "متوسط" },
  advanced: { en: "Genius Level", ar: "متقدم" },
  concept: { en: "Concept", ar: "المفهوم" },
  enterConcept: { en: "Enter the concept to explain...", ar: "أدخل المفهوم للشرح..." },
  topics: { en: "Topics", ar: "المواضيع" },
  addTopic: { en: "Add Topic", ar: "إضافة موضوع" },
  daysAvailable: { en: "Days Available", ar: "الأيام المتاحة" },
  hoursPerDay: { en: "Hours Per Day", ar: "ساعات في اليوم" },
  result: { en: "Result", ar: "النتيجة" },
  copy: { en: "Copy", ar: "نسخ" },
  save: { en: "Save", ar: "حفظ" },
  share: { en: "Share", ar: "مشاركة" },
  copied: { en: "Copied to clipboard", ar: "تم النسخ" },
  saved: { en: "Saved successfully", ar: "تم الحفظ بنجاح" },
  error: { en: "Something went wrong", ar: "حدث خطأ ما" },
  tryAgain: { en: "Try Again", ar: "حاول مرة أخرى" },
  noSummaries: { en: "No summaries yet", ar: "لا توجد ملخصات بعد" },
  noQuestions: { en: "No questions yet", ar: "لا توجد أسئلة بعد" },
  noPlans: { en: "No study plans yet", ar: "لا توجد خطط دراسة بعد" },
  startCreating: { en: "Start creating content!", ar: "ابدأ بإنشاء المحتوى!" },
  summaries: { en: "Summaries", ar: "الملخصات" },
  questions: { en: "Questions", ar: "الأسئلة" },
  plans: { en: "Plans", ar: "الخطط" },
  todayStudy: { en: "Today's Study", ar: "دراسة اليوم" },
  streak: { en: "Day Streak", ar: "أيام متتالية" },
  totalHours: { en: "Total Hours", ar: "إجمالي الساعات" },
  questionsAnswered: { en: "Questions Answered", ar: "الأسئلة المجابة" },
  settings: { en: "Settings", ar: "الإعدادات" },
  language: { en: "Language", ar: "اللغة" },
  theme: { en: "Theme", ar: "المظهر" },
  dark: { en: "Dark", ar: "داكن" },
  light: { en: "Light", ar: "فاتح" },
  about: { en: "About", ar: "حول" },
  version: { en: "Version", ar: "الإصدار" },
  showAnswer: { en: "Show Answer", ar: "إظهار الإجابة" },
  hideAnswer: { en: "Hide Answer", ar: "إخفاء الإجابة" },
  correct: { en: "Correct!", ar: "صحيح!" },
  incorrect: { en: "Incorrect", ar: "خاطئ" },
  next: { en: "Next", ar: "التالي" },
  previous: { en: "Previous", ar: "السابق" },
  finish: { en: "Finish", ar: "إنهاء" },
  delete: { en: "Delete", ar: "حذف" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  confirm: { en: "Confirm", ar: "تأكيد" },
  characters: { en: "characters", ar: "حرف" },
  noDataYet: { en: "No data yet", ar: "لا توجد بيانات بعد" },
  startStudying: { en: "Start studying to track your progress", ar: "ابدأ الدراسة لتتبع تقدمك" },
  apiKeyRequired: { en: "API Key Required", ar: "مفتاح API مطلوب" },
  enterApiKey: { en: "Enter your Gemini API key in settings", ar: "أدخل مفتاح Gemini في الإعدادات" },
  apiKey: { en: "API Key", ar: "مفتاح API" },
  geminiApiKey: { en: "Gemini API Key", ar: "مفتاح Gemini API" },
  saveApiKey: { en: "Save API Key", ar: "حفظ المفتاح" },
  apiKeySaved: { en: "API key saved successfully", ar: "تم حفظ المفتاح بنجاح" },
  processing: { en: "Processing...", ar: "جاري المعالجة..." },
  clearAll: { en: "Clear All", ar: "مسح الكل" },
  createdAt: { en: "Created", ar: "تم الإنشاء" },
  day: { en: "day", ar: "يوم" },
  days: { en: "days", ar: "أيام" },
  hour: { en: "hour", ar: "ساعة" },
  hours: { en: "hours", ar: "ساعات" },
  advancedSettings: { en: "Advanced Settings", ar: "الإعدادات المتقدمة" },
  aiProviders: { en: "AI Providers", ar: "مزودي الذكاء الاصطناعي" },
  builtIn: { en: "Built-in (Free)", ar: "مدمج (مجاني)" },
  gemini: { en: "Google Gemini", ar: "جوجل جيميني" },
  deepseek: { en: "DeepSeek", ar: "ديب سيك" },
  providerPriority: { en: "Provider Priority", ar: "أولوية المزود" },
  dragToReorder: { en: "Tap to set priority", ar: "اضغط لتحديد الأولوية" },
  apiKeys: { en: "API Keys", ar: "مفاتيح API" },
  geminiKey: { en: "Gemini API Key", ar: "مفتاح جيميني" },
  deepseekKey: { en: "DeepSeek API Key", ar: "مفتاح ديب سيك" },
  enterGeminiKey: { en: "Enter Gemini API key...", ar: "أدخل مفتاح جيميني..." },
  enterDeepseekKey: { en: "Enter DeepSeek API key...", ar: "أدخل مفتاح ديب سيك..." },
  appearance: { en: "Appearance", ar: "المظهر" },
  colorTheme: { en: "Color Theme", ar: "لون التصميم" },
  purple: { en: "Purple", ar: "بنفسجي" },
  orange: { en: "Orange", ar: "برتقالي" },
  gray: { en: "Gray", ar: "رمادي" },
  pink: { en: "Pink", ar: "وردي" },
  blue: { en: "Blue", ar: "أزرق" },
  primary: { en: "Primary", ar: "أساسي" },
  secondary: { en: "Secondary", ar: "ثانوي" },
  tertiary: { en: "Tertiary", ar: "ثالث" },
  active: { en: "Active", ar: "نشط" },
  configured: { en: "Configured", ar: "تم التكوين" },
  notConfigured: { en: "Not Configured", ar: "غير مكون" },
  setPriority: { en: "Set as Priority", ar: "تعيين كأولوية" },
  currentPriority: { en: "Current Priority", ar: "الأولوية الحالية" },
  orUploadImages: { en: "Or upload images", ar: "أو ارفع صور" },
  failedToProcessImage: { en: "Failed to process image", ar: "فشل في معالجة الصورة" },
  noImagesSelected: { en: "No images selected", ar: "لم يتم اختيار صور" },
  ok: { en: "OK", ar: "حسناً" },
  provideStudyText: { en: "Please enter text or upload an image", ar: "يرجى إدخال نص أو رفع صورة" },
  noTextExtracted: { en: "Could not extract text from images. Please try different images or add text manually.", ar: "لم يتم استخراج نص من الصور. يرجى تجربة صور مختلفة أو إضافة نص يدويًا." },
  builtInFree: { en: "Built-in (Free)", ar: "مدمج (مجاني)" },
  useCustomKey: { en: "Use My Key", ar: "استخدم مفتاحي" },
  usingBuiltIn: { en: "Using built-in", ar: "يستخدم المدمج" },
  usingCustomKey: { en: "Using custom key", ar: "يستخدم مفتاح مخصص" },
  keyConfigured: { en: "Key configured", ar: "تم تكوين المفتاح" },
  noKeyConfigured: { en: "No key configured", ar: "لم يتم تكوين المفتاح" },
  enableCustomKey: { en: "Enable custom key", ar: "تفعيل المفتاح المخصص" },
  optional: { en: "Optional", ar: "اختياري" },
  allProvidersFree: { en: "All AI providers are free to use! Optionally add your own API keys for priority access.", ar: "جميع مزودي الذكاء الاصطناعي مجانية! اختياريًا أضف مفاتيحك للوصول ذي الأولوية." },
  openai: { en: "OpenAI", ar: "أوبن إيه آي" },
  claude: { en: "Claude", ar: "كلود" },
  mistral: { en: "Mistral AI", ar: "ميسترال إيه آي" },
  grok: { en: "Grok", ar: "جروك" },
  cohere: { en: "Cohere", ar: "كوهير" },
  anthropic: { en: "Anthropic", ar: "أنثروبيك" },
  selectProvider: { en: "Select AI Provider", ar: "اختر مزود الذكاء الاصطناعي" },
  enterApiKeyFor: { en: "Enter API key for", ar: "أدخل مفتاح API لـ" },
  configureApiKey: { en: "Configure API Key", ar: "تكوين مفتاح API" },
  selectToConfigureKey: { en: "Select a provider to configure API key", ar: "اختر مزودًا لتكوين مفتاح API" },
  noProviderSelected: { en: "No provider selected", ar: "لم يتم اختيار مزود" },
  tapToSelect: { en: "Tap to select", ar: "اضغط للاختيار" },
  providerApiKey: { en: "API Key", ar: "مفتاح API" },
  done: { en: "Done", ar: "تم" },
  studyHistory: { en: "Study History", ar: "تاريخ الدراسة" },
  noHistoryYet: { en: "No study history yet", ar: "لا يوجد تاريخ دراسة بعد" },
  startStudyingHistory: { en: "Start summarizing, creating quizzes, or exploring concepts to see your history here", ar: "ابدأ بالتلخيص أو إنشاء اختبارات أو استكشاف المفاهيم لرؤية تاريخك هنا" },
  summarized: { en: "Summarized", ar: "تم تلخيص" },
  quizCreated: { en: "Quiz Created", ar: "تم إنشاء اختبار" },
  explained: { en: "Explained", ar: "تم شرح" },
  planCreated: { en: "Plan Created", ar: "تم إنشاء خطة" },
  justNow: { en: "Just now", ar: "الآن" },
  minutesAgo: { en: "min ago", ar: "دقيقة مضت" },
  hoursAgo: { en: "hours ago", ar: "ساعات مضت" },
  daysAgo: { en: "days ago", ar: "أيام مضت" },
  login: { en: "Login", ar: "تسجيل الدخول" },
  signup: { en: "Sign Up", ar: "إنشاء حساب" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  confirmPassword: { en: "Confirm Password", ar: "تأكيد كلمة المرور" },
  continueAsGuest: { en: "Continue as Guest", ar: "المتابعة كزائر" },
  orContinueWith: { en: "Or continue with", ar: "أو تابع مع" },
  signInWithGoogle: { en: "Google", ar: "جوجل" },
  createAccount: { en: "Create Account", ar: "إنشاء حساب" },
  alreadyHaveAccount: { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  dontHaveAccount: { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  getStarted: { en: "Get Started", ar: "ابدأ الآن" },
  passwordMinLength: { en: "Password must be at least 6 characters", ar: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
  passwordRequired: { en: "Password is required", ar: "كلمة المرور مطلوبة" },
  passwordsDoNotMatch: { en: "Passwords do not match", ar: "كلمات المرور غير متطابقة" },
  invalidEmail: { en: "Invalid email address", ar: "البريد الإلكتروني غير صالح" },
  accountExists: { en: "This account already exists. Please login instead.", ar: "هذا الحساب موجود بالفعل. يرجى تسجيل الدخول بدلاً من ذلك." },
  accountNotFound: { en: "Account not found. Please sign up first.", ar: "الحساب غير موجود، يرجى التسجيل أولاً." },
  wrongPassword: { en: "Incorrect password. Please try again.", ar: "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى." },
  signupFailed: { en: "Sign up failed. Please try again.", ar: "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى." },
  loginFailed: { en: "Login failed. Please try again.", ar: "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى." },
  googleClientIdRequired: { en: "Google sign-in is not configured", ar: "تسجيل الدخول بجوجل غير مهيأ" },
  loginCancelled: { en: "Login was cancelled", ar: "تم إلغاء تسجيل الدخول" },
  googleAuthFailed: { en: "Google sign-in failed. Please try again.", ar: "فشل تسجيل الدخول بجوجل. يرجى المحاولة مرة أخرى." },
  guestMode: { en: "Guest Mode", ar: "وضع الزائر" },
  guestModeNote: { en: "Some features like image analysis are disabled in guest mode", ar: "بعض الميزات مثل تحليل الصور معطلة في وضع الزائر" },
  logout: { en: "Logout", ar: "تسجيل الخروج" },
  confirmLogout: { en: "Are you sure you want to logout?", ar: "هل أنت متأكد من رغبتك في تسجيل الخروج؟" },
  account: { en: "Account", ar: "الحساب" },
  wrong: { en: "Wrong", ar: "خطأ" },
  answered: { en: "Answered", ar: "تمت الإجابة" },
  generateMore: { en: "Generate More Questions", ar: "توليد المزيد من الأسئلة" },
  reviewComplete: { en: "I've Reviewed - Continue", ar: "راجعت - استمر" },
  startNewQuiz: { en: "Start New Quiz", ar: "بدء اختبار جديد" },
  reviewFirst: { en: "Please review your answers first", ar: "يرجى مراجعة إجاباتك أولاً" },
  correctAnswer: { en: "Correct Answer", ar: "الإجابة الصحيحة" },
  yourAnswer: { en: "Your Answer", ar: "إجابتك" },
  typeAnswer: { en: "Type your answer...", ar: "اكتب إجابتك..." },
  extractingText: { en: "Extracting text from images", ar: "جاري استخراج النص من الصور" },
  analyzing: { en: "Analyzing...", ar: "جاري التحليل..." },
  totalHoursStudy: { en: "Total Hours", ar: "إجمالي الساعات" },
  minutesPerDay: { en: "Minutes Per Day", ar: "دقائق في اليوم" },
  minutes: { en: "min", ar: "دقيقة" },
  totalMinutes: { en: "Total Minutes", ar: "إجمالي الدقائق" },
  thisWeek: { en: "This Week", ar: "هذا الأسبوع" },
  sun: { en: "Sun", ar: "ح" },
  mon: { en: "Mon", ar: "ن" },
  tue: { en: "Tue", ar: "ث" },
  wed: { en: "Wed", ar: "ر" },
  thu: { en: "Thu", ar: "خ" },
  fri: { en: "Fri", ar: "ج" },
  sat: { en: "Sat", ar: "س" },
  summarizeNow: { en: "Summarize Now", ar: "لخص الآن" },
  createQuiz: { en: "Create Quiz", ar: "إنشاء اختبار" },
  testMe: { en: "Test Me on This", ar: "اختبرني في هذا النص" },
  createPlanNow: { en: "Create Plan", ar: "إنشاء خطة" },
  newSummary: { en: "New Summary", ar: "ملخص جديد" },
  images: { en: "images", ar: "صور" },
  newExplanation: { en: "New Explanation", ar: "شرح جديد" },
  clearHistory: { en: "Clear History", ar: "مسح السجل" },
  clearHistoryConfirm: { en: "Are you sure you want to clear all study history? This cannot be undone.", ar: "هل أنت متأكد من مسح سجل الدراسة؟ لا يمكن التراجع عن هذا." },
  clearDataConfirm: { en: "Are you sure you want to clear all data? This will delete all summaries, questions, and study plans.", ar: "هل أنت متأكد من مسح جميع البيانات؟ سيؤدي هذا إلى حذف جميع الملخصات والأسئلة والخطط الدراسية." },
  askFollowUp: { en: "Ask follow-up...", ar: "استفسر أكثر..." },
  apiKeySecured: { en: "Key secured", ar: "المفتاح محمي" },
  keysConfigured: { en: "keys active", ar: "مفاتيح مُفعّلة" },
  canGenerateMore: { en: "You can generate more questions after finishing these", ar: "يمكنك توليد أسئلة إضافية بعد الانتهاء من هذه" },
  score: { en: "Score", ar: "النتيجة" },
  total: { en: "Total", ar: "الإجمالي" },
  continueLearning: { en: "Continue Learning", ar: "متابعة التعلم" },
  newExam: { en: "New Exam", ar: "اختبار جديد" },
  reviewAnswers: { en: "Review Answers", ar: "مراجعة الإجابات" },
  viewResults: { en: "View Results", ar: "عرض النتائج" },
  collections: { en: "Collections", ar: "المجموعات" },
  collection: { en: "collection", ar: "مجموعة" },
  newCollection: { en: "New Collection", ar: "مجموعة جديدة" },
  collectionName: { en: "Collection Name", ar: "اسم المجموعة" },
  collectionDescription: { en: "Description (optional)", ar: "الوصف (اختياري)" },
  addToCollection: { en: "Add to Collection", ar: "إضافة إلى مجموعة" },
  removeFromCollection: { en: "Remove from Collection", ar: "إزالة من المجموعة" },
  noCollections: { en: "No collections yet", ar: "لا توجد مجموعات بعد" },
  createCollection: { en: "Create Collection", ar: "إنشاء مجموعة" },
  deleteCollection: { en: "Delete Collection", ar: "حذف المجموعة" },
  collectionCreated: { en: "Collection created", ar: "تم إنشاء المجموعة" },
  itemAdded: { en: "Item added to collection", ar: "تمت الإضافة إلى المجموعة" },
  itemRemoved: { en: "Item removed from collection", ar: "تمت الإزالة من المجموعة" },
  items: { en: "items", ar: "عناصر" },
  selectColor: { en: "Select Color", ar: "اختر اللون" },
  collectionItems: { en: "Collection Items", ar: "عناصر المجموعة" },
  emptyCollection: { en: "This collection is empty", ar: "هذه المجموعة فارغة" },
  addItemsToCollection: { en: "Add items from your library", ar: "أضف عناصر من مكتبتك" },
  pasteImage: { en: "Paste Image", ar: "لصق صورة" },
  noImageInClipboard: { en: "No image found in clipboard", ar: "لا توجد صورة في الحافظة" },
  imagePasted: { en: "Image pasted successfully", ar: "تم لصق الصورة بنجاح" },
  imageDetected: { en: "Image Detected", ar: "صورة مكتشفة" },
  currentStudyPlans: { en: "Current Study Plans", ar: "الخطط الدراسية الحالية" },
  enterPlanName: { en: "Enter plan name (e.g., Learn Programming)...", ar: "أدخل اسم الخطة (مثال: تعلم البرمجة)..." },
  selectDays: { en: "Select Days", ar: "اختر الأيام" },
  planProgress: { en: "Plan Completion", ar: "نسبة إنجاز الخطة" },
  processingImages: { en: "Processing images...", ar: "جاري معالجة الصور..." },
  searchHistory: { en: "Search your history...", ar: "ابحث في سجلك الدراسي..." },
  all: { en: "All", ar: "الكل" },
  explanations: { en: "Explanations", ar: "شروحات" },
  quizzes: { en: "Quizzes", ar: "اختبارات" },
  noResultsFound: { en: "No results found", ar: "لا توجد نتائج" },
  tryDifferentSearch: { en: "Try a different search term", ar: "جرب كلمة بحث مختلفة" },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === "ar" || savedLanguage === "en") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error("Error loading language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      I18nManager.forceRTL(lang === "ar");
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  const isRTL = language === "ar";

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
