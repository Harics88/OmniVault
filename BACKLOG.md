# MyTasker/OmniVault - Development Backlog

**Last Updated:** 2026-01-11  
**Status:** Post-Validation Audit

This document tracks all pending features, bugs, and improvements identified during the code validation against ANALYSIS.md.

---

## 🔴 HIGH PRIORITY ITEMS

### 🐛 Bugs to Fix

#### 1. Complete Tag System Integration
**Status:** Completed ✅ (2026-01-28)
**Severity:** Medium  
**Effort:** Medium (2-3 days)

**Problem:**
- Tag model and backend endpoints exist
- But Notes still use comma-separated string tags (`models.py:197`)
- No UI to assign tags to tasks/notes
- Tag relationships not exposed in schemas
- No filtering/searching by tags

**Action Items:**
- [x] Update `NoteResponse` schema to include `tags_rel` relationship
- [x] Add `tags` field to `TaskResponse` schema
- [x] Create TagSelector component for Task/Note editors
- [x] Add tag filtering to Tasks views (tag_id parameter)
- [x] Add tag management endpoints (add/remove tags)
- [x] Backend schema updates complete
- [x] Tag relationships properly exposed
- [x] Remove general tagging while preserving vault tags (2026-01-28)

**✅ COMPLETED:** 2026-01-28

**Files Modified:**
- `backend/app/schemas.py` - Added TagRead, TagCreate, TagUpdate schemas; updated TaskResponse and NoteResponse
- `backend/app/routers/tasks.py` - Added tag loading, tag_id filter, add_tag and remove_tag endpoints
- `frontend/src/components/TagSelector.tsx` - NEW - Tag selection dropdown component
- `frontend/src/components/TagManager.tsx` - DELETED

---


---

### 🚀 High Priority Features

#### 3. Task Dependencies (Blocking/Blocked By)
**Status:** Not Started  
**Severity:** High - Critical for DE workflows  
**Effort:** Large (1 week)

**Requirements:**
- Tasks should be able to block other tasks
- Visual indication of dependencies
- Prevent marking task as "Done" if blocked by incomplete tasks
- Dependency graph visualization

