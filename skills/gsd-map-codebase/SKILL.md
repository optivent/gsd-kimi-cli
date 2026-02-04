---
name: gsd-map-codebase
description: Map and analyze the codebase structure
type: standard
---

# GSD Map Codebase

Map and analyze the codebase structure. Creates CODEBASE-MAP.md with architecture overview.

## Arguments

```
/skill:gsd-map-codebase [--output=map.md]
```

## Process

### Step 1: Check for Existing Map

```bash
if [ -f .planning/CODEBASE-MAP.md ]; then
    echo "Codebase map already exists"
    # Offer: view existing, update, or overwrite
fi
```

### Step 2: Analyze Project Structure

```bash
# Detect project type
ls package.json requirements.txt Cargo.toml go.mod pom.xml 2>/dev/null

# Find source directories
find . -type d \( -name "src" -o -name "lib" -o -name "app" \) 2>/dev/null | head -10

# Count files by type
find . -type f -name "*.py" | wc -l
find . -type f \( -name "*.js" -o -name "*.ts" \) | wc -l
```

### Step 3: Spawn Codebase Mapper Subagent

```python
Task(
    description="Map codebase structure",
    subagent_name="gsd-codebase-mapper",
    prompt=f"""
Analyze and map this codebase structure.

## Your Task
1. Explore the codebase thoroughly
2. Identify project type and tech stack
3. Map directory structure
4. Find key files and entry points
5. Identify dependencies
6. Document architecture patterns

## Output
Create `.planning/CODEBASE-MAP.md` with:

```markdown
# Codebase Map

**Generated:** [date]
**Project Type:** [detected]

## Structure

```
project/
├── src/
│   ├── api/          # API routes
│   ├── models/       # Data models
│   └── utils/        # Utilities
├── tests/            # Test files
└── docs/             # Documentation
```

## Key Files

| File | Purpose |
|------|---------|
| [file] | [purpose] |

## Dependencies

- [dependency] - [purpose]

## Entry Points

- [entry point] - [what it does]

## Architecture

[High-level description]

## Patterns Used

- [Pattern] - [Where used]

## Notes

[Any important observations]
```

Return a brief summary of the codebase structure.
"""
)
```

### Step 4: Verify Map Created

```bash
if [ -f .planning/CODEBASE-MAP.md ]; then
    echo "✓ Codebase map created: .planning/CODEBASE-MAP.md"
else
    echo "ERROR: Codebase map not created"
    exit 1
fi
```

### Step 5: Update STATE.md

```bash
# Add to STATE.md that codebase is mapped
```

### Step 6: Present Results

```
╔══════════════════════════════════════════════════════════════╗
║              CODEBASE MAPPED                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Location: .planning/CODEBASE-MAP.md                         ║
║                                                              ║
║  Contains:                                                   ║
║  ✓ Directory structure                                       ║
║  ✓ Key files identified                                      ║
║  ✓ Dependencies listed                                       ║
║  ✓ Architecture overview                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Use Cases

- Onboarding to existing project
- Before major refactoring
- Documentation generation
- Understanding brownfield code

## Success Criteria

- [ ] gsd-codebase-mapper subagent spawned
- [ ] CODEBASE-MAP.md created
- [ ] Structure documented
- [ ] Key files identified
- [ ] Dependencies listed
- [ ] Architecture described
- [ ] STATE.md updated
