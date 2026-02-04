# GSD Patches - Usage Guide

Complete guide for using GSD patches with Kimi CLI.

## Table of Contents

1. [Activating GSD in a Project](#activating-gsd-in-a-project)
2. [File Structure](#file-structure)
3. [Status Bar Indicators](#status-bar-indicators)
4. [Todo Management](#todo-management)
5. [Daily Workflow](#daily-workflow)
6. [Advanced Usage](#advanced-usage)

---

## Activating GSD in a Project

GSD patches activate automatically when Kimi CLI detects a GSD project structure. No manual activation is required.

### Creating a New GSD Project

```bash
# Launch Kimi CLI with GSD
jim

# Create new project
/skill:gsd-new-project
```

This creates the `.planning/` directory structure automatically.

### Converting an Existing Project

To add GSD to an existing project:

```bash
# Navigate to project directory
cd my-existing-project

# Create planning directory
mkdir .planning

# Create PROJECT.md
cat > .planning/PROJECT.md << 'EOF'
# My Project Name

Brief description of the project.
EOF

# Create STATE.md
cat > .planning/STATE.md << 'EOF'
# State

## Current Phase: 1

Initializing project with GSD workflow.
EOF

# Create ROADMAP.md (optional)
cat > .planning/ROADMAP.md << 'EOF'
# Roadmap

## Current Milestone: Initial Setup

- [x] Project setup
- [ ] Core features
- [ ] Testing
EOF

# Create todos file
echo '[]' > .kimi-todos.json
```

### Verifying Activation

When GSD is active, you'll see:

1. **Welcome message** on startup:
   ```
   🚀 📋 Project: My Project | 🎯 Phase: 1
   ```

2. **Status bar** shows GSD indicators:
   ```
   agent (kimi-latest) | 📋P1 ✅2/5
   ```

---

## File Structure

### `.planning/` Directory

The `.planning/` directory contains GSD metadata:

#### PROJECT.md
```markdown
# Kimi GSD Project

AI-powered CLI task management and code generation system.
```

**Purpose**: Defines the project name shown in welcome message.

**Format**: First H1 heading (`# Title`) is used as project name.

#### STATE.md
```markdown
# State

## Current Phase: 3

Implementing core GSD workflow features.
```

**Purpose**: Tracks current phase number.

**Format**: Line matching `Current Phase: N` (case insensitive).

#### ROADMAP.md
```markdown
# Roadmap

## Current Milestone: Core Implementation

Description of current milestone.
```

**Purpose**: Defines milestone information (used internally).

**Format**: Line matching `Current Milestone: Name`.

### `.kimi-todos.json`

Todo list file in the project root:

```json
[
  {"title": "Install GSD patches", "done": true},
  {"title": "Verify installation", "done": true},
  {"title": "Create documentation", "done": false}
]
```

**Purpose**: Tracks task completion for progress indicator.

**Format**: JSON array of objects with `title` (string) and `done` (boolean) fields.

---

## Status Bar Indicators

When GSD is active, the Kimi CLI status bar displays additional information:

### Standard Status Bar
```
agent (kimi-latest)                          [Ctrl+C] interrupt
```

### With GSD Active
```
agent (kimi-latest) | 📋P3 ✅5/8             [Ctrl+C] interrupt
```

### Indicator Reference

| Indicator | Meaning | Example |
|-----------|---------|---------|
| `📋PN` | Phase Number | `📋P1` = Phase 1 |
| `✅D/T` | Todo Progress | `✅3/5` = 3 done, 5 total |

### Color Coding

- **Green**: GSD indicators are displayed in bright green (`#00ff00`)
- **Position**: Indicators appear between mode display and shortcuts

### When Indicators Appear

Indicators only show when:
1. `.planning/` directory exists in current working directory
2. `STATE.md` contains a valid phase number (for phase indicator)
3. `.kimi-todos.json` exists with todos (for todo indicator)

### Example Scenarios

**Only Phase Active**:
```
agent (kimi-latest) | 📋P2                  [Ctrl+C] interrupt
```

**Only Todos Active**:
```
agent (kimi-latest) | ✅1/4                 [Ctrl+C] interrupt
```

**Both Active**:
```
agent (kimi-latest) | 📋P2 ✅1/4            [Ctrl+C] interrupt
```

---

## Todo Management

### Creating Todos

Use the GSD skill to add todos:

```bash
/skill:gsd-add-todo "Implement user authentication"
/skill:gsd-add-todo "Write unit tests"
```

### Viewing Todos

```bash
/skill:gsd-check-todos
```

### Manual Todo Editing

Edit `.kimi-todos.json` directly:

```json
[
  {"title": "Install GSD patches", "done": true},
  {"title": "Test integration", "done": false, "priority": "high"}
]
```

**Note**: Only `title` and `done` fields are read by the patches. Additional fields are ignored but preserved.

### Todo File Format

```json
[
  {
    "title": "Task description",
    "done": false
  }
]
```

- **title** (required): Task description
- **done** (required): Completion status (boolean)

### Refreshing Status Bar

The status bar updates automatically when:
- You change directories within Kimi CLI
- A new session starts
- The todo file is modified

---

## Daily Workflow

### Morning Startup

```bash
# Navigate to project
cd my-project

# Launch GSD-enabled Kimi CLI
jim
```

You'll see:
```
🚀 📋 Project: My Project | 🎯 Phase: 2

> 
```

### During Development

1. **Check status bar** - See phase and todo progress at a glance
2. **Add todos** - `/skill:gsd-add-todo "New task"`
3. **Mark complete** - Edit `.kimi-todos.json` or use skills
4. **Switch phases** - Update `STATE.md` when moving to next phase

### Phase Transitions

When completing a phase:

```bash
# Update state
echo "## Current Phase: 3" > .planning/STATE.md

# Or use skill
/skill:gsd-complete-milestone
```

Status bar updates automatically on next prompt render.

### End of Day

```bash
# Check progress
/skill:gsd-progress

# Save work
exit
```

---

## Advanced Usage

### Custom Project Detection

The patches look for `.planning/` directory in the current working directory. To use GSD in subdirectories:

1. Create `.planning/` in the project root
2. Launch `jim` from project root
3. Navigate to subdirectories within Kimi CLI

### Multiple Projects

Each project has its own `.planning/` directory. Switch projects by:

```bash
# Exit current session
exit

# Switch directory
cd ../other-project

# Launch in new project
jim
```

### CI/CD Integration

Verify GSD structure in CI:

```bash
#!/bin/bash
set -e

# Check required files exist
[ -f .planning/PROJECT.md ] || exit 1
[ -f .planning/STATE.md ] || exit 1

# Check valid JSON
cat .kimi-todos.json | python3 -m json.tool > /dev/null

echo "GSD structure validated"
```

### Backup and Restore

Before Kimi CLI updates:

```bash
# Backup current patches
jim --status > patch-backup.txt

# Restore after update
jim --patch
```

### Environment Variables

The patches don't use environment variables for configuration. All settings are read from the `.planning/` directory files.

---

## Troubleshooting Common Issues

### Status Bar Not Showing

1. Verify `.planning/` directory exists:
   ```bash
   ls -la .planning/
   ```

2. Check `STATE.md` format:
   ```bash
   grep -i "current phase" .planning/STATE.md
   ```

3. Verify patches are applied:
   ```bash
   jim --status
   ```

### Welcome Message Missing

Check `PROJECT.md` has H1 heading:
```bash
head -5 .planning/PROJECT.md
```

### Todo Count Wrong

Validate JSON syntax:
```bash
python3 -m json.tool .kimi-todos.json > /dev/null && echo "Valid JSON"
```

### Patches Not Applying

Check Kimi CLI location:
```bash
which kimi
uv tool dir kimi-cli
```

Verify Python version:
```bash
python3 --version  # Need 3.11+
```

---

## Summary

The GSD patches enhance Kimi CLI with:

- ✅ Automatic project detection
- ✅ Real-time phase display
- ✅ Todo progress tracking
- ✅ Enhanced welcome messages
- ✅ Zero configuration needed

Just create the `.planning/` structure and the patches do the rest!
