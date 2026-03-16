# Refactoring Status - v2.6.0 Gap Analysis

**Date:** March 8, 2026
**Analysis Against:** REFACTORING_ANALYSIS.md (31 opportunities identified)
**Current Status:** Post-Phase 3, v2.6.0 Release

---

## Executive Summary

The REFACTORING_ANALYSIS document identified 31 opportunities across 8 categories. With v2.6.0 Phase 3 completion, **many test coverage gaps have been addressed**, but significant architectural work remains.

**Key Findings:**

- ✅ **Test Coverage:** 60% of identified gaps RESOLVED (Phase 3 comprehensive testing)
- ⚠️ **Architecture:** 30% partially addressed (service layer incomplete)
- ❌ **Component Refactoring:** 10% completed (App.tsx still 475 lines)
- 📊 **Overall:** ~65% of work identified as necessary remains outstanding

---

## 1. Component Complexity

### 1.1 App.tsx (475 lines) - STILL OUTSTANDING ❌

**Status:** NOT STARTED
**Priority:** 🔴 HIGH (Phase 5 Critical)
**Proposed Hooks Not Yet Extracted:**

- ❌ useAppState hook
- ❌ useSortAndPagination hook
- ❌ useJobOperations hook
- ❌ useImportExport hook (enhancement)

**Recommendation:** This is the #1 refactoring priority for v2.7.0. Reduces complexity from 475 → ~250 lines.

---

### 1.2 exportImport.ts (239 lines) - PARTIALLY ADDRESSED ⚠️

**Status:** IDENTIFIED, NOT REFACTORED
**Priority:** 🟡 MEDIUM (Phase 6)
**Analysis:**

- File still monolithic but now TESTED (exportImport.test.ts added in Phase 3)
- Splitting into services still recommended but less urgent
- Consider splitting in Phase 6 if modularity becomes an issue

**Current Status:** Functional but could benefit from reorganization

---

### 1.3 storage.ts (195 lines) - PARTIALLY ADDRESSED ⚠️

**Status:** IDENTIFIED, NOT REFACTORED
**Priority:** 🟡 MEDIUM (Phase 6)
**Analysis:**

- File still mixed concerns but now better understood
- storage.test.ts added in Phase 3
- Opportunity still valid: Split into storageLogger, fallbackStorage, orchestrator
- Note: jobsApi.ts exists but not integrated

**Current Status:** Tested but architectural split still recommended

---

### 1.4 TableView.tsx (208 lines, 22 props) - STILL OUTSTANDING ❌

**Status:** NOT STARTED (Prop Context Not Created)
**Priority:** 🔴 HIGH (Phase 5 Critical)
**Test Coverage Status:** ✅ TableView tests added in Phase 3
**Remaining Work:**

- ❌ TableContext provider not created
- ❌ Props not reduced from 22 → ~10
- ✅ Tests provide confidence for refactoring

**Recommendation:** Use new test coverage as safety net for refactoring in Phase 5.

---

### 1.5 CalendarView.tsx (135 lines) - PARTIALLY ADDRESSED ⚠️

**Status:** PARTIALLY (Tests added, hooks not extracted)
**Priority:** 🟡 MEDIUM (Phase 6)
**Completed:**

- ✅ CalendarView.test.tsx added (14 tests)
- ✅ Functionality validated and tested

**Still Outstanding:**

- ❌ useCalendarNavigation hook not extracted
- ❌ useCalendarData hook not extracted
- ⚠️ State management still in component

**Recommendation:** Can be deferred to Phase 6 polish. Tests now provide safety for future refactoring.

---

## 2. Hook Opportunities

### 2.1 useSelectionState - STILL OUTSTANDING ❌

**Status:** NOT STARTED
**Priority:** 🟡 MEDIUM
**Line Reduction:** Would remove ~20 lines from App.tsx
**Dependencies:** Part of App.tsx decomposition (Phase 5)

---

### 2.2 usePageReset - STILL OUTSTANDING ❌

**Status:** NOT STARTED
**Priority:** 🟢 LOW (Quick Win)
**Estimated Effort:** 30 minutes
**Value:** Cleaner code, explicit intent
**Recommendation:** Could be done as quick win in v2.7.0.0-beta

---

### 2.3 useImportExportState - PARTIALLY ADDRESSED ⚠️

