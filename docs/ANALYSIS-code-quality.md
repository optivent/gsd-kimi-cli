# GSD Patch Code Quality Analysis

**Analysis Date:** 2025-01-21  
**Files Analyzed:** 5 files in kimi-cli GSD patch  
**Scope:** Code quality, design patterns, Python best practices, maintainability

---

## Executive Summary

The GSD patch introduces functionality across multiple files with **significant code duplication** and **inconsistent implementations**. The most critical issue is that three separate functions perform nearly identical GSD context loading with slightly different logic and data formats.

**Overall Grade: C+** (Functional but needs refactoring)

| Category | Grade | Notes |
|----------|-------|-------|
| Code Duplication | D | Three nearly identical functions |
| Type Safety | C | Missing type hints, inconsistent return types |
| Design Patterns | C | Tight coupling, no shared abstraction |
| Python Best Practices | B | Good pathlib usage, some regex issues |
| Maintainability | C | Magic numbers, hardcoded paths |

---

## 1. Critical Issues

### 1.1 Severe Code Duplication (CRITICAL)

**Problem:** Three functions perform nearly identical GSD context loading:

1. `KimiSoul._load_gsd_context()` in `soul/kimisoul.py` (lines 146-203)
2. `CustomPromptSession._get_gsd_context()` in `ui/shell/prompt.py` (lines 887-934)
3. `_get_gsd_welcome()` in `ui/shell/__init__.py` (lines 327-357)

**Current State:**

```python
# kimisoul.py (58 lines)
def _load_gsd_context(self) -> dict:
    try:
        from pathlib import Path
        import re
        import json
        
        work_dir = Path.cwd()
        planning_dir = work_dir / '.planning'
        if not planning_dir.exists():
            return {}
        
        context = {
            'gsd_enabled': True,
            'gsd_phase': None,
            'gsd_todos_total': 0,
            'gsd_todos_done': 0,
            'gsd_milestone': None,
            'gsd_project': None,
        }
        
        # Parse STATE.md
        state_file = planning_dir / 'STATE.md'
        if state_file.exists():
            content = state_file.read_text()
            phase_match = re.search(r'Current Phase[:\s]+(\d+)', content, re.IGNORECASE)
            if phase_match:
                context['gsd_phase'] = phase_match.group(1)
        
        # Parse PROJECT.md
        project_file = planning_dir / 'PROJECT.md'
        if project_file.exists():
            proj_content = project_file.read_text()
            title_match = re.search(r'^#\s+(.+)$', proj_content, re.MULTILINE)
            if title_match:
                context['gsd_project'] = title_match.group(1)[:30]
        
        # Parse ROADMAP.md for milestone
        roadmap_file = planning_dir / 'ROADMAP.md'
        if roadmap_file.exists():
            road_content = roadmap_file.read_text()
            mile_match = re.search(r'##\s+Current Milestone[:\s]*([^\n]+)', road_content, re.IGNORECASE)
            if mile_match:
                context['gsd_milestone'] = mile_match.group(1).strip()[:20]
        
        # Read todos
        try:
            todo_file = work_dir / '.kimi-todos.json'
            if todo_file.exists():
                todos = json.loads(todo_file.read_text())
                context['gsd_todos_total'] = len(todos)
                context['gsd_todos_done'] = sum(1 for t in todos if t.get('done'))
        except Exception:
            pass
        
        return context
    except Exception:
        return {}
```

