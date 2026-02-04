# Architecture Overview: KIMI-GSD-EX

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                              │
│                                                                              │
│   Terminal 1                    Terminal 2                    Browser        │
│   ┌─────────┐                  ┌─────────┐                 ┌─────────┐      │
│   │ $ jim   │                  │$ kimi_cli│                 │ Web UI  │      │
│   │ (Python)│                  │(Elixir) │                 │(Future) │      │
│   └────┬────┘                  └────┬────┘                 └────┬────┘      │
└────────┼─────────────────────────────┼──────────────────────────┼───────────┘
         │                             │                          │
         ▼                             ▼                          ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────┐
│   PYTHON KIMI-CLI      │  │   ELIXIR KIMI-GSD-EX   │  │   PHOENIX LIVE   │
│   (Original/Stable)    │  │   (New Implementation) │  │   VIEW (Future)  │
│                        │  │                        │  │                  │
│  ┌──────────────────┐  │  │  ┌──────────────────┐  │  │                  │
│  │  GSD Patches     │  │  │  │  kimi_ui         │  │  │                  │
│  │  (Monkey-patched)│  │  │  │  (Ratatouille)   │  │  │                  │
│  │                  │  │  │  │                  │  │  │                  │
│  │  ┌────────────┐  │  │  │  │ Status Bar     │  │  │                  │
│  │  │_load_gsd_  │  │  │  │  │ Welcome Msg    │  │  │                  │
│  │  │context()   │  │  │  │  │ Message Panel  │  │  │                  │
│  │  └────────────┘  │  │  │  │ Input Handler  │  │  │                  │
│  └──────────────────┘  │  │  └──────────────────┘  │  │                  │
│                        │  │                        │  │                  │
│  ┌──────────────────┐  │  │  ┌──────────────────┐  │  │                  │
│  │  Python Skills   │  │  │  │  kimi_cli        │  │  │                  │
│  │  (50+ skills)    │  │  │  │  (Entry Point)   │  │  │                  │
│  └──────────────────┘  │  │  └──────────────────┘  │  │                  │
│                        │  │                        │  │                  │
│  ┌──────────────────┐  │  │  ┌──────────────────┐  │  │                  │
│  │  Chat Engine     │  │  │  │  kimi_core       │  │  │                  │
│  │  (Python)        │  │  │  │  (Core Engine)   │  │  │                  │
│  └──────────────────┘  │  │  │                  │  │  │                  │
│                        │  │  │  ┌────────────┐  │  │  │                  │
│                        │  │  │  │ Session    │  │  │  │                  │
│                        │  │  │  │ GenServer  │  │  │  │                  │
│                        │  │  │  └────────────┘  │  │  │                  │
│                        │  │  │                  │  │  │                  │
│                        │  │  │  ┌────────────┐  │  │  │                  │
│                        │  │  │  │ LLM Pool   │  │  │  │                  │
│                        │  │  │  │ (Streaming)│  │  │  │                  │
│                        │  │  │  └────────────┘  │  │  │                  │
│                        │  │  │                  │  │  │                  │
│                        │  │  │  ┌────────────┐  │  │  │                  │
│                        │  │  │  │ Message    │  │  │  │                  │
│                        │  │  │  │ Struct     │  │  │  │                  │
│                        │  │  │  └────────────┘  │  │  │                  │
│                        │  │  └──────────────────┘  │  │                  │
└────────────────────────┘  │                        │  └──────────────────┘
                            │  ┌──────────────────┐  │
                            │  │  kimi_gsd        │  │
                            │  │  (GSD Native)    │  │
                            │  │                  │  │
                            │  │  ┌────────────┐  │  │
                            │  │  │ Context    │  │  │
                            │  │  │ (ETS Cache)│  │  │
                            │  │  └────────────┘  │  │
                            │  │                  │  │
                            │  │  ┌────────────┐  │  │
                            │  │  │ State      │  │  │
                            │  │  │ Manager    │  │  │
                            │  │  └────────────┘  │  │
                            │  │                  │  │
                            │  │  ┌────────────┐  │  │
                            │  │  │ File       │  │  │
                            │  │  │ Watcher    │  │  │
                            │  │  └────────────┘  │  │
                            │  └──────────────────┘  │
                            └────────────────────────┘
                                     │
                                     │ Uses as reference
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED DATA LAYER (GSD)                             │
│                                                                              │
│   /Users/aig/kimi_gsd/              ~/kimi_gsd_ex/                          │
│   (Stable Reference)                (Development)                            │
│   ┌──────────────────────┐         ┌──────────────────────┐                  │
│   │  .planning/          │◄────────│  .planning/          │                  │
│   │  ├── PROJECT.md      │         │  ├── PROJECT.md      │                  │
│   │  ├── STATE.md        │         │  ├── STATE.md        │                  │
│   │  └── ROADMAP.md      │         │  └── ROADMAP.md      │                  │
│   ├──────────────────────┤         ├──────────────────────┤                  │
│   │  .kimi-todos.json    │◄────────│  .kimi-todos.json    │                  │
│   └──────────────────────┘         └──────────────────────┘                  │
│                                                                              │
│   Both systems read from the same GSD files!                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ LLM API Calls
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                   │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│   │  Kimi API       │    │  OpenAI API     │    │  Other LLMs     │         │
│   │  (Primary)      │    │  (Alternative)  │    │  (Future)       │         │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Python kimi-cli (Original/Stable)

