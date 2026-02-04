# GSD Patches - Feature Proposals

**Version:** 1.0  
**Date:** 2025-02-04  
**Status:** Research Complete, Awaiting Prioritization

---

## Executive Summary

Based on research into terminal productivity tools, developer workflow patterns, and the current GSD patch capabilities, this document proposes 20 feature enhancements organized into four categories: Display Enhancements, Data Tracking, Smart Features, and Integrations.

### Current State
GSD patches currently provide:
- Status bar: `📋P{phase} ✅{done}/{total} [{project}]`
- Welcome message with project name and phase
- Data from: PROJECT.md, STATE.md, ROADMAP.md, .kimi-todos.json

### Research Sources
- Terminal productivity best practices (Medium, Dev.to, 2024-2025)
- Git-aware prompt patterns (Midgar Corp blog, 2025)
- Unicode progress bar techniques (Naut.ca, 2024)
- Priority classification systems (Fibery, LinkedIn, 2024)

---

## Top 5 Quick Wins (High Value, Low Effort)

| Rank | Feature | Value | Effort | Impact |
|------|---------|-------|--------|--------|
| 1 | Task Priority Indicators | ⭐⭐⭐⭐⭐ | 2h | Instant visual priority awareness |
| 2 | ASCII Progress Bar | ⭐⭐⭐⭐ | 3h | Immediate completion visualization |
| 3 | Completion Percentage | ⭐⭐⭐⭐ | 1h | Quick progress assessment |
| 4 | Stale Task Detection | ⭐⭐⭐⭐ | 4h | Prevents forgotten work |
| 5 | Git Branch Display | ⭐⭐⭐⭐⭐ | 3h | Context awareness without commands |

---

## Feature Proposals by Category

### 🎨 Display Enhancements

#### 1. ASCII Progress Bar
**Description:** Visual progress bar using Unicode block characters (▓▓▓▒▒▒▒▒▒▒) showing overall phase completion based on todos.

**User Value:**
- Immediate visual understanding of progress at a glance
- More intuitive than `3/10` for visual thinkers
- Satisfying sense of momentum during development

**Implementation:**
```python
# Example output: [▓▓▓▓▓▓▓▒▒▒] 70%
def get_progress_bar(done, total, width=10):
    if total == 0:
        return "[▒" * width + "] 0%"
    filled = int(width * done / total)
    bar = "▓" * filled + "▒" * (width - filled)
    return f"[{bar}] {int(100 * done / total)}%"
```

**Complexity:** Low (3 hours)
- No new dependencies
- Simple math calculation
- Standard Unicode characters

**Confidence:** HIGH (proven pattern, widely used)

---

#### 2. Completion Percentage Indicator
**Description:** Numeric percentage display alongside or instead of `✅done/total`.

**User Value:**
- Faster mental parsing than fraction math
- Useful for sprint planning and reporting
- Standard metric in project management

**Implementation:**
```python
# Current: ✅3/10
# New: ✅3/10 (30%) or simply 30%
percentage = int(100 * done / total) if total > 0 else 0
f"✅{done}/{total} ({percentage}%)"
```

**Complexity:** Very Low (1 hour)
- Single calculation
- String formatting only

**Confidence:** HIGH

---

#### 3. Git Branch Display
**Description:** Show current Git branch name in status bar when in a Git repository.

**User Value:**
- Prevents accidental commits to wrong branches
- Reduces `git branch` commands by ~20-30x per day
- Critical for multi-branch workflows (feature/fix/main)

**Implementation:**
```python
def get_git_branch():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=0.1  # Performance critical
        )
        if result.returncode == 0:
            branch = result.stdout.strip()
            return f"🌿{branch[:15]}"  # Truncate long names
    except:
        pass
    return None
```

**Complexity:** Low (3 hours)
- Git command execution (cached/limited)
- Error handling for non-git directories
- Timeout to prevent hanging

**Performance Consideration:**
- Must run in <50ms
- Cache result for 5 seconds
- Skip if not in git repo (fast check first)

**Confidence:** HIGH (proven pattern in oh-my-zsh, starship)

---

#### 4. Git Status Indicators
**Description:** Visual indicators for uncommitted changes (*), staged changes (+), ahead/behind remote (↑2/↓3).

**User Value:**
- Prevents "oops, forgot to commit" moments
- Knows when push/pull needed without commands
- Visual reminder of work-in-progress state

**Implementation:**
```python
# Branch with status: main*+↑2 (dirty, staged, ahead)
indicators = []
if has_uncommitted_changes():
    indicators.append("*")  # Modified
if has_staged_changes():
    indicators.append("+")  # Staged
if ahead_count := get_ahead_count():
    indicators.append(f"↑{ahead_count}")
if behind_count := get_behind_count():
    indicators.append(f"↓{behind_count}")
```