```python
# prompt.py (48 lines)
def _get_gsd_context(self):
    try:
        from pathlib import Path
        import re
        import json
        
        planning_dir = Path.cwd() / '.planning'
        if not planning_dir.exists():
            return {}
        
        ctx = {
            'enabled': True, 
            'phase': None, 
            'todos_total': 0,
            'todos_done': 0,
            'project': None
        }
        
        # Read STATE.md for phase
        state_file = planning_dir / 'STATE.md'
        if state_file.exists():
            content = state_file.read_text()
            match = re.search(r'Current Phase[:\s]+(\d+)', content, re.I)
            if match:
                ctx['phase'] = match.group(1)
        
        # Read PROJECT.md for project name
        project_file = planning_dir / 'PROJECT.md'
        if project_file.exists():
            content = project_file.read_text()
            match = re.search(r'^#\s+(.+)$', content, re.M)
            if match:
                ctx['project'] = match.group(1)[:20]
        
        # Read todos
        try:
            todo_file = Path.cwd() / '.kimi-todos.json'
            if todo_file.exists():
                todos = json.loads(todo_file.read_text())
                ctx['todos_total'] = len(todos)
                ctx['todos_done'] = sum(1 for t in todos if t.get('done'))
        except Exception:
            pass
        
        return ctx
    except Exception:
        return {}
```

```python
# ui/shell/__init__.py (31 lines)
def _get_gsd_welcome() -> str | None:
    try:
        from pathlib import Path
        import re
        
        planning_dir = Path.cwd() / '.planning'
        if not planning_dir.exists():
            return None
        
        lines = ["[bold green]📋 GSD Project[/bold green]"]
        
        # Project name
        project_file = planning_dir / 'PROJECT.md'
        if project_file.exists():
            content = project_file.read_text()
            title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            if title_match:
                lines.append(f"   [cyan]{title_match.group(1)}[/cyan]")
        
        # Current phase
        state_file = planning_dir / 'STATE.md'
        if state_file.exists():
            content = state_file.read_text()
            phase_match = re.search(r'Current Phase[:\s]+(\d+)', content, re.IGNORECASE)
            if phase_match:
                lines.append(f"   Phase: [yellow]{phase_match.group(1)}[/yellow]")
        
        return "\n".join(lines)
    except Exception:
        return None
```

**Issues:**
1. **Logic duplication:** Same file reading, regex patterns, and error handling repeated 3x
2. **Inconsistent return types:** `dict`, `dict`, `str | None`
3. **Inconsistent key naming:** `gsd_phase` vs `phase`
4. **Inconsistent truncation:** `[:30]` vs `[:20]` for project name
5. **Different file imports:** Same imports repeated inside functions instead of module level

**Recommended Fix:**