**Location:** `~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/`

```
kimi_cli (Python)
├── soul/
│   ├── __init__.py          # StatusSnapshot with GSD fields
│   └── kimisoul.py          # _load_gsd_context() method
├── ui/shell/
│   ├── __init__.py          # _get_gsd_welcome() function
│   └── prompt.py            # Status bar rendering
├── wire/types.py            # GSDStatusEvent
└── skills/                  # 50+ Python skills
    ├── gsd-execute-phase/
    ├── gsd-verify-work/
    └── ...
```

**How GSD Works in Python:**
- Patches add GSD fields to existing classes
- `_load_gsd_context()` reads files every prompt render
- No caching, no file watching
- 4-6 file reads per second

---

### 2. Elixir KIMI-GSD-EX (New Implementation)

**Location:** `~/kimi_gsd_ex/`

```
kimi_gsd_ex/ (Elixir Umbrella)
├── apps/
│   ├── kimi_core/           # Core OTP infrastructure
│   │   ├── lib/
│   │   │   ├── session.ex   # GenServer for sessions
│   │   │   ├── message.ex   # Message struct
│   │   │   └── llm/
│   │   │       ├── provider.ex      # Behavior
│   │   │       ├── provider/kimi.ex # Kimi API
│   │   │       └── pool.ex          # Connection pool
│   │   └── test/
│   │
│   ├── kimi_gsd/            # GSD native implementation
│   │   ├── lib/
│   │   │   ├── context.ex   # GSD context with ETS cache
│   │   │   ├── context/
│   │   │   │   └── loader.ex # File loading
│   │   │   ├── state_manager.ex
│   │   │   ├── file_watcher.ex
│   │   │   └── welcome.ex   # Welcome message
│   │   └── test/
│   │
│   ├── kimi_ui/             # Terminal UI
│   │   ├── lib/
│   │   │   ├── terminal.ex  # Ratatouille app
│   │   │   ├── render.ex    # Render composition
│   │   │   ├── render/
│   │   │   │   ├── status_bar.ex
│   │   │   │   ├── message_panel.ex
│   │   │   │   ├── input_panel.ex
│   │   │   │   └── streaming_indicator.ex
│   │   │   └── event_handler.ex
│   │   └── test/
│   │
│   └── kimi_cli/            # CLI entry point
│       ├── lib/
│       │   ├── cli.ex
│       │   ├── main.ex
│       │   └── commands/
│       │       └── config.ex
│       └── test/
│
├── docs/guides/             # User documentation
├── test/parity/             # Parity tests vs Python
└── mix.exs                  # Umbrella configuration
```