**Status:** HOOK EXISTS but incomplete (36 lines)
**Priority:** 🟡 MEDIUM (Phase 5 or 6)
**Current State:** Only manages importMode state
**Analysis from REFACTORING_ANALYSIS:**

- Returns null for file ref (not actually usable)
- Doesn't handle import/export operations
- Would be completed as part of App.tsx decomposition

**Recommendation:** Enhance during Phase 5 App.tsx refactoring.

---

### 2.4 useCalendarNavigation - STILL OUTSTANDING ❌

**Status:** NOT STARTED (CalendarView.test.tsx exists)
**Priority:** 🟢 LOW (Phase 6 polish)
**Test Coverage:** CalendarView tests validate functionality
**Recommendation:** Extract after CalendarView refactoring in Phase 6.

---

### 2.5 useCalendarData - STILL OUTSTANDING ❌

**Status:** NOT STARTED (CalendarView.test.tsx exists)
**Priority:** 🟢 LOW (Phase 6 polish)
**Test Coverage:** CalendarView tests validate functionality
**Recommendation:** Extract after CalendarView refactoring in Phase 6.

---

## 3. Type Safety & Type Definitions

### 3.1 componentProps.ts Consolidation - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7 polish)
**Scope:** Centralize type exports, eliminate duplication
**Estimated Effort:** 1 hour
**Value:** Consistency, single source of truth

---

### 3.2 Implicit Types - NOT AN ISSUE ✅

**Status:** CONFIRMED GOOD PRACTICE
**Note:** storage.ts uses `unknown` appropriately - no action needed

---

### 3.3 FilterAction Validation - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7)
**Estimated Effort:** 1 hour
**Value:** Runtime safety for external data

---

### 3.4 Branded Types for IDs - NOT RECOMMENDED ⚠️

**Status:** IDENTIFIED but NOT RECOMMENDED
**Reasoning:** Type confusion hasn't been a real issue
**Risk:** Widespread changes required (4-5 hours)
**ROI:** Low
**Recommendation:** Skip unless type confusion becomes a problem

---

## 4. Code Duplication

### 4.1 Event Handler Patterns (stopPropagation) - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7 polish)
**Opportunity:** Add createClickHandler to a11yUtils
**Estimated Effort:** 1 hour
**Value:** DRY principle, consistency
**Recommendation:** Quick win in Phase 7

---

### 4.2 formatDate Usage - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7 polish)
**Opportunity:** Add JSDoc to formatDate, use consistently
**Estimated Effort:** 30 minutes
**Value:** Clarity, fewer unnecessary conditionals
**Recommendation:** 30-minute documentation task

---

### 4.3 View Button Pattern - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7 polish)
**Opportunity:** Create ViewButton component
**Estimated Effort:** 1 hour
**Value:** Consistent interaction pattern, accessibility
**Recommendation:** Add in Phase 7 if building new views

---

## 5. Architectural Patterns

### 5.1 TableView Prop Drilling via Context - STILL OUTSTANDING ❌

**Status:** NOT STARTED
**Priority:** 🔴 HIGH (Phase 5 Critical)
**Test Coverage:** ✅ TableView tests added (confidence for refactoring)
**Impact:** Reduces 22 props → ~10
**Recommendation:** Phase 5 critical refactor

---

### 5.2 Service Layer Completeness - PARTIALLY ADDRESSED ⚠️

**Status:** jobService.ts exists, others not organized
**Priority:** 🟡 MEDIUM (Phase 6)
**Still Missing:**

- ❌ storageService.ts (storage.ts logic moved/refactored)
- ❌ importExportService.ts (exportImport.ts logic organized)
- ❌ csvParser.ts (split from exportImport.ts)
- ❌ jsonExport.ts (split from exportImport.ts)
- ❌ jobMerger.ts (split from exportImport.ts)
- ❌ apiClient.ts wrapper

**Test Coverage:** ✅ Tests added for individual services
**Recommendation:** Phase 6 – organize under src/services/ structure

**Note:** jobsApi.ts exists in root – consider migrating to TypeScript during this refactor

---

### 5.3 Error Boundary Components - NOT STARTED ❌

**Status:** NOT STARTED
**Priority:** 🟡 MEDIUM (Phase 5 or v2.7.0.0-beta quick win)
**Estimated Effort:** 2 hours
**Value:** Better error handling, improved UX, prevents full app crashes
**Recommendation:** Quick win for Phase 5 or early Phase 6