**Action Items:**
- [ ] Add `task_dependencies` association table to models
- [ ] Add `blocking_tasks` and `blocked_by_tasks` relationships to Task model
- [ ] Create endpoints: GET/POST/DELETE task dependencies
- [ ] Add dependency UI to TaskPanel/TaskPopout
- [ ] Add visual indicator for blocked tasks (⛔ icon)
- [ ] Implement validation logic (can't complete if blocked)
- [ ] Create optional dependency graph visualization component
- [ ] Add dependency info to task response schema

**Files to Create/Modify:**
- `backend/app/models.py` - Add association table
- `backend/app/schemas.py` - Add dependency fields
- `backend/app/routers/tasks.py` - Add dependency endpoints
- `frontend/src/components/TaskDependencies.tsx` - NEW
- `frontend/src/pages/TaskPopout.tsx` - Integrate dependencies UI
- `frontend/src/components/DependencyGraph.tsx` - NEW (optional)

---

#### 4. Command Palette Enhancement
**Status:** Search exists, commands missing  
**Severity:** High - Great UX improvement  
**Effort:** Medium (3-4 days)

**Requirements:**
- Enhance existing Ctrl+K search to support command mode
- Type `>` to enter command mode
- Quick actions: Create Task, Toggle Theme, Go to Settings, etc.
- Keyboard-driven navigation

**Action Items:**
- [x] Update global search component to detect `>` prefix
- [x] Create command registry/config
- [x] Implement command execution system
- [x] Add these commands:
  - [x] `> Create Task` → Open task creation modal
  - [x] `> Create Note` → Open note creation
  - [x] `> Toggle Theme` → Switch dark/light mode
  - [x] `> Go to Settings` → Navigate to settings
  - [x] `> Export Data` → Trigger export
  - [x] `> Toggle Personal Mode` → Enable/disable personal tasks
- [x] Add fuzzy matching for commands (built into cmdk)
- [x] Show recent commands
- [x] Add keyboard shortcut help (`?` key)

**✅ COMPLETED:** 2026-01-11

**Files Modified:**
- `frontend/src/components/CommandPalette.tsx` - Enhanced with command mode and search integration
- `frontend/src/pages/Shortcuts.tsx` - Updated with comprehensive shortcut documentation

---

## 🟡 MEDIUM PRIORITY ITEMS

### 🎨 UI/UX Improvements

#### 5. Dark/Light Theme Toggle
**Status:** Not Implemented  
**Severity:** Medium - Accessibility  
**Effort:** Medium (2 days)

**Problem:**
- App is hardcoded to dark theme
- No light mode option
- CSS variables exist but no toggle mechanism

**Action Items:**
- [ ] Create ThemeContext with React Context API
- [ ] Add theme state management (dark/light/auto)
- [ ] Create theme toggle component (sun/moon icons)
- [ ] Add toggle to Settings page
- [ ] Store theme preference in localStorage
- [ ] Update CSS variables for light theme
- [ ] Test all components in both themes
- [ ] Add system preference detection (prefers-color-scheme)

**Files to Modify:**
- `frontend/src/contexts/ThemeContext.tsx` - NEW
- `frontend/src/App.tsx` - Wrap with ThemeProvider
- `frontend/src/pages/Settings.tsx` - Add theme toggle
- `frontend/src/index.css` - Add light theme variables
- `frontend/src/components/ThemeToggle.tsx` - NEW

---

#### 6. Collapsible Sidebar
**Status:** Not Implemented  
**Severity:** Medium  
**Effort:** Small (1 day)

**Problem:**
- Sidebar is fixed width (`w-60`)
- No way to collapse to icons-only mode
- Wastes screen space on smaller displays

**Action Items:**
- [x] Add sidebar collapse state management
- [x] Create collapse/expand button (chevron icons)
- [x] Update sidebar to icons-only when collapsed (w-16 vs w-60)
- [x] Add tooltips to icons when collapsed (title attributes)
- [x] Animate transition (CSS transition-all duration-300)
- [x] Store collapse preference in localStorage
- [x] Main content auto-adjusts (flex-1)
- [x] Add keyboard shortcut (Ctrl+B)

**✅ COMPLETED:** 2026-01-11

**Files Modified:**
- `frontend/src/components/Sidebar.tsx` - Complete rewrite with collapse functionality

---

#### 7. Activity Heatmap
**Status:** Not Implemented  
**Severity:** Medium - Engagement feature  
**Effort:** Medium (2 days)

**Requirements:**
- GitHub-style contribution graph
- Show last 365 days of activity
- Count: tasks completed, logs written, snippets created
- Display on Dashboard or Profile page

**Action Items:**
- [ ] Install `react-calendar-heatmap` library
- [ ] Create backend endpoint `/api/stats/activity-heatmap`
- [ ] Aggregate daily activity counts
- [ ] Create ActivityHeatmap component
- [ ] Add to Dashboard page
- [ ] Add tooltip showing daily breakdown
- [ ] Add color intensity based on activity level
- [ ] Make date range configurable

**Files to Create/Modify:**
- `backend/app/routers/system.py` - Add heatmap endpoint
- `frontend/src/components/ActivityHeatmap.tsx` - NEW
- `frontend/src/pages/Home.tsx` - Add heatmap widget
- `frontend/package.json` - Add react-calendar-heatmap

---

#### 8. Customizable Dashboard Widgets
**Status:** Completed ✅ (2026-01-19)
**Severity:** Medium - Personalization
**Effort:** Large (1 week)

**Requirements:**
- Allow users to toggle widget visibility
- Drag-and-drop reordering
- Persist layout preferences
- Responsive grid system

**Action Items:**
- [x] Install react-grid-layout or similar library
- [x] Create widget configuration system
- [x] Add widget visibility toggles in Settings
- [x] Implement drag-and-drop reordering
- [x] Store layout config in localStorage or user settings
- [x] Create default layouts (preset configurations)
- [x] Add "Reset to Default" button
- [x] Make widgets responsive to grid changes

**✅ COMPLETED:** 2026-01-19

**Files Modified:**
- `frontend/src/pages/Home.tsx` - Implement grid layout with react-beautiful-dnd
- `frontend/src/pages/Settings.tsx` - Add widget settings
- `frontend/src/utils/widgetConfig.ts` - NEW - Configuration utility

---

### 🔧 Code Quality Improvements

#### 9. Reduce Component Duplication
**Status:** ✅ COMPLETED  
**Severity:** Medium - Technical Debt  
**Effort:** Medium (2 days)

**Problem:**
- TaskPanel and TaskPopout have duplicate logic
- Same task editing logic in two places
- Hard to maintain consistency

**Action Items:**
- [x] Extract shared task editing logic into custom hook
- [x] Create `useTaskEditor` hook
- [x] Refactor TaskPanel to use hook
- [x] Refactor TaskPopout to use hook
- [x] Extract common UI components
- [x] Add JSDoc comments to shared logic
- [ ] Write unit tests for hook

**✅ COMPLETED:** 2026-01-28

**Files Modified:**
- `frontend/src/hooks/useTaskEditor.ts` - NEW - Custom hook with JSDoc documentation
- `frontend/src/components/TaskPanel.tsx` - Refactored to use hook
- `frontend/src/pages/TaskPopout.tsx` - Refactored to use hook

**Summary:**
Created `useTaskEditor` hook that encapsulates:
- Edit mode state management
- Local edited task state
- All field change handlers (title, description, status, priority, dates, personal toggle)
- Save/cancel logic with change detection
- Subtask synchronization
- Date refs for date picker inputs

---

#### 10. Centralize Magic Strings
**Status:** Scattered throughout codebase  
**Severity:** Low - Code quality  
**Effort:** Small (4 hours)

**Problem:**
- localStorage keys are hardcoded strings
- API endpoints hardcoded
- No constants file

**Action Items:**
- [ ] Create constants file for localStorage keys
- [ ] Create constants file for API endpoints
- [ ] Create constants file for UI text/labels
- [ ] Replace all hardcoded strings with constants
- [ ] Add TypeScript enums where appropriate

**Files to Create:**
- `frontend/src/constants/storageKeys.ts` - NEW
- `frontend/src/constants/apiEndpoints.ts` - NEW
- `frontend/src/constants/uiText.ts` - NEW
- Update all components to use constants

---

#### 11. Add Frontend TypeScript Interfaces
**Status:** Missing  
**Severity:** Medium - Type safety  
**Effort:** Small (1 day)

**Problem:**
- No TypeScript interfaces matching backend schemas
- Relying on `any` or inferred types
- Potential type mismatches

**Action Items:**
- [ ] Create TypeScript interfaces for all models
- [ ] Match backend Pydantic schemas
- [ ] Add to types directory
- [ ] Update API service to use proper types
- [ ] Enable strict TypeScript mode
- [ ] Fix any type errors

**Files to Create:**
- `frontend/src/types/task.ts` - NEW
- `frontend/src/types/note.ts` - NEW
- `frontend/src/types/snippet.ts` - NEW
- `frontend/src/types/habit.ts` - NEW
- `frontend/src/types/tag.ts` - NEW
- `frontend/src/types/api.ts` - NEW

---

## 🟢 LOW PRIORITY ITEMS

### 🎯 Nice-to-Have Features

#### 12. Smart Paste & Deep Linking
**Status:** Not Implemented  
**Severity:** Low  
**Effort:** Large (2 weeks)

**Requirements:**
- Preserve hyperlinks when pasting from external apps
- Register custom protocol (`omnivault://`)
- Handle deep links to specific notes/tasks
- Single-instance app handling

**Action Items:**
- [x] Implement custom paste handler in RichTextEditor
- [x] Parse HTML clipboard content
- [x] Register protocol handler (Windows Registry/macOS plist) - *Pending OS integration*
- [x] Implement selection-based Bubble Menu (2026-01-28)
- [x] Fix slash command shortcut conflict (2026-01-28)
- [ ] Update app launcher to parse arguments
- [ ] Implement single-instance mechanism
- [ ] Add protocol link generation in UI
- [ ] Test with Outlook, Lotus Notes, etc.

**Files to Modify:**
- `frontend/src/components/RichTextEditor.tsx`
- `backend/app_webview.py` (if exists)
- Platform-specific registration scripts

---

#### 13. Data Lineage Visualization
**Status:** Not Implemented  
**Severity:** Low - Advanced feature  
**Effort:** Large (2 weeks)

**Requirements:**
- Visual graph of entity relationships
- Show tasks → notes → snippets connections
- Interactive graph navigation
- Export graph as image

**Action Items:**
- [ ] Install react-force-graph or reactflow
- [ ] Create backend endpoint to extract entity graph
- [ ] Build graph from relationships (tasks-notes, daily logs, etc.)
- [ ] Create Graph visualization component
- [ ] Add filtering options (by type, date range)
- [ ] Add zoom/pan controls
- [ ] Add click to navigate to entity
- [ ] Add export to PNG/SVG

**Files to Create:**
- `backend/app/routers/graph.py` - NEW
- `frontend/src/pages/DataLineage.tsx` - NEW
- `frontend/src/components/EntityGraph.tsx` - NEW

---

**✅ COMPLETED:** 2026-01-28

**Files Modified:**
- `frontend/src/components/PomodoroTimer.tsx` - Enhanced with session tracking, stats, and auto-switching
- `frontend/src/components/Layout.tsx` - Integrated as floating widget

---

### 📱 Responsive Design

#### 15. Mobile Responsiveness
**Status:** Needs Review  
**Severity:** Medium  
**Effort:** Medium (3-4 days)

**Problem:**
- TaskTableView likely unusable on mobile
- Fixed layouts don't adapt to small screens
- No mobile-specific navigation

**Action Items:**
- [ ] Audit all pages on mobile viewport
- [ ] Create card-based view for tasks (mobile)
- [ ] Add responsive breakpoints throughout
- [ ] Implement mobile navigation (bottom nav bar?)
- [ ] Test on actual mobile devices
- [ ] Add touch-friendly controls
- [ ] Optimize performance for mobile

**Files to Modify:**
- `frontend/src/components/TaskTableView.tsx`
- `frontend/src/components/TaskCardView.tsx` - NEW
- `frontend/src/components/Layout.tsx`

---

#### 16. Resizable Table Columns
**Status:** Not Implemented  
**Severity:** Low  
**Effort:** Small (1 day)

**Problem:**
- TaskTableView uses fixed column widths
- Can't resize to see more of long text

**Action Items:**
- [ ] Install react-resizable or similar library
- [ ] Add resize handles to table headers
- [ ] Store column widths in localStorage
- [ ] Add double-click to auto-fit
- [ ] Ensure minimum column widths

**Files to Modify:**
- `frontend/src/components/TaskTableView.tsx`

---

## 🧪 TESTING & QUALITY ASSURANCE

### 17. Add Unit Tests
**Status:** No tests found  
**Severity:** Medium  
**Effort:** Large (ongoing)

**Action Items:**
- [ ] Set up pytest for backend
- [ ] Set up Jest/Vitest for frontend
- [ ] Write tests for critical backend routers:
  - [ ] Tasks CRUD operations
  - [ ] Habit toggle logic
  - [ ] Tag management
  - [ ] Data export/import
- [ ] Write tests for frontend components:
  - [ ] TaskPanel editing logic
  - [ ] HabitTracker toggle
  - [ ] TagManager CRUD
- [ ] Set up CI/CD to run tests
- [ ] Aim for >70% code coverage

**Files to Create:**
- `backend/tests/test_tasks.py`
- `backend/tests/test_habits.py`
- `backend/tests/test_tags.py`
- `backend/tests/test_data.py`
- `frontend/src/__tests__/TaskPanel.test.tsx`
- `frontend/src/__tests__/HabitTracker.test.tsx`

---

### 18. Add Integration Tests
**Status:** Not Implemented  
**Severity:** Low  
**Effort:** Medium

**Action Items:**
- [ ] Set up Playwright or Cypress
- [ ] Write E2E tests for critical flows:
  - [ ] Create and complete task
  - [ ] Toggle habit completion
  - [ ] Export and import data
  - [ ] Search functionality
  - [ ] Create and edit note
- [ ] Add to CI/CD pipeline

**Files to Create:**
- `e2e/tests/tasks.spec.ts`
- `e2e/tests/habits.spec.ts`
- `e2e/tests/data-backup.spec.ts`

---

## 📚 DOCUMENTATION

### 19. API Documentation
**Status:** Minimal  
**Severity:** Low  
**Effort:** Small (1 day)

**Action Items:**
- [ ] Enhance FastAPI docstrings
- [ ] Add request/response examples
- [ ] Document all query parameters
- [ ] Generate OpenAPI documentation
- [ ] Host interactive API docs (Swagger UI already available)
- [ ] Add authentication section (if adding auth)

---

### 20. User Documentation
**Status:** Basic README only  
**Severity:** Low  
**Effort:** Medium

**Action Items:**
- [ ] Create user guide
- [ ] Add screenshots/GIFs
- [ ] Document keyboard shortcuts
- [ ] Create tutorial videos (optional)
- [ ] Add FAQ section
- [ ] Document backup/restore process
- [ ] Add troubleshooting guide

**Files to Create:**
- `docs/USER_GUIDE.md`
- `docs/KEYBOARD_SHORTCUTS.md`
- `docs/FAQ.md`
- `docs/TROUBLESHOOTING.md`

---

### 21. Developer Documentation
**Status:** Minimal  
**Severity:** Low  
**Effort:** Small

**Action Items:**
- [ ] Document project structure
- [ ] Add architecture overview
- [ ] Document database schema
- [ ] Add contribution guidelines
- [ ] Document development setup
- [ ] Add code style guide

**Files to Create:**
- `docs/ARCHITECTURE.md`
- `docs/CONTRIBUTING.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/DEVELOPMENT.md`

---

## 🔐 SECURITY & PERFORMANCE

### 22. Security Audit
**Status:** Not Done  
**Severity:** Medium  
**Effort:** Small (1 day)

**Action Items:**
- [ ] Review CORS configuration
- [ ] Add input validation/sanitization
- [ ] Check for SQL injection vulnerabilities (using ORM helps)
- [ ] Review file upload security (import feature)
- [ ] Add rate limiting (if exposing publicly)
- [ ] Security headers (CSP, X-Frame-Options, etc.)

---

### 23. Performance Optimization
**Status:** Not Measured  
**Severity:** Low  
**Effort:** Medium

**Action Items:**
- [ ] Add database indexes for common queries
- [ ] Measure page load times
- [ ] Optimize large list rendering (virtualization)
- [ ] Add pagination to task/note lists
- [ ] Lazy load components
- [ ] Optimize bundle size
- [ ] Add caching where appropriate

---

## 📊 PROGRESS TRACKING

### Feature Completion Status
- ✅ Implemented: 4 features (36%)
- ⚠️ Partial: 2 features (18%)
- ❌ Not Started: 17 items (46%)

### Priority Distribution
- 🔴 High Priority: 4 items
- 🟡 Medium Priority: 11 items
- 🟢 Low Priority: 8 items

### Estimated Total Effort
- **High Priority:** ~3-4 weeks
- **Medium Priority:** ~6-8 weeks
- **Low Priority:** ~4-6 weeks
- **Testing/Docs:** ~2-3 weeks

**Total:** ~15-21 weeks (3.75-5.25 months) for complete backlog

---

## 🎯 RECOMMENDED SPRINT PLAN

### Sprint 1 (Week 1-2): Critical Bugs & High Priority
- [ ] Complete tag system integration
- [ ] Add task dependencies
- [ ] Fix habit toggle edge case
- [ ] Add unit tests for new features

### Sprint 2 (Week 3-4): UX Improvements
- [ ] Enhance command palette
- [ ] Add dark/light theme toggle
- [ ] Implement collapsible sidebar
- [ ] Improve mobile responsiveness

### Sprint 3 (Week 5-6): Engagement Features
- [ ] Activity heatmap
- [ ] Customizable dashboard widgets
- [ ] Add integration tests
- [ ] Performance optimization

### Sprint 4+: Nice-to-Have Features
- Smart paste & deep linking
- Data lineage visualization
- Pomodoro timer
- Advanced features as needed

---

## 📝 NOTES

- This backlog is based on the validation audit completed on 2026-01-11
- Items are prioritized based on user value and technical dependencies
- Effort estimates are rough and may need refinement
- New items should be added as they're discovered
- Completed items should be marked with ✅ and dated

**Last Reviewed:** 2026-01-11  
**Next Review:** TBD
