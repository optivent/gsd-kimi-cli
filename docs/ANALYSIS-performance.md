# GSD Patches Performance Analysis

## Executive Summary

The GSD patches introduce significant performance bottlenecks by reading multiple files from disk on **every status bar refresh** (every 1 second + every prompt render). In a typical terminal session with GSD active, this results in **4-6 file reads per second** with no caching mechanism.

---

## Performance Bottleneck Inventory

### 🔴 CRITICAL: File I/O Issues

| Issue | Location | Impact | Current Behavior |
|-------|----------|--------|------------------|
| **STATE.md read on every render** | `prompt.py:909`, `kimisoul.py:170` | **HIGH** | Full file read + regex parse every 1s |
| **PROJECT.md read on every render** | `prompt.py:917`, `kimisoul.py:178` | **HIGH** | Full file read + regex parse every 1s |
| **ROADMAP.md read (kimisoul only)** | `kimisoul.py:185` | **MEDIUM** | Full file read + regex parse, rarely displayed |
| **.kimi-todos.json read on every render** | `prompt.py:924`, `kimisoul.py:194` | **HIGH** | Full JSON parse + array iteration every 1s |
| **No mtime checking** | All file reads | **HIGH** | Always reads fresh, even if unchanged |
| **File existence checks** | `planning_dir.exists()` | **MEDIUM** | Called even in non-project directories |

**Estimated Impact:** 
- Local SSD: ~2-5ms per render × 4 files = **8-20ms/render**
- Network drive: ~20-50ms per render × 4 files = **80-200ms/render**
- With 1s refresh interval: **0.8-20% CPU overhead** just for status bar

---

### 🟡 HIGH: Regex Performance

| Issue | Location | Impact | Pattern |
|-------|----------|--------|---------|
| **Regex re-compiled every call** | `prompt.py:910`, `kimisoul.py:171` | **HIGH** | `r'Current Phase[:
]+(\d+)'` |
| **Regex re-compiled every call** | `prompt.py:918`, `kimisoul.py:179` | **HIGH** | `r'^#\s+(.+)$'` |
| **Regex re-compiled every call** | `kimisoul.py:187` | **MEDIUM** | `r'##\s+Current Milestone[:\s]*([^\n]+)'` |
| **Case-insensitive flag varies** | Mixed | **LOW** | `re.I` vs `re.IGNORECASE` - inconsistent |

**Performance Loss:**
- Python regex compilation: ~50-100μs per pattern
- 3 patterns × 2 locations × 1 render/sec = **300-600μs/sec wasted**
- With 1000+ renders/hour: **0.3-0.6 seconds/hour** of compilation overhead

---

### 🟠 MEDIUM: Algorithm Efficiency

| Issue | Location | Impact | Description |
|-------|----------|--------|-------------|
| **Todo array fully iterated** | `prompt.py:928`, `kimisoul.py:197` | **MEDIUM** | `sum(1 for t in todos if t.get('done'))` - O(n) every render |
| **JSON fully parsed** | `prompt.py:926`, `kimisoul.py:195` | **MEDIUM** | Entire todo file parsed even if only count needed |
| **Full file content held** | All reads | **MEDIUM** | Entire file content in memory for regex only |
| **Path construction repeated** | Multiple | **LOW** | `Path.cwd()` called multiple times per render |
| **Duplicate code** | Both files | **MAINTENANCE** | Nearly identical `_load_gsd_context()` functions |

**Todo Counting Inefficiency:**
```python
# Current (O(n) every render):
ctx['todos_done'] = sum(1 for t in todos if t.get('done'))

# Optimized (O(1) with cache):
# Cache invalidated only when .kimi-todos.json mtime changes
```

---

### 🟢 LOW: Memory Considerations

| Issue | Impact | Description |
|-------|--------|-------------|
| No streaming for large files | **LOW** | STATE.md/PROJECT.md typically small (<10KB) |
| String copies in regex | **LOW** | Content sliced for patterns, but GC handles it |
| No memory leaks detected | **GOOD** | Local variables properly scoped |

---

## Code Analysis: Current Implementation

### prompt.py (lines 887-934)
```python
def _get_gsd_context(self):
    """Load GSD context from .planning directory."""
    # ISSUE: No caching - called every render
    # ISSUE: Called even in non-project directories
    planning_dir = Path.cwd() / '.planning'
    if not planning_dir.exists():  # Disk hit #1
        return {}
    
    # ISSUE: Full file read every time
    state_file = planning_dir / 'STATE.md'
    if state_file.exists():  # Disk hit #2
        content = state_file.read_text()  # Disk hit #3 - FULL READ
        match = re.search(r'Current Phase[:
]+(
+)', content, re.I)  # Re-compiled!
    
    # ISSUE: Same pattern repeated for PROJECT.md, .kimi-todos.json
    # ... more file reads ...
```