**Complexity:** Medium (5 hours)
- Multiple git commands
- Performance optimization critical
- Caching strategy required

**Confidence:** HIGH (standard in modern prompts)

---

#### 5. Color Coding by Status
**Description:** Dynamic colors based on project health:
- 🟢 Green: On track (>70% complete)
- 🟡 Yellow: Moderate (30-70%)
- 🔴 Red: Starting/danger zone (<30%)
- ⚪ Gray: No todos

**User Value:**
- Instant visual health check
- Draws attention when behind
- Positive reinforcement when ahead

**Implementation:**
```python
def get_status_color(done, total):
    if total == 0:
        return "fg:#888888"  # Gray
    pct = done / total
    if pct >= 0.7:
        return "fg:#00ff00"  # Green
    elif pct >= 0.3:
        return "fg:#ffff00"  # Yellow
    else:
        return "fg:#ff6666"  # Red
```

**Complexity:** Very Low (1 hour)
- Color logic already exists in patches
- Extend with conditional logic

**Confidence:** HIGH

---

#### 6. Deadline Countdown
**Description:** Display days remaining until milestone/phase deadline if `deadline` field exists in STATE.md.

**User Value:**
- Prevents deadline surprises
- Helps prioritize when time-constrained
- Natural sprint/milestone alignment

**Implementation:**
```python
# STATE.md format: ## Deadline: 2025-02-15
def get_days_remaining(deadline_str):
    from datetime import datetime, date
    deadline = datetime.strptime(deadline_str, "%Y-%m-%d").date()
    days = (deadline - date.today()).days
    if days < 0:
        return f"🔴OVERDUE {abs(days)}d"
    elif days == 0:
        return "🔴DUE TODAY"
    elif days <= 3:
        return f"⚠️{days}d left"
    else:
        return f"📅{days}d"
```

**Complexity:** Low (2 hours)
- Date parsing from STATE.md
- Simple date math
- Visual urgency indicators

**Confidence:** MEDIUM (requires deadline field adoption)

---

#### 7. Activity Indicator
**Description:** Subtle animation or icon when AI is actively processing (thinking/working).

**User Value:**
- Reduces "is it stuck?" anxiety
- Clearer than current "thinking" text
- Professional polish

**Implementation:**
```python
# Spinner characters: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏
spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
def get_activity_indicator(is_thinking, frame):
    if is_thinking:
        return spinner[frame % len(spinner)]
    return "✓"  # Done
```

**Complexity:** Medium (4 hours)
- Requires animation frame tracking
- Integration with existing thinking state
- Terminal refresh considerations

**Confidence:** MEDIUM (nice-to-have, not essential)

---

### 📊 Data Tracking

#### 8. Task Priority Indicators (P0/P1/P2)
**Description:** Display count of high-priority tasks remaining (P0=Critical, P1=Important, P2=Nice-to-have).

**User Value:**
- Instant visibility of fire-drill items
- Prevents P0 tasks being buried
- Aligns with industry standard priority system

**Implementation:**
```python
# .kimi-todos.json format:
# [{"title": "Fix crash", "done": false, "priority": "P0"}]
def get_priority_counts(todos):
    p0 = sum(1 for t in todos if t.get("priority") == "P0" and not t.get("done"))
    p1 = sum(1 for t in todos if t.get("priority") == "P1" and not t.get("done"))
    return f"🔥{p0} ⚡{p1}" if p0 or p1 else ""
```

**Complexity:** Low (2 hours)
- JSON field parsing
- Count aggregation
- Conditional display

**Confidence:** HIGH (P0/P1/P2 is industry standard)

---

#### 9. Task Categories/Tags Display
**Description:** Show active task categories (e.g., "feat: 2, bug: 1, docs: 0") based on tags.

**User Value:**
- Understand work distribution at a glance
- Prevents over-rotation on one type
- Helps balance sprint load

**Implementation:**
```python
# .kimi-todos.json format:
# [{"title": "Add auth", "done": false, "tags": ["feat", "backend"]}]
from collections import Counter

def get_category_summary(todos, max_tags=3):
    active = [t for t in todos if not t.get("done")]
    tags = [tag for t in active for tag in t.get("tags", [])]
    counts = Counter(tags).most_common(max_tags)
    return " ".join(f"{tag}:{count}" for tag, count in counts)
```

**Complexity:** Low (2 hours)
- Tag extraction
- Counter aggregation
- Truncation for display