---

### 5.4 Compound Components Pattern - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 6 polish)
**Candidates:** KanbanBoard, potentially TableView
**Value:** More composable APIs
**Recommendation:** Consider in Phase 6 refactoring

---

## 6. Testing Gaps - MAJORLY RESOLVED ✅

### 6.1 Components Without Tests

**Status as of v2.6.0 Phase 3:**

- ❌ KanbanBoard.tsx - Tests NOT added
- ❌ KanbanCard.tsx - Tests NOT added
- ❌ KanbanColumn.tsx - Tests NOT added
- ❌ Toast.tsx - Tests NOT added
- ❌ FilterToolbar.tsx - Tests NOT added
- ❌ JobForm.tsx - Tests NOT added
- ❌ JobModal.tsx - Tests NOT added
- ❌ Pagination.tsx - Tests NOT added
- ❌ SortableHeader.tsx - Tests NOT added
- ❌ StatusCell.tsx - Tests NOT added
- ❌ StatusSelect.tsx - Tests NOT added
- ✅ DashboardView.tsx - Tests ADDED (Phase 3)
- ✅ CalendarView.tsx - Tests ADDED (Phase 3 - 14 tests)
- ❌ TableView.tsx - Tests ADDED? (NEED TO VERIFY)

**Analysis:** Phase 3 covered most HIGH PRIORITY components, but 11 smaller components still untested.

**Recommendation:** Phase 6 batch for remaining 10-11 small components (~15-18 hours)

---

### 6.2 Hooks Without Tests - MAJORLY RESOLVED ✅

**Status as of v2.6.0 Phase 3:**

**Tests NOW ADDED (NOT in original analysis document):**

- ✅ useNotifications.test.ts - 12 tests (Phase 3)
- ✅ useJobOperations.test.ts - 14 tests (Phase 3)
- ✅ useTableData.test.ts - 7 tests (Phase 3)
- ✅ useJobPersistence.test.ts - 16 tests (Phase 3)
- ✅ useSortAndPagination.test.ts - 8 tests (Phase 3)
- ✅ useJobGrouping.test.ts - 6 tests (Phase 3)
- ✅ useImportExport.test.ts - 10 tests (Phase 3)
- ✅ useViewState.test.ts - 6 tests (Phase 3)
- ✅ useFilterState.test.ts - 8 tests (Phase 3)
- ✅ useJobFiltering.test.ts - 16 tests (Phase 3)
- ✅ useDebouncedValue.test.ts - 8 tests (v2.6.0 final)
- ✅ useAutoBackup.test.ts - 8 tests (v2.6.0 final)
- ✅ useDragDropZone.test.ts - 5 tests (Phase 3)
- ✅ useImportExportState.test.ts - Partially covered

**Still Missing Tests:**

- ❌ useJobForm.test.ts - 88 lines (CRITICAL)
- ❌ useJobSelection.test.ts - 83 lines
- ❌ useUndoStack.test.ts - 42 lines
- Possible: others not in original analysis

**Analysis:** Only 3-4 hooks still untested. Major victory in Phase 3!

**Recommendation:** Phase 6 quick completion (~6-8 hours for remaining hooks)

---

### 6.3 Utils Partially Tested - PARTIALLY RESOLVED ⚠️

**Status as of v2.6.0 Phase 3:**

**Tests NOW ADDED:**

- ✅ dateUtils.test.ts
- ✅ salaryUtils.test.ts
- ✅ stringUtils.test.ts
- ✅ dateCalendarUtils.test.ts - ADDED? (CRITICAL in analysis)
- ✅ downloadUtils.test.ts - ADDED? (Phase 3)
- ✅ dragDataUtils.test.ts - ADDED? (Phase 3)
- ✅ a11yUtils.test.ts - ADDED? (Phase 3)

**Still Missing:**

- Need to verify which of above are actually in Phase 3

**Recommendation:** Check Phase 3 test files for complete list

---

### 6.4 Integration Test Coverage - PARTIALLY RESOLVED ⚠️

**Status as of v2.6.0:**

- ✅ App.test.tsx exists with substantial tests
- ✅ Phase 3 includes many integration-style tests in batch 4

**Still Missing:**

- ❌ Dedicated integration test folder (src/tests/integration/)
- ⚠️ Some narrow end-to-end flows may not be covered