```python
# NEW FILE: kimi_cli/gsd/context.py
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class GSDContext:
    """Immutable GSD context data."""
    enabled: bool = False
    phase: str | None = None
    todos_total: int = 0
    todos_done: int = 0
    milestone: str | None = None
    project: str | None = None
    
    @property
    def todos_pending(self) -> int:
        return self.todos_total - self.todos_done
    
    @property
    def todos_progress_pct(self) -> float:
        if self.todos_total == 0:
            return 0.0
        return (self.todos_done / self.todos_total) * 100
    
    def to_status_dict(self) -> dict[str, Any]:
        """Convert to dict with gsd_ prefix for StatusSnapshot."""
        return {
            'gsd_enabled': self.enabled,
            'gsd_phase': self.phase,
            'gsd_todos_total': self.todos_total,
            'gsd_todos_done': self.todos_done,
            'gsd_milestone': self.milestone,
            'gsd_project': self.project,
        }
    
    def to_display_lines(self, project_max_len: int = 30) -> list[str]:
        """Generate Rich-formatted welcome lines."""
        lines = ["[bold green]📋 GSD Project[/bold green]"]
        if self.project:
            project_display = self.project[:project_max_len]
            lines.append(f"   [cyan]{project_display}[/cyan]")
        if self.phase:
            lines.append(f"   Phase: [yellow]{self.phase}[/yellow]")
        return lines


class GSDContextLoader:
    """Loads GSD context from the .planning directory."""
    
    # Configurable paths
    PLANNING_DIR = '.planning'
    STATE_FILE = 'STATE.md'
    PROJECT_FILE = 'PROJECT.md'
    ROADMAP_FILE = 'ROADMAP.md'
    TODO_FILE = '.kimi-todos.json'
    
    # Compiled regex patterns (compile once)
    PHASE_PATTERN = re.compile(r'Current Phase[:\s]+(\d+)', re.IGNORECASE)
    TITLE_PATTERN = re.compile(r'^#\s+(.+)$', re.MULTILINE)
    MILESTONE_PATTERN = re.compile(r'##\s+Current Milestone[:\s]*([^\n]+)', re.IGNORECASE)
    
    # Default truncation limits
    PROJECT_MAX_LEN = 30
    MILESTONE_MAX_LEN = 20
    
    def __init__(self, work_dir: Path | None = None):
        self.work_dir = work_dir or Path.cwd()
        self.planning_dir = self.work_dir / self.PLANNING_DIR
    
    def is_gsd_enabled(self) -> bool:
        """Check if GSD is enabled in current directory."""
        return self.planning_dir.exists()
    
    def load(self) -> GSDContext:
        """Load GSD context from files."""
        if not self.is_gsd_enabled():
            return GSDContext()
        
        return GSDContext(
            enabled=True,
            phase=self._load_phase(),
            todos_total=self._load_todos_total(),
            todos_done=self._load_todos_done(),
            milestone=self._load_milestone(),
            project=self._load_project(),
        )
    
    def _load_phase(self) -> str | None:
        state_file = self.planning_dir / self.STATE_FILE
        if not state_file.exists():
            return None
        try:
            content = state_file.read_text()
            match = self.PHASE_PATTERN.search(content)
            return match.group(1) if match else None
        except OSError:
            return None
    
    def _load_project(self) -> str | None:
        project_file = self.planning_dir / self.PROJECT_FILE
        if not project_file.exists():
            return None
        try:
            content = project_file.read_text()
            match = self.TITLE_PATTERN.search(content)
            if match:
                return match.group(1).strip()[:self.PROJECT_MAX_LEN]
            return None
        except OSError:
            return None
    
    def _load_milestone(self) -> str | None:
        roadmap_file = self.planning_dir / self.ROADMAP_FILE
        if not roadmap_file.exists():
            return None
        try:
            content = roadmap_file.read_text()
            match = self.MILESTONE_PATTERN.search(content)
            if match:
                return match.group(1).strip()[:self.MILESTONE_MAX_LEN]
            return None
        except OSError:
            return None
    
    def _load_todos(self) -> list[dict[str, Any]]:
        todo_file = self.work_dir / self.TODO_FILE
        if not todo_file.exists():
            return []
        try:
            data = json.loads(todo_file.read_text())
            return data if isinstance(data, list) else []
        except (OSError, json.JSONDecodeError):
            return []
    
    def _load_todos_total(self) -> int:
        return len(self._load_todos())
    
    def _load_todos_done(self) -> int:
        return sum(1 for t in self._load_todos() if t.get('done'))


# Convenience function for simple use cases
def load_gsd_context(work_dir: Path | None = None) -> GSDContext:
    """Load GSD context from the current or specified directory."""
    return GSDContextLoader(work_dir).load()
```

Then refactor usage:

```python
# In kimisoul.py:
from kimi_cli.gsd.context import GSDContextLoader

def _load_gsd_context(self) -> dict[str, Any]:
    """Load GSD context from .planning directory."""
    loader = GSDContextLoader()
    ctx = loader.load()
    return ctx.to_status_dict() if ctx.enabled else {}

# In prompt.py:
from kimi_cli.gsd.context import GSDContextLoader

def _get_gsd_context(self) -> dict[str, Any]:
    """Load GSD context for status bar."""
    loader = GSDContextLoader()
    ctx = loader.load()
    return {
        'enabled': ctx.enabled,
        'phase': ctx.phase,
        'todos_total': ctx.todos_total,
        'todos_done': ctx.todos_done,
        'project': ctx.project,
    } if ctx.enabled else {}

# In ui/shell/__init__.py:
from kimi_cli.gsd.context import GSDContextLoader

def _get_gsd_welcome() -> str | None:
    """Generate GSD welcome message."""
    loader = GSDContextLoader()
    ctx = loader.load()
    if not ctx.enabled:
        return None
    return "\n".join(ctx.to_display_lines())
```