**Confidence:** HIGH

---

#### 10. Blocked Status Indicator
**Description:** Display count of blocked tasks with 🚫 icon when tasks have `blocked: true` or `blocked_by` field.

**User Value:**
- Immediate visibility of workflow blockers
- Prevents "why isn't this moving?" confusion
- Prompts unblocking actions

**Implementation:**
```python
# .kimi-todos.json format:
# [{"title": "API integration", "done": false, "blocked": true, "blocked_by": "API-123"}]
def get_blocked_count(todos):
    blocked = sum(1 for t in todos if t.get("blocked") and not t.get("done"))
    return f"🚫{blocked}" if blocked else ""
```

**Complexity:** Very Low (1 hour)
- Boolean field check
- Simple count

**Confidence:** HIGH

---

#### 11. Sprint/Iteration Info
**Description:** Show current sprint number/name and sprint day (e.g., "Sprint 5, Day 3/14").

**User Value:**
- Sprint rhythm awareness
- Mid-sprint checkpoint reminders
- Sprint planning alignment

**Implementation:**
```python
# STATE.md format:
# ## Sprint: 5
# ## Sprint Day: 3
# ## Sprint Length: 14
def get_sprint_status(sprint, day, length):
    pct = int(100 * day / length)
    return f"S{sprint} D{day}/{length} ({pct}%)"
```

**Complexity:** Low (2 hours)
- Field parsing from STATE.md
- Date calculation (alternative to manual tracking)

**Confidence:** MEDIUM (requires adoption of sprint fields)

---

#### 12. Time Tracking Estimates
**Description:** Display total estimated hours remaining vs. completed.

**User Value:**
- Capacity planning
- Sprint commitment tracking
- Historical estimation accuracy

**Implementation:**
```python
# .kimi-todos.json format:
# [{"title": "Feature X", "done": false, "estimate_hours": 4}]
def get_time_summary(todos):
    total = sum(t.get("estimate_hours", 0) for t in todos)
    done = sum(t.get("estimate_hours", 0) for t in todos if t.get("done"))
    remaining = total - done
    return f"⏱️{remaining}h/{total}h"
```

**Complexity:** Low (2 hours)
- Numeric aggregation
- Simple math

**Confidence:** MEDIUM (requires team adoption of estimates)

---

### 🧠 Smart Features

#### 13. Stale Task Detection
**Description:** Indicator when tasks haven't been touched in N days (configurable, default 7).

**User Value:**
- Prevents forgotten work
- Prompts task review
- Identifies stuck items

**Implementation:**
```python
# Add `last_touched` field to todos, auto-update on modify
def get_stale_indicator(todos, threshold_days=7):
    from datetime import datetime, timedelta
    stale = [
        t for t in todos 
        if not t.get("done") 
        and datetime.fromisoformat(t.get("last_touched", "1970-01-01")) 
           < datetime.now() - timedelta(days=threshold_days)
    ]
    return f"💤{len(stale)} stale" if stale else ""
```

**Complexity:** Medium (4 hours)
- Timestamp tracking
- Date comparison
- Configuration system

**Confidence:** HIGH

---

#### 14. Task Suggestion
**Description:** Highlight next recommended task based on priority + age + dependencies.

**User Value:**
- Reduces "what should I work on?" friction
- Smart prioritization
- Dependency awareness

**Implementation:**
```python
def get_next_task_suggestion(todos):
    active = [t for t in todos if not t.get("done")]
    if not active:
        return None
    
    # Score: priority (P0=3, P1=2, P2=1) + age_bonus + !blocked
    def score(t):
        p_score = {"P0": 3, "P1": 2, "P2": 1}.get(t.get("priority"), 0)
        blocked_penalty = -100 if t.get("blocked") else 0
        return p_score + blocked_penalty
    
    next_task = max(active, key=score)
    return f"👉{next_task['title'][:20]}"
```

**Complexity:** Medium (4 hours)
- Scoring algorithm
- Recommendation display
- User feedback loop

**Confidence:** MEDIUM (algorithm needs tuning)

---

#### 15. Completion Prediction
**Description:** Estimate completion date based on velocity (tasks/day over last 7 days).

**User Value:**
- Forecasting ability
- Sprint planning data
- Reality check on deadlines