### kimisoul.py (lines 146-203)
```python
def _load_gsd_context(self) -> dict:
    """Load GSD context from .planning directory."""
    # ISSUE: Duplicate implementation of prompt.py logic
    # ISSUE: Additional ROADMAP.md read (not used in prompt.py)
    # Same file I/O issues as prompt.py
```

---

## Profiling Suggestions

### 1. Quick Benchmark (immediate)
```python
import time
import statistics

def benchmark_gsd_load():
    times = []
    for _ in range(100):
        start = time.perf_counter()
        _get_gsd_context()  # Current implementation
        times.append((time.perf_counter() - start) * 1000)
    
    print(f"Median: {statistics.median(times):.3f}ms")
    print(f"Mean: {statistics.mean(times):.3f}ms")
    print(f"Max: {max(times):.3f}ms")

# Expected results (local SSD):
# Median: 2-5ms per call
# With 1s refresh: ~0.5% overhead
```

### 2. File System Monitoring
```bash
# Monitor file access during 10s of runtime
sudo fs_usage -w | grep -E "(STATE|PROJECT|ROADMAP|kimi-todos)"

# Expected: 40-60 file reads in 10 seconds (4 files × 1/sec × 10s)
```

### 3. Python cProfile
```python
# Add to prompt.py temporarily
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()
# ... run 100 renders ...
profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 time consumers
```

---

## Optimization Recommendations

### Strategy 1: File-Based Caching with mtime (RECOMMENDED)

**Effort:** 2-3 hours  
**Speedup:** 80-95%  
**Impact:** HIGH

```python
import os
from functools import lru_cache
from pathlib import Path

class GSDCache:
    """Cache GSD context with mtime-based invalidation."""
    
    def __init__(self, ttl: float = 1.0):
        self._cache: dict[str, tuple[float, any]] = {}
        self._ttl = ttl
        self._regexes = {
            'phase': re.compile(r'Current Phase[:\s]+(\d+)', re.I),
            'project': re.compile(r'^#\s+(.+)$', re.M),
            'milestone': re.compile(r'##\s+Current Milestone[:\s]*([^\n]+)', re.I),
        }
    
    def _get_cached(self, key: str, file_path: Path, loader: Callable) -> any:
        """Get cached value or reload if file changed."""
        try:
            mtime = os.path.getmtime(file_path)
            cached_mtime, cached_value = self._cache.get(key, (0, None))
            
            if mtime > cached_mtime or time.monotonic() - cached_mtime > self._ttl:
                value = loader(file_path)
                self._cache[key] = (mtime, value)
                return value
            return cached_value
        except (OSError, FileNotFoundError):
            self._cache.pop(key, None)
            return None
    
    def get_gsd_context(self) -> dict:
        work_dir = Path.cwd()
        planning_dir = work_dir / '.planning'
        
        if not planning_dir.exists():
            return {}
        
        ctx = {'enabled': True, 'phase': None, 'todos_total': 0, 
               'todos_done': 0, 'project': None}
        
        # Cache individual file reads
        state_content = self._get_cached(
            'state', planning_dir / 'STATE.md', 
            lambda p: p.read_text()
        )
        if state_content:
            match = self._regexes['phase'].search(state_content)
            if match:
                ctx['phase'] = match.group(1)
        
        # Similar for PROJECT.md, ROADMAP.md, .kimi-todos.json...
        return ctx

# Singleton instance
_gsd_cache = GSDCache(ttl=1.0)

def _get_gsd_context():
    return _gsd_cache.get_gsd_context()
```

### Strategy 2: Inotify/Watchdog-Based Cache (ADVANCED)

**Effort:** 1-2 days  
**Speedup:** 95-99%  
**Impact:** HIGH (but more complex)

```python
# Only reload when files actually change
# Requires: pip install watchdog

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class GSDFileWatcher(FileSystemEventHandler):
    def __init__(self):
        self._context = {}
        self._observer = Observer()
    
    def on_modified(self, event):
        if not event.is_directory:
            self._reload_context()
    
    def start(self, planning_dir: Path):
        self._observer.schedule(self, str(planning_dir), recursive=False)
        self._observer.start()
```

### Strategy 3: Lazy Loading + Deferred Updates (SIMPLE)

**Effort:** 1 hour  
**Speedup:** 50-70%  
**Impact:** MEDIUM

```python
# Only load GSD context every N renders or when needed
def __init__(self, ...):
    self._gsd_cache = None
    self._gsd_cache_time = 0
    self._gsd_cache_ttl = 5.0  # 5 second cache

def _get_gsd_context(self):
    now = time.monotonic()
    if now - self._gsd_cache_time < self._gsd_cache_ttl:
        return self._gsd_cache
    
    self._gsd_cache = self._load_gsd_context_fresh()
    self._gsd_cache_time = now
    return self._gsd_cache
```