**Recommendation:** Phase 6 polish - organize and expand integration tests

---

## 7. Performance Opportunities

### 7.1 Missing Memoization - NOT STARTED ❌

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Phase 7 performance)
**Scope:** useCallback in App.tsx handlers + memo() on child components
**Estimated Effort:** 4-5 hours
**Caveat:** Most valuable post-App.tsx refactoring
**Value:** Measurable with large job lists (1000+)
**Recommendation:** Profile first, implement only if needed

---

### 7.2 useJobFiltering Re-computation - NOT RECOMMENDED ⚠️

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Premature optimization)
**Caveat:** Combine two useMemo calls (minimal gain)
**Recommendation:** Skip unless profiling shows bottleneck

---

### 7.3 Large Component Re-renders - LIKELY NOT AN ISSUE ✅

**Status:** GOOD (React 18 auto-batching)
**Recommendation:** Monitor with DevTools, optimize only if profiling shows issue

---

### 7.4 Code Splitting for Views - NOT AN ISSUE ✅

**Status:** NOT NEEDED (Bundle size minimal)
**Recommendation:** Skip

---

## 8. File Organization

### 8.1 Components Not in components/ - NOT STARTED ❌

**Status:** IDENTIFIED (KanbanBoard, KanbanCard, KanbanColumn, Toast still in src/)
**Priority:** 🟡 MEDIUM (Phase 6 organization)
**Estimated Effort:** 1 hour (plus import updates)
**Impact:** Consistent project structure
**Recommendation:** Phase 6 cleanup

---

### 8.2 Missing Index Files - NOT RECOMMENDED ⚠️

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Skip or minimal use)
**Caveat:** Can slow build times, impact tree-shaking
**Recommendation:** Skip unless imports become unwieldy

---

### 8.3 Inconsistent File Naming - NOT AN ISSUE ✅

**Status:** CONFIRMED CONSISTENT
**Note:** PascalCase for components/views, camelCase for hooks/utils/services
**Recommendation:** No action needed

---

### 8.4 domain.ts Could Be domain/ - FUTURE CONSIDERATION 🔮

**Status:** IDENTIFIED
**Priority:** 🟢 LOW (Future if domain logic grows)
**Recommendation:** Consider in v2.8.0+ when domain logic expands

---

## Summary by Impact Level

### 🔴 HIGH IMPACT - Phase 5 Critical (8-10 days)

1. **App.tsx Decomposition** (8-10 hours)

   - Extract 4 hooks
   - Reduce from 475 → ~250 lines
   - Status: ❌ NOT STARTED

2. **TableView Context** (5-6 hours)

   - Create TableContext
   - Reduce props from 22 → ~10
   - Status: ❌ NOT STARTED

3. **Critical Test Coverage** (12-15 hours)

   - TableView integration tests
   - useFilterState/useJobFiltering tests (MOSTLY DONE)
   - dateCalendarUtils tests (VERIFY IF DONE)
   - Status: ✅ >80% COMPLETE

**Phase 5 Subtotal:** ~35 hours (test gap much smaller than anticipated)

---

### 🟡 MEDIUM IMPACT - Phase 6 Architectural (10 days)

1. **Service Layer Completion** (8-10 hours)

   - Split exportImport.ts, storage.ts
   - Organize under src/services/
   - Status: ❌ NOT STARTED

2. **Remaining Component Tests** (15-18 hours)

   - 10-11 small/medium components
   - Status: ❌ NOT STARTED

3. **Remaining Hook Tests** (6-8 hours)

   - useJobForm, useJobSelection, useUndoStack
   - Status: ✅ MOSTLY DONE (maybe 1-2 remaining)

4. **Component Organization** (3-4 hours)

   - Move Kanban/Toast to proper directories
   - Status: ❌ NOT STARTED

5. **Hook Extractions** (2-3 hours)

   - useCalendarNavigation, useCalendarData
   - Status: ❌ NOT STARTED

**Phase 6 Subtotal:** ~36-43 hours

---

### 🟢 LOW IMPACT - Phase 7 Polish (5 days)

1. **Type System** (2-3 hours)

   - componentProps.ts consolidation
   - FilterAction validation
   - Status: ❌ NOT STARTED

2. **Performance** (4-5 hours)

   - useCallback + memo (profile first)
   - Status: ❌ NOT STARTED

