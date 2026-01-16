# Daheeh (دحيح) - Smart Study Assistant

## Overview

Daheeh is an AI-powered educational mobile application designed to help students transform study materials into concise summaries, practice questions, concept explanations, and personalized study plans. Built with React Native (Expo), it supports multi-provider AI with automatic fallback and offers full bilingual functionality (English/Arabic) including RTL layout support. The project aims to provide an intuitive and efficient learning experience, enhancing comprehension and study effectiveness.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 (native stack, bottom tabs)
- **State Management**: React Context API for global state, TanStack React Query for server state
- **Styling**: StyleSheet API with themed components (light/dark mode support)
- **Animations**: React Native Reanimated
- **Local Storage**: AsyncStorage
- **UI/UX Decisions**:
    - **Navigation**: Wide elegant capsule dock (70px height, 95% width centered, bottom: 25) with deepest dark glass rgba(15,15,20,0.96), dynamic theme-colored glow for active icons (matches user's selected accent color), metallic gray (#636366) for inactive. Icons perfectly vertically centered.
    - **Input/Chat**: Dark capsule UI for input bars and chat bubbles, featuring glassmorphism effects, frost borders, and gradient elements.
    - **Buttons**: Themed gradient buttons with enhanced glow effects.
    - **Typography**: Cairo_700Bold for all Arabic text, Poppins for English, with automatic language-based selection.
    - **Accessibility**: Increased touch targets for buttons, haptic feedback system.
    - **Theming**: Centralized theme constants for colors, spacing, and typography.

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for PostgreSQL
- **Schema**: `shared/schema.ts` for database models
- **API Pattern**: RESTful endpoints prefixed with `/api`

### Key Design Patterns
- **Path Aliases**: `@/` for client, `@shared/` for shared code.
- **Screen Structure**: Safe area and header height awareness.
- **Component Pattern**: Themed components (`ThemedText`, `ThemedView`) for adaptive styling.

### Motion System (Global Motion Engine)
- **Framework**: React Native Reanimated (UI Thread animations for 60fps/120fps)
- **Entrance Animation Formula**: `FadeInDown.delay(X).springify().damping(12).mass(0.8)`
  - `springify()`: Removes robotic linear feel
  - `damping(12)`: Controls bounciness (classy, not cartoonish)
  - `mass(0.8)`: Makes elements feel lightweight and snappy
- **Staggered Cascade**: Elements flow in with delays (100ms, 200ms, 300ms, etc.)
- **Performance Rule**: Never use React Native's standard `Animated` API for entrance animations. Use Reanimated as it runs on the UI Thread (Native Thread) for zero lag.

### Haptic Feedback System
- **Location**: `client/utils/haptics.ts`
- **Available Functions**:
  - `lightTap()`: Light impact for buttons/taps
  - `mediumTap()`: Medium impact for primary actions
  - `heavyTap()`: Heavy impact for significant actions
  - `selection()`: Selection feedback for sliders/pickers (mechanical gear feel)
  - `success()`: Success notification (Quiz score >= 50%)
  - `error()`: Error notification (Quiz score < 50%)
  - `warning()`: Warning notification
- **Implementation**:
  - GlassButton: `lightTap()` on press
  - GlassPrimaryButton: `mediumTap()` on press
  - Tab Bar: `selection()` on tab switch
  - Choice Chips: `selection()` on toggle
  - Sliders: `selection()` on value change
  - Quiz Results: Dynamic `success()`/`error()` based on score percentage

### Core Features
1.  **Text Summarization**: Converts texts to summaries with adjustable complexity.
2.  **Question Generation**: Creates MCQ, True/False, and short answer questions.
3.  **Concept Explanation**: Provides explanations at various difficulty levels.
4.  **Study Planning**: Generates personalized study schedules.
5.  **Library**: Manages saved summaries, questions, and study plans; supports collections.
6.  **Progress Tracking**: Tracks study metrics and history.
7.  **Authentication**: Local, offline-first email/password authentication with SHA256 hashing, Google Sign-In (expo-auth-session), and guest mode.
8.  **Conversational AI**: Chat-style interface with follow-up questions and message history.
9.  **Multimodal Vision**: Direct image analysis - AI models analyze images directly without OCR preprocessing for better accuracy.
10. **Gamification System**: XP/leveling/streaks/ranks to motivate consistent study habits.

### Gamification System
- **Location**: `client/contexts/GamificationContext.tsx`
- **Components**: 
  - `XPToast.tsx`: Animated reward feedback overlay
  - `LevelCard.tsx`: Animated progress display with Reanimated
- **Level Formula**: `Level = Math.floor(xp / 500) + 1`
- **Rank Tiers**:
  - **Novice** (مبتدئ): Levels 1-4, color: #8E8E93, icon: star
  - **Scholar** (مجتهد): Levels 5-9, color: #10B981, icon: award
  - **Elite** (متفوق): Levels 10-19, color: #7209B7, icon: zap
  - **Daheeh** (دحيح 🤓): Level 20+, color: #F59E0B, icon: crown
- **XP Rewards**:
  - Summary creation: +50 XP
  - Quiz correct answer: +20 XP per question
  - Study plan creation: +100 XP
  - Explanation: +30 XP
- **Streak Tracking**: Daily streak increments on consecutive days of study activity
- **Persistence**: All XP, streak, and lastActiveDate stored in AsyncStorage
- **UI Integration**:
  - HomeScreen: LevelCard hero display with animated progress bar
  - ProfileScreen: Rank badge section with XP progress
  - XPToast: Overlay appears on XP awards with haptic feedback
- **Haptic Feedback**: `success()` on level up, `lightTap()` on XP awards

### AI Integration
- **Multi-provider Architecture**: Automatic fallback between Replit OpenAI, Google Gemini, and DeepSeek.
- **Endpoints**: Dedicated API endpoints for summarization, questions, explanation, study planning.
- **Vision Mode**: All AI endpoints (summarize, questions, explain) accept base64 images for direct multimodal analysis.
- **Image UX**: ImagePreviewList shows scanning state with blur overlay, loading indicator, and "Analyzing..." label during vision processing.

## External Dependencies

### AI Services
- **Replit OpenAI**: Primary built-in AI provider.
- **Google Gemini API**: User-provided API key for fallback.
- **DeepSeek API**: User-provided API key for tertiary fallback.

### Database
- **PostgreSQL**: Used with Drizzle ORM for data persistence.
- **Drizzle Kit**: For database migrations.

### Mobile Platform Services
- **Expo**: Utilized for core mobile functionalities (splash screen, blur, haptics, image handling, etc.).
- **React Native Gesture Handler**: For advanced touch interactions.
- **React Native Reanimated**: For UI animations.
- **React Native Screens**: For native screen management.

### Storage
- **AsyncStorage**: Client-side storage for user data, preferences, API keys, and cached study content.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `EXPO_PUBLIC_DOMAIN`: Domain for API communication (must include https:// prefix).
- `REPLIT_DEV_DOMAIN`: Development domain.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: Google OAuth Android client ID (for APK builds).
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: Google OAuth iOS client ID.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Google OAuth Web client ID.

## Mobile Development (Expo Dev Client)

**IMPORTANT: This project uses Expo Dev Client, NOT Expo Go.**

### Why Expo Dev Client?
- Full native module support (custom native code)
- Live UI updates via Fast Refresh without rebuilding APK
- Better debugging capabilities
- Production-like environment during development

### Initial Setup (One-time)

#### Step 1: Build the Dev Client APK
You need an Expo account to build the APK. Run these commands in the Shell:

```bash
# Login to Expo (required for cloud builds)
npx eas login

# Build the development APK (cloud build)
npx eas build --profile development --platform android
```

The build takes ~10-15 minutes. Download the APK from the provided URL and install it on your Android device.

#### Step 2: Enable USB Debugging
On your Android device:
1. Go to Settings → About Phone → Tap "Build Number" 7 times
2. Go to Settings → Developer Options → Enable "USB Debugging"
3. Enable "Install via USB" if available

### Daily Development Workflow

#### Starting the Dev Server
Run in terminal:
```bash
EXPO_PUBLIC_DOMAIN=https://$REPLIT_DEV_DOMAIN npx expo start --dev-client --tunnel
```

This starts Metro with:
- **Dev Client mode**: Only your custom dev client APK can connect (not Expo Go)
- **Tunnel mode**: External devices can connect via ngrok
- **Fast Refresh**: UI changes appear instantly without rebuilding

#### Connecting Your Device
1. Open the Daheeh Dev Client app on your phone
2. Enter the Metro URL shown in terminal (e.g., `exp://xxxxx.ngrok-free.app:443`)
3. The app connects and loads with Fast Refresh enabled

### Live UI Updates
After the initial APK installation:
- **Code changes** → Auto-reload via Fast Refresh (instant)
- **Native module changes** → Requires new APK build (rare)
- **Config changes (app.json)** → May require `npx expo prebuild --platform android` then rebuild

### Current Development Setup
- **Backend Server**: Runs on port 5000 (serves API and web build)
- **Expo Metro Bundler**: Runs on port 8081 (serves native mobile bundles)
- **Tunnel Mode**: Required for mobile devices to connect to Replit
- **Node.js**: v22.17.0 (required for Metro bundler stability)

### Key Files
- `eas.json`: EAS Build configuration with development profile
- `android/`: Native Android project files (generated by prebuild)
- `app.json`: Includes `expo-dev-client` plugin

### Troubleshooting
- **"Unable to connect"**: Ensure Metro is running with `--dev-client` flag
- **Fast Refresh not working**: Shake device → Enable "Fast Refresh" in dev menu
- **Build fails**: Run `npx expo prebuild --platform android --clean` and retry
- **Icons don't show on web**: Check dist/index.html has Feather font-face declaration
- After `expo export`: Fonts must be manually re-added to dist/index.html