### Strategy 4: Pre-compiled Regexes (QUICK WIN)

**Effort:** 15 minutes  
**Speedup:** 5-10%  
**Impact:** LOW (but easy)

```python
# Module-level compiled patterns
_GSD_REGEXES = {
    'phase': re.compile(r'Current Phase[:\s]+(\d+)', re.IGNORECASE),
    'project': re.compile(r'^#\s+(.+)$', re.MULTILINE),
    'milestone': re.compile(r'##\s+Current Milestone[:\s]*([^\n]+)', re.IGNORECASE),
}

# Use in code:
match = _GSD_REGEXES['phase'].search(content)
```

### Strategy 5: Consolidate Duplicate Code

**Effort:** 30 minutes  
**Speedup:** Maintenance only  
**Impact:** Code quality

```python
# Create shared module: kimi_cli/utils/gsd_context.py
from kimi_cli.utils.gsd_context import load_gsd_context

# Use in both prompt.py and kimisoul.py
# Single source of truth, single cache
```

---

## Priority Matrix

| Optimization | Impact | Effort | Speedup | Priority |
|--------------|--------|--------|---------|----------|
| File caching with mtime | HIGH | 2-3 hrs | 80-95% | **P0 - DO FIRST** |
| Pre-compile regexes | MEDIUM | 15 min | 5-10% | **P1 - QUICK WIN** |
| Lazy loading (5s TTL) | MEDIUM | 1 hr | 50-70% | **P1 - BACKUP PLAN** |
| Consolidate duplicate code | LOW | 30 min | N/A | **P2 - MAINTENANCE** |
| Inotify watcher | HIGH | 1-2 days | 95-99% | **P3 - NICE TO HAVE** |
| Optimize todo counting | LOW | 30 min | 5-10% | **P3 - IF NEEDED** |

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Today - 1 hour)
1. **Pre-compile regexes** (15 min)
2. **Add simple TTL cache** (30 min)
3. **Test benchmark** (15 min)

### Phase 2: Proper Fix (This Week - 3-4 hours)
1. **Implement mtime-based file cache** (2 hours)
2. **Consolidate duplicate code** (30 min)
3. **Add proper error handling** (30 min)
4. **Add profiling/metrics** (1 hour)

### Phase 3: Advanced (Future)
1. **Inotify-based watcher** (if needed)
2. **Async file I/O** (if needed)
3. **Memory-mapped files** (for very large todo lists)

---

## Expected Performance After Optimization

| Metric | Before | After (Phase 1) | After (Phase 2) |
|--------|--------|-----------------|-----------------|
| File reads/render | 3-4 | 0-1 | 0 (cached) |
| Regex compiles/render | 3 | 0 | 0 |
| Time per render (SSD) | 2-5ms | 0.1-0.5ms | 0.01-0.1ms |
| Time per render (network) | 20-100ms | 0.1-0.5ms | 0.01-0.1ms |
| CPU overhead | 0.5-20% | <0.1% | <0.01% |

---

## Additional Considerations

### Network Drives
The current implementation will be **very slow** on network drives (NFS, SMB). File existence checks alone can take 10-50ms. The caching strategy is **essential** for network drive users.

### Large Todo Files
If `.kimi-todos.json` grows large (>1000 todos), JSON parsing becomes expensive. Consider:
- Storing counts separately
- Using line-delimited JSON for streaming
- Caching parsed result with structure hash

### Concurrent Access
Multiple kimi-cli instances could have stale caches. Consider:
- File locking for writes
- Shared memory cache (overkill for this use case)
- Acceptable staleness (1-5 seconds)

---

## Code Review Checklist

- [ ] All regexes pre-compiled at module level
- [ ] File reads use mtime-based cache
- [ ] Cache TTL configurable (env var or config)
- [ ] Error handling for missing files
- [ ] Error handling for permission denied
- [ ] Error handling for malformed JSON
- [ ] Single source of truth for GSD context loading
- [ ] Benchmark tests added
- [ ] Memory usage verified (no leaks)
- [ ] Network drive performance tested

---

## Files to Modify

1. **`kimi_cli/ui/shell/prompt.py`**
   - Modify `_get_gsd_context()` to use cache
   - Remove local imports (move to top)

2. **`kimi_cli/soul/kimisoul.py`**
   - Replace `_load_gsd_context()` with shared implementation
   - Or call into shared utility

3. **NEW: `kimi_cli/utils/gsd_context.py`**
   - Shared GSD context loader
   - Caching implementation
   - Pre-compiled regexes

---

*Analysis completed. Priority: P0 (file caching) should be implemented immediately for best user experience.*