**Benefits:**
- Single source of truth for GSD loading logic
- Compiled regex patterns (performance)
- Clear separation of concerns
- Testable in isolation
- Configurable paths and limits
- Type-safe with dataclass

---

## 2. High Priority Issues

### 2.1 Inconsistent Key Naming Convention

**Problem:** Keys differ between `kimisoul.py` and `prompt.py`:

| kimisoul.py | prompt.py |
|-------------|-----------|
| `gsd_enabled` | `enabled` |
| `gsd_phase` | `phase` |
| `gsd_todos_total` | `todos_total` |
| `gsd_todos_done` | `todos_done` |
| `gsd_milestone` | (missing) |
| `gsd_project` | `project` |

**Impact:** Confusion, potential bugs when passing context between components.

**Fix:** Use consistent naming or provide a mapping utility (see GSDContext class above).

### 2.2 Magic Numbers for Truncation

**Problem:** Hardcoded truncation limits without explanation:

```python
# kimisoul.py line 181
context['gsd_project'] = title_match.group(1)[:30]

# kimisoul.py line 189  
context['gsd_milestone'] = mile_match.group(1).strip()[:20]

# prompt.py line 920
ctx['project'] = match.group(1)[:20]  # Different from kimisoul.py!
```

**Issues:**
1. No explanation why these limits
2. Inconsistent: project is 30 chars in one place, 20 in another
3. Difficult to change globally

**Fix:** Use named constants:

```python
class GSDContextLoader:
    PROJECT_MAX_LEN = 30  # Status bar width constraint
    MILESTONE_MAX_LEN = 20  # Shorter for milestone display
```

### 2.3 Missing Type Hints

**Problem:** Several functions lack proper type hints:

```python
# prompt.py - missing return type
def _get_gsd_context(self):  # Should be -> dict[str, Any]

# kimisoul.py - too generic
def _load_gsd_context(self) -> dict:  # Should be -> dict[str, Any]

# StatusSnapshot in soul/__init__.py has good type hints for GSD fields
```

### 2.4 Regex Patterns Not Compiled

**Problem:** Regex patterns are compiled on every function call:

```python
# kimisoul.py line 171 (executed every time status is checked)
phase_match = re.search(r'Current Phase[:\s]+(\d+)', content, re.IGNORECASE)

# prompt.py line 910
match = re.search(r'Current Phase[:\s]+(\d+)', content, re.I)
```

**Impact:** Unnecessary overhead, especially for status bar that refreshes frequently.

**Fix:** Compile once at module level or in class:

```python
class GSDContextLoader:
    PHASE_PATTERN = re.compile(r'Current Phase[:\s]+(\d+)', re.IGNORECASE)
```

### 2.5 Nested try/except Blocks

**Problem:** Deep nesting makes code hard to follow:

```python
def _load_gsd_context(self) -> dict:
    try:
        # ... setup ...
        try:
            todo_file = work_dir / '.kimi-todos.json'
            if todo_file.exists():
                todos = json.loads(todo_file.read_text())
                # ...
        except Exception:
            pass
        return context
    except Exception:
        return {}
```

**Fix:** Use early returns and context managers:

```python
def _load_todos(self) -> list[dict[str, Any]]:
    todo_file = self.work_dir / self.TODO_FILE
    if not todo_file.exists():
        return []
    try:
        data = json.loads(todo_file.read_text())
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []
```

---

## 3. Medium Priority Issues

### 3.1 Hardcoded File Paths

**Problem:** File paths scattered throughout code:

```python
# kimisoul.py
planning_dir = work_dir / '.planning'
state_file = planning_dir / 'STATE.md'
project_file = planning_dir / 'PROJECT.md'
roadmap_file = planning_dir / 'ROADMAP.md'
todo_file = work_dir / '.kimi-todos.json'

# Same paths repeated in prompt.py and ui/shell/__init__.py
```

