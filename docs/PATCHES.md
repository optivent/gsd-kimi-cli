# GSD Patches - Technical Documentation

Technical reference for the GSD Kimi CLI patches.

## Overview

The GSD patches consist of:
1. **Patcher Script** (`kimi_cli_patcher.py`) - Applies/restores patches
2. **Wrapper Script** (`jim-wrapper.py`) - Convenience launcher with auto-patching

## Patched Files

Five Kimi CLI source files are modified:

| # | File | Purpose |
|---|------|---------|
| 1 | `ui/shell/prompt.py` | Status bar GSD indicators |
| 2 | `soul/__init__.py` | StatusSnapshot GSD fields |
| 3 | `soul/kimisoul.py` | GSD context loading |
| 4 | `ui/shell/__init__.py` | GSD welcome message |
| 5 | `wire/types.py` | GSD wire event types |

---

## Patch 1: `ui/shell/prompt.py`

**Purpose**: Adds GSD status indicators to the bottom toolbar/status bar.

### Changes Made

#### 1. Added `_get_gsd_context()` method

```python
def _get_gsd_context(self) -> dict:
    """Load GSD context from .planning directory."""
    try:
        from pathlib import Path
        import re
        import json
        import os
        
        planning_dir = Path.cwd() / '.planning'
        if not planning_dir.exists():
            return {}
        
        context = {
            'enabled': True,
            'phase': None,
            'todos_total': 0,
            'todos_done': 0,
            'milestone': None,
            'project': None,
        }
        
        # Parse STATE.md for current phase
        state_file = planning_dir / 'STATE.md'
        if state_file.exists():
            content = state_file.read_text()
            phase_match = re.search(r'Current Phase[:\s]+(\d+)', content, re.IGNORECASE)
            if phase_match:
                context['phase'] = phase_match.group(1)
        
        # Parse PROJECT.md for project name
        project_file = planning_dir / 'PROJECT.md'
        if project_file.exists():
            content = project_file.read_text()
            title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            if title_match:
                context['project'] = title_match.group(1)[:25]  # Truncate
        
        # Count todos from session
        session_id = os.environ.get('KIMI_SESSION_ID', '')
        if session_id:
            todos_file = Path.home() / '.kimi' / 'todos' / f'{session_id}.json'
            if todos_file.exists():
                todos = json.loads(todos_file.read_text())
                context['todos_total'] = len(todos)
                context['todos_done'] = sum(1 for t in todos if t.get('done'))
        
        return context
    except Exception:
        return {}
```

#### 2. Modified `_render_bottom_toolbar()`

Adds GSD display logic after mode display:

```python
# ADD: GSD context
gsd_ctx = self._get_gsd_context()
if gsd_ctx.get('enabled'):
    gsd_parts = []
    if gsd_ctx.get('phase'):
        gsd_parts.append(f"📋P{gsd_ctx['phase']}")
    if gsd_ctx.get('todos_total'):
        done = gsd_ctx.get('todos_done', 0)
        total = gsd_ctx['todos_total']
        gsd_parts.append(f"✅{done}/{total}")
    if gsd_parts:
        gsd_str = " | " + " ".join(gsd_parts)
        fragments.extend([("fg:#00ff00", gsd_str), ("", " ")])
        columns -= len(gsd_str) + 1
```

### Key Points

- Runs on every status bar render
- Safely handles missing files (returns empty context)
- Truncates long project names to 25 characters
- Uses bright green color (`#00ff00`) for visibility
- Adjusts column count to prevent layout issues

---

## Patch 2: `soul/__init__.py`

**Purpose**: Extends `StatusSnapshot` dataclass with GSD fields.

### Changes Made

Added GSD fields to `StatusSnapshot`:

```python
@dataclass(frozen=True, slots=True)
class StatusSnapshot:
    """Status snapshot for the soul."""

    context_usage: float
    """The usage of the context, in percentage."""

    yolo_enabled: bool
    """Whether YOLO mode is enabled."""
    
    # GSD Extensions
    gsd_enabled: bool = False
    """Whether GSD is active in current project."""
    
    gsd_phase: str | None = None
    """Current GSD phase number."""
    
    gsd_todos_total: int = 0
    """Total number of GSD todos."""
    
    gsd_todos_done: int = 0
    """Number of completed GSD todos."""
    
    gsd_milestone: str | None = None
    """Current GSD milestone name."""
    
    gsd_project: str | None = None
    """Current GSD project name."""
```

### Key Points

- Uses default values for backward compatibility
- Fields are optional (nullable strings)
- Frozen dataclass maintains immutability
- Provides type hints for IDE support

---

## Patch 3: `soul/kimisoul.py`

**Purpose**: Adds GSD context loading to the KimiSoul class.

### Changes Made

#### 1. Added `_load_gsd_context()` method

```python
def _load_gsd_context(self) -> dict:
    """Load GSD context from .planning directory."""
    try:
        from pathlib import Path
        import re
        import json
        import os
        
        work_dir = Path(str(self.runtime.builtin_args.KIMI_WORK_DIR))
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

#### 2. Enhanced `status` property

```python
@property
def status(self) -> StatusSnapshot:
    base = StatusSnapshot(
        context_usage=self._context_usage,
        yolo_enabled=self._approval.is_yolo(),
    )
    
    # Add GSD context
    gsd_ctx = self._load_gsd_context()
    if gsd_ctx.get('gsd_enabled'):
        return StatusSnapshot(
            context_usage=base.context_usage,
            yolo_enabled=base.yolo_enabled,
            **gsd_ctx
        )
    return base