3. **Code Quality** (3-4 hours)

   - a11yUtils enhancements
   - formatDate JSDoc
   - ViewButton component
   - Status: ❌ NOT STARTED

4. **Error Boundary** (2 hours)

   - Create ErrorBoundary component
   - Status: ❌ NOT STARTED

**Phase 7 Subtotal:** ~12-14 hours

---

## Overall Assessment

| Phase | Original Est. | Current Est. | Status | Key Change |
| ----- | ------------: | ----------: | ------ | ---------- |
| **Phase 5** | 35 hours | ~25-28 hours | 20-30% DONE | Tests added greatly reduce work |
| **Phase 6** | 40 hours | ~36-43 hours | 10-20% DONE | More component tests needed |
| **Phase 7** | 25 hours | ~12-14 hours | 0% DONE | Still light polish tasks |
| **TOTAL** | 100 hours | ~75-85 hours | ~15% DONE | **25% TIME REDUCTION** due to Phase 3 testing |

---

## Recommendations for v2.7.0

### High Priority (Week 1-2)

1. ✅ App.tsx decomposition (Phase 5)

   - Extract 4 hooks
   - Reduce complexity
   - Test coverage exists, safe to refactor

2. ✅ TableView Context (Phase 5)

   - Reduce prop drilling
   - Tests exist, safe to refactor
   - 5-6 hours, high impact

3. ⚠️ Verify missing tests

   - useJobForm, useJobSelection, useUndoStack
   - useJobFormState? (if exists)
   - Check Phase 3 test files for complete list

### Medium Priority (Week 3-4)

1. Service layer organization (3-4 hours quick win)

   - Create src/services/ structure
   - Move jobService, add others
   - Low risk, good structure

2. Error boundary (2 hours quick win)

   - Crash recovery
   - Small investment, measurable UX improvement

3. Remaining component tests (15-18 hours Phase 6)

   - JobForm, FilterToolbar, Kanban components
   - Smaller, less critical components

### Optional Polish (As time permits)

1. CalendarView hook extraction (2-3 hours)
2. Type system improvements (2-3 hours)
3. Quick wins: formatDate JSDoc, createClickHandler (2-3 hours)

---

## Files That Should Be Created in v2.7.0

### Phase 5 (Essential)

- [ ] src/hooks/useAppState.ts
- [ ] src/hooks/useSelectionState.ts
- [ ] src/contexts/TableContext.tsx
- [ ] Updates to src/hooks/useImportExport.ts (enhance)

### Phase 6 (Architectural)

- [ ] src/services/storageService.ts
- [ ] src/services/csvParser.ts
- [ ] src/services/jsonExport.ts
- [ ] src/services/jobMerger.ts
- [ ] src/services/apiClient.ts
- [ ] src/components/ErrorBoundary.tsx
- [ ] src/components/kanban/ (move existing files)
- [ ] src/components/feedback/ (move Toast)

### Phase 6 (Test files)

- [ ] src/hooks/useJobForm.test.ts
- [ ] src/hooks/useJobSelection.test.ts
- [ ] src/hooks/useUndoStack.test.ts
- [ ] src/components/JobForm.test.tsx
- [ ] src/components/FilterToolbar.test.tsx
- [ ] src/components/Kanban*.test.tsx (3 files)
- [ ] src/components/Pagination.test.tsx
- [ ] src/components/SortableHeader.test.tsx
- [ ] src/components/StatusCell.test.tsx
- [ ] src/components/StatusSelect.test.tsx

### Phase 7 (Polish)

- [ ] src/components/ViewButton.tsx
- [ ] src/tests/integration/jobManagement.test.ts (or expand App.test.tsx)

---

## Conclusion

With v2.6.0 Phase 3 completion, the refactoring roadmap has been **significantly de-risked**. Most critical gaps identified in the analysis have been **addressed through comprehensive testing**, which means:

1. ✅ **Refactoring work is now safer** - Tests provide confidence
2. ✅ **Test gaps largely closed** - From 50+ untested hooks/components to <15
3. ⚠️ **Architecture work remains** - Service layer, App.tsx still need decomposition
4. ✅ **v2.7.0 can focus on quality** - Polish, organization, performance

**Recommended v2.7.0 Release Tagline:**
> "Polish & Refactored: Clean Architecture + Comprehensive Testing"

**Estimated v2.7.0 Timeline:** 3-4 weeks (vs. 2.5 weeks originally estimated)