**Impact:** Difficult to change GSD directory structure, prone to typos.

**Fix:** Centralize in constants:

```python
# kimi_cli/gsd/constants.py
PLANNING_DIR_NAME = '.planning'
STATE_FILENAME = 'STATE.md'
PROJECT_FILENAME = 'PROJECT.md'
ROADMAP_FILENAME = 'ROADMAP.md'
TODO_FILENAME = '.kimi-todos.json'
```

### 3.2 Local Imports Inside Functions

**Problem:** `pathlib`, `re`, `json` imported inside functions:

```python
def _load_gsd_context(self) -> dict:
    try:
        from pathlib import Path
        import re
        import json
        # ...
```

**Issues:**
1. Performance overhead on every call
2. Hides dependencies from static analysis
3. Unnecessary - no circular import issues

**Fix:** Move to module-level imports.

### 3.3 Inconsistent Regex Flag Usage

**Problem:** Mix of `re.IGNORECASE` and `re.I`:

```python
# kimisoul.py
re.search(r'Current Phase[:\s]+(\d+)', content, re.IGNORECASE)

# prompt.py
re.search(r'Current Phase[:\s]+(\d+)', content, re.I)
```

**Fix:** Use full names for readability (`re.IGNORECASE`).

### 3.4 No Caching for File Reads

**Problem:** Files are read on every status refresh (every 1 second):

```python
# prompt.py - called every refresh interval (1.0s)
def _render_bottom_toolbar(self) -> FormattedText:
    # ...
    gsd_ctx = self._get_gsd_context()  # Reads files every time!
```

**Impact:** Unnecessary disk I/O, especially for frequently-refreshed status bar.

**Fix:** Add caching with TTL:

```python
from functools import lru_cache
import time

class GSDContextLoader:
    _cache: dict[Path, tuple[GSDContext, float]] = {}
    CACHE_TTL = 2.0  # seconds
    
    def load(self) -> GSDContext:
        cache_key = self.work_dir.resolve()
        now = time.monotonic()
        
        if cache_key in self._cache:
            cached_ctx, cached_time = self._cache[cache_key]
            if now - cached_time < self.CACHE_TTL:
                return cached_ctx
        
        ctx = self._load_from_files()
        self._cache[cache_key] = (ctx, now)
        return ctx
```

### 3.5 StatusSnapshot GSD Fields Default Values

**Problem:** In `soul/__init__.py`:

```python
@dataclass(frozen=True, slots=True)
class StatusSnapshot:
    context_usage: float
    yolo_enabled: bool = False
    
    # GSD Extensions
    gsd_enabled: bool = False
    gsd_phase: str | None = None
    gsd_todos_total: int = 0  # Redundant with default
    gsd_todos_done: int = 0   # Redundant with default
    gsd_milestone: str | None = None
    gsd_project: str | None = None
```

**Issue:** `int` fields default to 0 anyway, explicit defaults are redundant but document intent.

**Verdict:** Acceptable as-is for documentation purposes.

---

## 4. Low Priority Issues

### 4.1 GSDStatusEvent Class Location

**Problem:** `GSDStatusEvent` in `wire/types.py` is at the end of file after `__all__`:

```python
# wire/types.py lines 340-376
__all__ = [
    # ...
]

# GSD Extension Events  # <-- Should be before __all__
class GSDStatusEvent(BaseModel):
    """GSD status update event."""
    # ...
```

**Issue:** Unconventional placement, easy to miss.

**Fix:** Move before `__all__` and add to `__all__` list.

### 4.2 Missing Docstrings for GSD Functionality

**Problem:** No module-level or detailed docstrings explaining GSD:

```python
def _load_gsd_context(self) -> dict:
    """Load GSD context from .planning directory."""
    # What is GSD? What's the expected format?
```

**Fix:** Add comprehensive docstrings:

