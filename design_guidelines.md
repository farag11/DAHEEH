# Smart Study Assistant AI - Design Guidelines

## 1. Brand Identity

**Purpose**: An AI-powered educational companion that transforms complex study materials into digestible summaries, practice questions, and personalized study plans for students.

**Aesthetic Direction**: **Editorial/Academic Excellence** - Clean, organized, confidence-inspiring interface that feels like a premium digital textbook. Professional typography hierarchy, generous whitespace, and purposeful color accents that don't distract from learning content. The design should feel smart without being intimidating, approachable without being childish.

**Memorable Element**: The AI assistant is visualized through smooth, intelligent animations (shimmer effects during processing, confetti on achievements) that make AI interactions feel magical yet trustworthy.

**Bilingual Foundation**: Seamless Arabic/English switching with RTL/LTR layout support. Language toggle (🌐 icon) always visible in app bar. All text components must accommodate both languages gracefully.

## 2. Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)
- **Home** - Dashboard with feature cards
- **Library** - Saved summaries, questions, flashcards
- **Progress** - Analytics and study tracking
- **Profile** - Settings, language toggle, auth

**Auth Flow**:
- Required (social features, cloud sync, multi-device)
- SSO: Apple Sign-In (iOS), Google Sign-In (Android/iOS)
- Account management in Profile > Settings

## 3. Color Palette

**Light Theme**:
- Primary: `#4361EE` (Confident Blue)
- Secondary: `#3A0CA3` (Deep Purple)
- Background: `#F8F9FA` (Soft Gray)
- Surface: `#FFFFFF`
- Text Primary: `#212529`
- Text Secondary: `#6C757D`
- Accent: `#7209B7` (Purple accent for AI features)
- Success: `#28A745`
- Warning: `#FFC107`
- Error: `#DC3545`

**Dark Theme**:
- Primary: `#7209B7`
- Background: `#121212`
- Surface: `#1E1E1E`
- Text: `#FFFFFF` / `#E0E0E0`

## 4. Typography

- **Primary Font**: Poppins (English) - Modern, friendly, highly legible
- **Arabic Font**: Cairo - Pairs well with Poppins, maintains professional tone
- **Type Scale**:
  - Display Large: 32pt Bold (Screen titles)
  - Display Medium: 24pt SemiBold (Section headers)
  - Body Large: 18pt Regular (Content)
  - Body Medium: 16pt Regular (Secondary text)
  - Label: 14pt Medium (Buttons, tags)

## 5. Screen-by-Screen Specifications