```

### Key Points

- Uses `KIMI_WORK_DIR` for reliable path resolution
- Reads from `.kimi-todos.json` in project root
- Truncates strings: project (30), milestone (20)
- Returns base snapshot if GSD not enabled
- Silently handles all errors (returns empty context)

---

## Patch 4: `ui/shell/__init__.py`

**Purpose**: Adds GSD welcome message on session startup.

### Changes Made

#### 1. Added `_get_gsd_welcome()` function

```python
def _get_gsd_welcome() -> str | None:
    """Generate GSD welcome message."""
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
        
        return "\\n".join(lines)
    except Exception:
        return None
```

#### 2. Modified `_print_welcome_info()`

```python
def _print_welcome_info(name: str, items: list[WelcomeInfoItem] | None):
    console.print()
    console.print(f"[bold]{name}[/bold]", justify="center")
    
    # ADD: GSD welcome
    gsd_welcome = _get_gsd_welcome()
    if gsd_welcome:
        console.print()
        console.print(gsd_welcome)
```

### Key Points

- Uses Rich markup for colored output
- Returns `None` if not in GSD project
- Called during welcome screen rendering
- Non-blocking (errors silently ignored)

---

## Patch 5: `wire/types.py`

**Purpose**: Adds GSD-specific wire event types for future extensibility.

### Changes Made

Added GSD event type at end of file:

```python
# GSD Extension Events
class GSDStatusEvent(BaseModel):
    """GSD status update event."""
    
    type: Literal["gsd_status"] = "gsd_status"
    phase: str | None = None
    todos_total: int = 0
    todos_done: int = 0
    milestone: str | None = None
    project: str | None = None
```

### Key Points

- Extends Pydantic BaseModel
- Uses Literal type for discriminated unions
- Prepared for future wire protocol extensions
- Currently informational (not actively used)

---

## Patcher Script Architecture

### `kimi_cli_patcher.py`

#### Core Classes

```python
@dataclass
class Patch:
    """Represents a single file patch."""
    name: str                    # Display name
    target: Path                 # File to patch
    backup: Path                 # Backup location
    patch_func: Callable[[str], str]  # Transformation function
    description: str             # Human-readable description
```

#### Key Functions

| Function | Purpose |
|----------|---------|
| `get_kimi_cli_root()` | Auto-detects Kimi CLI installation |
| `backup_file()` | Creates `.gsd-backup` files |
| `restore_file()` | Restores from backup |
| `verify_python_syntax()` | Validates patched code |
| `apply_patch()` | Applies single patch safely |
| `apply_all_patches()` | Applies all patches |
| `restore_all_patches()` | Restores all files |

#### Commands

```bash
python3 kimi_cli_patcher.py apply    # Apply patches
python3 kimi_cli_patcher.py restore  # Restore originals
python3 kimi_cli_patcher.py status   # Check status
```

---

## Wrapper Script Architecture

### `jim-wrapper.py`

#### Features

1. **Auto-patching**: Checks for backups on startup, patches if needed
2. **GSD Agent**: Auto-loads `~/.kimi/gsd-agent.yaml` if exists
3. **Welcome**: Shows project info on launch
4. **Passthrough**: Passes all arguments to `kimi`

#### Key Functions

```python
def ensure_patched() -> bool:
    """Apply patches on first run."""
    
def get_gsd_welcome() -> str | None:
    """Generate one-line welcome message."""
    
def launch_kimi(args: list[str]) -> int:
    """Launch kimi with GSD agent."""
```

#### Usage

```bash
./jim-wrapper.py           # Launch kimi
./jim-wrapper.py --patch   # Force re-patch
./jim-wrapper.py --restore # Restore originals
./jim-wrapper.py --status  # Check status
./jim-wrapper.py [args]    # Pass args to kimi
```

---

## Safety Mechanisms

### 1. Backup Creation

- Backups created before any modification
- Suffix: `.gsd-backup`
- Only created if backup doesn't exist

### 2. Syntax Verification

```python
def verify_python_syntax(code: str, filename: str) -> bool:
    try:
        compile(code, filename, 'exec')
        return True
    except SyntaxError as e:
        print(f"  ❌ Syntax error: {e}")
        return False
```

### 3. Change Detection

```python
if original == patched:
    print(f"  ⚠️  No changes needed")
    return True
```

### 4. Error Handling

All patches wrapped in try/except:
- File not found → Skip gracefully
- Parse error → Return empty context
- Syntax error → Abort patch

---

## File Locations

### Kimi CLI Installation (Auto-detected)

```
~/.local/share/uv/tools/kimi-cli/lib/python3.X/site-packages/kimi_cli/
├── ui/shell/prompt.py
├── ui/shell/__init__.py
├── soul/__init__.py
├── soul/kimisoul.py
└── wire/types.py
```

### Backup Files

```
kimi_cli/
├── ui/shell/prompt.py.gsd-backup
├── ui/shell/__init__.py.gsd-backup
├── soul/__init__.py.gsd-backup
├── soul/kimisoul.py.gsd-backup
└── wire/types.py.gsd-backup
```

---

## Regex Patterns Used

| Purpose | Pattern | Example Match |
|---------|---------|---------------|
| Phase | `Current Phase[:\s]+(\d+)` | `Current Phase: 3` |
| Project | `^#\s+(.+)$` | `# My Project` |
| Milestone | `##\s+Current Milestone[:\s]*([^\n]+)` | `## Current Milestone: MVP` |

---

## Version Compatibility

- **Kimi CLI**: Compatible with latest versions
- **Python**: 3.11, 3.12, 3.13+
- **Pydantic**: v2 (for wire types)

---

## Future Extensions

Potential additions to GSDStatusEvent:

```python
class GSDStatusEvent(BaseModel):
    # ... existing fields ...
    
    # Future additions
    phase_name: str | None = None
    milestone_due: str | None = None
    completion_percent: float = 0.0
    blocked_tasks: int = 0
```