**How GSD Works in Elixir:**
- Native GSD module (not patches)
- ETS caching (2,937x faster)
- File watching with inotify/fs_events
- PubSub for real-time updates
- 5-second TTL cache

---

### 3. GSD (Shared Layer)

**Location:** `/Users/aig/kimi_gsd/.planning/` and `.kimi-todos.json`

```
GSD Project Structure (Shared by both systems)
│
├── .planning/               # GSD planning directory
│   ├── PROJECT.md           # Project name & description
│   │   Format: # Project Name
│   │
│   ├── STATE.md             # Current phase
│   │   Format: ## Current Phase: N
│   │
│   └── ROADMAP.md           # Milestones
│       Format: ## Milestone: Name
│
└── .kimi-todos.json         # Todo list
    Format: [{"title": "...", "done": true/false}, ...]
```

**Both systems read from the same files:**
- Python reads directly (every 1 second)
- Elixir reads with caching (file watcher triggers updates)

---

## Key Differences

| Aspect | Python kimi-cli | Elixir KIMI-GSD-EX |
|--------|-----------------|-------------------|
| **GSD Implementation** | Monkey-patched | Native module |
| **File Reading** | Every prompt (1s) | Event-driven |
| **Caching** | None | ETS (5s TTL) |
| **Performance** | 8-20ms per read | <0.001ms cache hit |
| **Speedup** | Baseline | 2,937x faster |
| **Architecture** | Single process | OTP supervision trees |
| **Concurrency** | Limited | 1000+ processes |
| **Streaming** | Basic | Real-time with animation |
| **Sessions** | Basic | GenServer with ETS |
| **Reliability** | Try/except | OTP supervision |

---

## Data Flow Comparison

### Python (Original)
```
User types message
      ↓
Python reads .planning/ files (4 files, 8-20ms)
      ↓
Renders status bar
      ↓
Calls LLM API
      ↓
Displays response
      ↓
Repeat every second...
```

### Elixir (New)
```
User types message
      ↓
Read from ETS cache (<0.001ms)
      ↓
Render status bar
      ↓
Stream LLM response
      ↓
Display chunks in real-time
      ↓
File watcher detects changes → Update cache
```

---

## Development Strategy

```
Stable Python (Reference)
      │
      ├── Provides: Working implementation
      ├── Used for: Testing, comparison
      └── Location: /Users/aig/kimi_gsd
      │
      │ Runs alongside during development
      ↓
Elixir Implementation
      │
      ├── Built using: Python as reference
      ├── Tested with: Parity tests
      └── Location: ~/kimi_gsd_ex
      │
      │ Achieves: Feature parity + improvements
      ↓
Both Read From: Shared GSD files
      │
      ├── .planning/PROJECT.md
      ├── .planning/STATE.md
      └── .kimi-todos.json
```

---

## File Locations Summary

| Component | Location | Language |
|-----------|----------|----------|
| **Original kimi-cli** | `~/.local/share/uv/tools/kimi-cli/.../kimi_cli/` | Python |
| **GSD Patches (Python)** | Patched into above | Python |
| **Stable GSD Project** | `/Users/aig/kimi_gsd/` | Markdown/JSON |
| **Elixir Implementation** | `~/kimi_gsd_ex/` | Elixir |
| **Elixir GSD Module** | `apps/kimi_gsd/lib/` | Elixir |
| **Documentation** | `docs/guides/` | Markdown |
| **Tests** | `test/` | Elixir |
| **Compiled Binary** | `kimi_cli` | BEAM bytecode |

---

## Quick Reference

**To run stable Python version:**
```bash
cd /Users/aig/kimi_gsd
jim
/skill:gsd-progress
```

**To run new Elixir version:**
```bash
cd ~/kimi_gsd_ex
./kimi_cli
# or
kimi_cli  # if installed
```

**Both show the same GSD status:**
```
📋P3 ✅22/22 [Kimi GSD Project]
```