### Home Screen
- **Header**: Transparent, no back button, language toggle (🌐) on right
- **Layout**: Scrollable
  - Welcome banner with user name + motivational quote
  - Quick actions (4 circular buttons: Summarize, Quiz, Explain, Upload)
  - Progress overview card (today's hours, streak, achievements)
  - Feature grid (2 columns, 8 cards with icons, titles, descriptions)
- **Safe Area**: Top: `insets.top + 16px`, Bottom: `tabBarHeight + 16px`
- **Empty State**: Not applicable (always shows features)

### Text Summarizer Screen
- **Header**: Default with back button (left), "Text Summarizer" title (center), Save/Copy/Share icons (right)
- **Layout**: Scrollable form
  - Complexity selector (chip filters: Simple, Detailed, Comprehensive)
  - Text input area (max 5000 chars, border radius 12px, character counter)
  - "Generate Summary" button (full width, primary color, 16px vertical padding)
  - Generated summary card (appears after generation with markdown support)
- **Safe Area**: Top: `16px`, Bottom: `tabBarHeight + 16px`
- **Loading State**: Shimmer effect on summary card placeholder

### Question Generator Screen
- **Header**: Default, "Practice Questions" title
- **Layout**: Scrollable form
  - Source text input OR "Load from Library" button
  - Question type selector (MCQ, Essay, True/False - multi-select chips)
  - Question count slider (5-20)
  - "Generate Questions" button
  - Questions list (cards with question, options, show/hide answer)
- **Safe Area**: Standard with tab bar
- **Empty State**: Illustration of thinking lightbulb, "No questions yet" message

### Library Screen
- **Header**: Default with search bar, filter icon (right)
- **Layout**: Tabbed list (Summaries, Questions, Flashcards)
  - Each item: Card with title, preview, date, favorite star
  - Swipe actions: Delete (red), Share (blue)
- **Safe Area**: Top: `headerHeight + 16px`, Bottom: `tabBarHeight + 16px`
- **Empty State**: Illustration per tab (empty-library.png), "Start creating content" CTA

### Study Planner Screen
- **Header**: Default, "Study Plan" title, Edit icon (right)
- **Layout**: Scrollable
  - Calendar overview (week view with colored dots for topics)
  - Daily task cards (expandable, checkboxes, time allocations)
  - Progress bar (percentage complete)
- **Safe Area**: Standard with tab bar
- **Floating Button**: "Create New Plan" (bottom right, elevated 16px from tab bar)

### Progress/Analytics Screen
- **Header**: Default, "My Progress" title
- **Layout**: Scrollable
  - Stats overview (3 cards: Study hours, Questions solved, Streak)
  - Line chart (study hours over time)
  - Performance breakdown (pie chart: subjects)
  - Achievement badges (horizontal scrollable list)
- **Safe Area**: Standard with tab bar
- **Empty State**: empty-progress.png, "Start studying to see stats"

### Profile Screen
- **Header**: Default, "Profile" title, Settings icon (right)
- **Layout**: Scrollable
  - Avatar (circular, 80px, editable)
  - Display name
  - Language toggle (Arabic/English with flag icons)
  - Theme toggle (Light/Dark)
  - Account section: Email, Sign out, Delete account
- **Safe Area**: Standard with tab bar

### Concept Explainer Screen
- **Header**: Default, "Explain Concept" title
- **Layout**: Scrollable form
  - Concept input field
  - Audience level selector (Beginner, Intermediate, Advanced - radio buttons)
  - "Get Explanation" button
  - Explanation card (markdown with headings, bullet points, examples highlighted)
- **Safe Area**: Standard with tab bar
- **Loading State**: Animated thinking dots

### File Upload Screen
- **Header**: Default, "Upload Material" title
- **Layout**: Scrollable
  - Drag-drop zone (dashed border, cloud upload icon)
  - File type indicators (PDF, PNG, JPG - icons with labels)
  - Upload button
  - Processing status (progress bar during OCR/extraction)
  - Extracted text preview (editable)
- **Safe Area**: Standard with tab bar
- **Empty State**: empty-upload.png, "Drag files or tap to browse"

## 6. Visual Design Principles

- **Touchables**: Subtle scale animation (0.95) on press, no drop shadows except floating buttons
- **Floating Buttons**: Shadow specs - `offset: (0, 2)`, `opacity: 0.10`, `radius: 2px`
- **Cards**: 16px border radius, 2px elevation, 8px vertical margin
- **Icons**: Feather icons from @expo/vector-icons, 24px standard size, primary color for active states
- **Inputs**: Filled style, 12px border radius, no border in default state, 2px primary border on focus
- **RTL Support**: All layouts must mirror for Arabic (flex-start becomes flex-end, left padding becomes right)

## 7. Assets to Generate

**Required**:
1. **icon.png** (1024×1024) - App icon: Graduation cap with AI spark, primary blue background - *Device home screen*
2. **splash-icon.png** (2048×2048) - Same as app icon - *Launch screen*
3. **empty-library.png** (300×300) - Open book with floating pages - *Library empty state*
4. **empty-questions.png** (300×300) - Lightbulb with question mark - *Questions empty state*
5. **empty-progress.png** (300×300) - Graph trending upward (minimal line art) - *Progress empty state*
6. **empty-upload.png** (300×300) - Cloud with upward arrow - *Upload empty state*
7. **avatar-preset-1.png** (200×200) - Geometric avatar (blue circle with white A) - *Default user avatar*
8. **onboarding-welcome.png** (600×400) - Student with laptop and AI assistant hologram - *Onboarding first screen*

**Recommended**:
9. **achievement-badge-1.png** through **achievement-badge-5.png** (100×100) - Badge designs for milestones - *Progress screen achievements*
10. **feature-ai-glow.png** (400×200) - Abstract AI neural network glow - *Home screen header decoration*

**Style**: Flat illustration style, limited color palette (primary blue, purple accents, white), simple geometric shapes, optimistic and encouraging tone. Avoid clipart aesthetics - aim for sophisticated educational design.