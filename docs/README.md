# GSD for Kimi CLI - Patches Documentation

> **Enhanced UI integration for the GSD workflow system**

## Overview

The GSD patches provide deep integration between the GSD workflow system and Kimi CLI's user interface. When applied, these patches enable real-time project status display in the Kimi CLI status bar and enhanced welcome messages.

## What the Patches Do

### 🎯 Status Bar Integration
- Shows current **Phase** number (e.g., `📋P1`)
- Displays **Todo progress** (e.g., `✅3/5`)
- Shows **Milestone** information
- Indicates **Project** name

### 👋 Welcome Message Enhancement
- Detects GSD projects automatically
- Displays project name on startup
- Shows current phase number
- Only appears when in a GSD-enabled project

### 🔄 Real-time Context
- Reads `.planning/` directory files
- Parses `STATE.md` for phase info
- Reads `PROJECT.md` for project name
- Accesses `.kimi-todos.json` for todo progress

## Quick Start

### 1. Install GSD System

```bash
# Clone the repository
git clone https://github.com/optivent/gsd-kimi-cli.git
cd gsd-kimi-cli

# Run the installer
node scripts/install.js
```

### 2. Apply Patches

```bash
# Apply patches to Kimi CLI
python3 patches/kimi_cli_patcher.py apply

# Or use the wrapper (auto-patches on first run)
python3 patches/jim-wrapper.py
```

### 3. Verify Installation

```bash
# Check patch status
python3 patches/kimi_cli_patcher.py status
```

## Using the `jim` Wrapper

The `jim` wrapper provides a convenient way to launch Kimi CLI with GSD enhancements:

```bash
# Launch with GSD enhancements
./patches/jim-wrapper.py

# Force re-patch
./patches/jim-wrapper.py --patch

# Restore original Kimi CLI
./patches/jim-wrapper.py --restore

# Check status
./patches/jim-wrapper.py --status
```

### Installing `jim` as a Command

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
alias jim="python3 /path/to/gsd-kimi-cli/patches/jim-wrapper.py"
```

## Project Structure

When you enter a GSD-enabled project directory, you'll see:

```
🚀 📋 Project: My Awesome Project | 🎯 Phase: 1

> _
```

And in the status bar:

```
agent (kimi-latest) | 📋P1 ✅3/5              [Ctrl+C] interrupt
```

## File Structure

A GSD-enabled project contains:

```
my-project/
├── .planning/
│   ├── PROJECT.md      # Project name and description
│   ├── STATE.md        # Current phase and status
│   └── ROADMAP.md      # Milestone information
└── .kimi-todos.json    # Todo list with progress
```

## Requirements

- Kimi CLI installed via `uv tool install kimi-cli`
- Python 3.11+
- Write access to Kimi CLI installation directory

## Safety & Backups

The patcher automatically creates backups:

- Backup suffix: `.gsd-backup`
- Backups are stored alongside original files
- Restore anytime with `kimi_cli_patcher.py restore`
- Original files are never permanently modified

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Patches not applying | Check Kimi CLI is installed with `which kimi` |
| Status bar not showing | Verify `.planning/` directory exists |
| Wrong phase shown | Check `STATE.md` has "Current Phase: N" format |
| Todos not updating | Verify `.kimi-todos.json` exists and is valid JSON |
| Want to undo | Run `kimi_cli_patcher.py restore` |

## Next Steps

- Read [USAGE.md](./USAGE.md) for detailed usage instructions
- Read [PATCHES.md](./PATCHES.md) for technical documentation
- Create your first GSD project with `/skill:gsd-new-project`

## License

MIT License - See [LICENSE](../LICENSE) file