**Implementation:**
```python
def predict_completion(todos, history_days=7):
    from datetime import datetime, timedelta
    
    # Calculate velocity from completed tasks in last N days
    cutoff = datetime.now() - timedelta(days=history_days)
    recent_completions = [
        t for t in todos 
        if t.get("done") 
        and datetime.fromisoformat(t.get("completed_at")) > cutoff
    ]
    velocity = len(recent_completions) / history_days  # tasks per day
    
    remaining = len([t for t in todos if not t.get("done")])
    if velocity <= 0:
        return "∞"  # No velocity data
    
    days_to_complete = remaining / velocity
    completion_date = datetime.now() + timedelta(days=days_to_complete)
    return f"📈~{days_to_complete:.0f}d ({completion_date.strftime('%m/%d')})"
```

**Complexity:** Medium (6 hours)
- Historical data tracking
- Velocity calculation
- Date prediction

**Confidence:** LOW (complex algorithm, needs validation)

---

#### 16. Phase Advancement Suggestion
**Description:** Suggest moving to next phase when current phase todos are complete.

**User Value:**
- Prevents "stuck in phase" syndrome
- Prompts milestone review
- Workflow automation

**Implementation:**
```python
def get_phase_advancement_suggestion(todos, phase):
    active = [t for t in todos if not t.get("done")]
    if not active and todos:  # All done, had todos
        return f"🎉 Phase {phase} complete! Consider /skill:gsd-complete-phase"
    return None
```

**Complexity:** Very Low (1 hour)
- Simple conditional check
- String suggestion

**Confidence:** HIGH

---

### 🔗 Integrations

#### 17. GitHub Issue Counter
**Description:** Display count of assigned open issues/PRs from GitHub (cached, async).

**User Value:**
- Unified view of work
- No context switching to check GitHub
- PR review reminders

**Implementation:**
```python
# .gsd-config.json format:
# {"github": {"repo": "owner/name", "token_env": "GITHUB_TOKEN"}}
def get_github_summary(config):
    # Cache for 5 minutes to avoid rate limits
    cache_key = f"github_summary_{config['repo']}"
    if cached := get_cache(cache_key, ttl=300):
        return cached
    
    # Async fetch (non-blocking for status bar)
    issues = fetch_github_issues_async(config)
    prs = fetch_github_prs_async(config)
    summary = f"🐙I:{issues} 🔀PR:{prs}"
    set_cache(cache_key, summary)
    return summary
```

**Complexity:** High (8 hours)
- GitHub API integration
- Caching layer
- Async/non-blocking design
- Token management

**Confidence:** MEDIUM (requires GitHub token setup)

---

#### 18. CI/CD Status Indicator
**Description:** Show latest workflow status (✅/❌/⏳) for current branch.

**User Value:**
- Immediate CI failure awareness
- Prevents "broken main" surprises
- Build confidence indicator

**Implementation:**
```python
def get_ci_status(config, branch):
    # Support GitHub Actions, GitLab CI, CircleCI
    cache_key = f"ci_{branch}"
    if cached := get_cache(cache_key, ttl=120):  # 2 min cache
        return cached
    
    status = fetch_ci_status(config, branch)
    icons = {"success": "✅", "failure": "❌", "pending": "⏳"}
    return icons.get(status, "❓")
```

**Complexity:** High (10 hours)
- Multi-provider support
- API authentication
- Branch mapping
- Status interpretation

**Confidence:** MEDIUM (complex multi-provider integration)

---

#### 19. Calendar/Deadline Sync
**Description:** Show next calendar event or deadline from external calendar (Google/Outlook).

**User Value:**
- Meeting awareness
- Deadline alignment
- Work schedule context

**Implementation:**
```python
def get_next_calendar_event(config):
    # Requires calendar API integration
    # Show "📅 Standup in 15m" or "🚨 Deadline: 2h"
    event = fetch_next_event(config)
    if not event:
        return None
    
    minutes_until = (event.start - now).total_seconds() / 60
    if minutes_until < 60:
        return f"📅 {event.title} in {int(minutes_until)}m"
    return f"📅 {event.title} {int(minutes_until/60)}h"
```

**Complexity:** High (12 hours)
- OAuth integration
- Calendar API
- Privacy considerations
- Event filtering

**Confidence:** LOW (complex, privacy-sensitive)

---

#### 20. Slack Status Sync
**Description:** Optional two-way sync of focus status with Slack (shows "In Focus Mode" when working).

**User Value:**
- Reduces interruptions
- Focus time protection
- Team awareness

**Implementation:**
```python
def update_slack_status(config, is_focused):
    # Set Slack status when entering deep work
    # Clear when phase complete or break
    if is_focused:
        set_slack_status(
            text=f"🎯 Focus: Phase {phase}",
            emoji=":target:",
            expiration=3600  # 1 hour
        )
```

**Complexity:** High (10 hours)
- Slack API integration
- Status management
- User preference handling
- Rate limiting

**Confidence:** LOW (nice-to-have, significant complexity)