```python
def _load_gsd_context(self) -> dict[str, Any]:
    """
    Load GSD (Goal-Setting & Delivery) context from .planning directory.
    
    Reads project state from:
    - .planning/PROJECT.md: Project name from first H1
    - .planning/STATE.md: Current phase number
    - .planning/ROADMAP.md: Current milestone name
    - .kimi-todos.json: Todo list progress
    
    Returns:
        Dict with gsd_* keys for StatusSnapshot, or empty dict if GSD not enabled.
    """
```

### 4.3 Mixed String Formatting Styles

**Problem:** Multiple string formatting approaches:

```python
# f-strings (preferred)
lines.append(f"   [cyan]{title_match.group(1)}[/cyan]")

# String concatenation with formatting
gsd_str = " | " + " ".join(gsd_parts)
```

**Verdict:** Minor issue, f-strings are used consistently enough.

### 4.4 Unused GSDStatusEvent

**Observation:** `GSDStatusEvent` class defined in `wire/types.py` but not used in the analyzed files. It may be used elsewhere or planned for future use.

**Recommendation:** Either use it for wire communication or remove if dead code.

---

## 5. Positive Aspects

### 5.1 Good Use of pathlib

```python
# Consistent pathlib usage throughout
planning_dir = work_dir / '.planning'
state_file = planning_dir / 'STATE.md'
```

### 5.2 Proper Optional Types

```python
# Good use of union syntax for optional fields
gsd_phase: str | None = None
gsd_milestone: str | None = None
```

### 5.3 Defensive Programming

```python
# Try/except around file operations prevents crashes
try:
    todos = json.loads(todo_file.read_text())
except Exception:
    pass
```

### 5.4 Frozen Dataclass for StatusSnapshot

```python
@dataclass(frozen=True, slots=True)
class StatusSnapshot:
    # Immutable status - good design choice
```

---

## 6. Refactoring Recommendations Summary

### Immediate (Critical)

1. **Extract GSD context loading to shared module**
   - Create `kimi_cli/gsd/context.py`
   - Implement `GSDContext` dataclass and `GSDContextLoader` class
   - Refactor all three functions to use the shared loader

### Short-term (High Priority)

2. **Add proper type hints** to all GSD-related functions
3. **Compile regex patterns** at module/class level
4. **Replace magic numbers** with named constants
5. **Move imports** to module level
6. **Standardize key naming** (use `GSDContext.to_status_dict()` for mapping)

### Medium-term (Nice to Have)

7. **Add caching** for GSD file reads
8. **Centralize file path constants**
9. **Improve documentation** with comprehensive docstrings
10. **Move GSDStatusEvent** before `__all__` in `wire/types.py`

---

## 7. Priority Ranking

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| Code duplication (3 functions) | Critical | Medium | **P0 - Fix Immediately** |
| Inconsistent key naming | High | Low | **P1** |
| Missing type hints | High | Low | **P1** |
| Magic numbers | High | Low | **P1** |
| Regex not compiled | High | Low | **P1** |
| Nested try/except | High | Medium | **P1** |
| Hardcoded paths | Medium | Low | **P2** |
| Local imports | Medium | Low | **P2** |
| No file read caching | Medium | Medium | **P2** |
| GSDStatusEvent placement | Low | Low | **P3** |
| Missing docstrings | Low | Low | **P3** |

---

## Appendix: Code Metrics

### File Sizes
| File | Lines | GSD-related Lines |
|------|-------|-------------------|
| soul/__init__.py | 224 | ~18 (StatusSnapshot) |
| soul/kimisoul.py | 783 | ~58 (_load_gsd_context) |
| ui/shell/__init__.py | 402 | ~31 (_get_gsd_welcome) |
| ui/shell/prompt.py | 1011 | ~48 (_get_gsd_context) |
| wire/types.py | 388 | ~9 (GSDStatusEvent) |

### Duplication Summary
- **58%** of GSD code is duplicated across 3 files
- Same regex patterns: 3x
- Same file reading logic: 3x
- Same error handling: 3x

### Testability
Current: Hard to test (tight coupling, file system dependency)  
After refactoring: Easy to test (isolated GSDContextLoader with injectable paths)