---

## Implementation Complexity Summary

| Category | Features | Total Hours | Avg Hours |
|----------|----------|-------------|-----------|
| Display Enhancements | 7 | 19 | 2.7 |
| Data Tracking | 5 | 9 | 1.8 |
| Smart Features | 4 | 15 | 3.8 |
| Integrations | 4 | 40 | 10.0 |
| **Total** | **20** | **83** | **4.2** |

---

## Long-Term Vision: GSD 2.0

### The Intelligent Project Companion

Beyond status display, GSD evolves into an intelligent project companion that:

1. **Proactively Identifies Issues**
   - Stale task alerts
   - Deadline risk warnings
   - Blocker escalation

2. **Optimizes Developer Flow**
   - Smart task ordering
   - Context restoration ("You were working on...")
   - Interruption recovery

3. **Enables Data-Driven Decisions**
   - Velocity tracking
   - Estimation accuracy
   - Team productivity insights

4. **Integrates Seamlessly**
   - Universal tool connections
   - Cross-platform presence
   - Zero-config onboarding

### Technical Architecture Evolution

```
Current (1.0):              Future (2.0):
┌─────────────┐            ┌─────────────┐
│ File Parser │            │  GSD Core   │
│  (sync)     │            │  (daemon)   │
└──────┬──────┘            └──────┬──────┘
       │                          │
   Status Bar                 ┌────┴────┐
                              │ Watchers│
                              │ Plugins │
                              │  Cache  │
                              └────┬────┘
                                   │
                         ┌─────────┼─────────┐
                         │         │         │
                    Status    Smart    Integration
                     Bar     Engine    Providers
```

### Roadmap

**Phase 1: Quick Wins (Months 1-2)**
- Priorities (P0/P1/P2)
- Progress bar
- Git branch display
- Color coding
- Completion percentage

**Phase 2: Enhanced Display (Months 3-4)**
- Git status indicators
- Deadline countdown
- Stale task detection
- Activity indicators

**Phase 3: Intelligence (Months 5-6)**
- Task suggestions
- Completion predictions
- Phase advancement prompts

**Phase 4: Integrations (Months 7-9)**
- GitHub sync
- CI/CD status
- Calendar integration

**Phase 5: Ecosystem (Months 10-12)**
- Plugin system
- Team features
- Analytics dashboard

---

## Recommendations

### Immediate Implementation (This Sprint)
1. **Task Priority Indicators** - Highest developer value
2. **Completion Percentage** - Zero effort, instant value
3. **Color Coding by Status** - Visual health indicator

### Next Sprint
4. **ASCII Progress Bar** - Professional polish
5. **Stale Task Detection** - Prevents lost work
6. **Git Branch Display** - Essential for Git workflows

### Deferred (High Complexity/Lower Priority)
- Calendar sync (complex OAuth)
- Slack integration (external dependency)
- CI/CD status (multi-provider complexity)

### Rejected (Against Constraints)
- Rich graphics (terminal compatibility)
- External dependencies (violates constraint)
- Long-running processes (performance critical)

---

## Appendix: Unicode Characters Reference

### Progress Bars
- Full blocks: `█` `▓` `▒` `░`
- Partial blocks: `▰` `▱` `▮` `▯`
- Half-width: `￭` `･`

### Status Icons
- Phase: `📋` `🎯` `📌`
- Progress: `✅` `⏳` `📊`
- Priority: `🔥` `⚡` `📌`
- Git: `🌿` `🔀` `📦`
- Time: `📅` `⏱️` `⏰` `💤`
- Blocked: `🚫` `⛔` `🔒`
- Activity: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` (spinner)

### Color Reference
```python
COLORS = {
    "success": "#00ff00",    # Bright green
    "warning": "#ffff00",    # Yellow
    "danger": "#ff6666",     # Red
    "info": "#00aaff",       # Blue
    "muted": "#888888",      # Gray
    "highlight": "#ffaa00",  # Orange
}
```

---

## Sources

1. **Git-Aware Prompts** - https://midgarcorp.cc/blog/git-aware-terminal-prompt/ (2025)
2. **Unicode Progress Bars** - https://www.naut.ca/blog/2024/12/26/making-a-unicode-progress-bar/ (2024)
3. **Priority Levels** - https://fibery.com/blog/product-management/p0-p1-p2-p3-p4/ (2024)
4. **Terminal Productivity** - Various Medium/Dev.to articles (2024-2025)
5. **Current GSD Implementation** - Internal patch documentation

---

**Document Owner:** GSD Product Team  
**Last Updated:** 2025-02-04  
**Next Review:** 2025-03-04
