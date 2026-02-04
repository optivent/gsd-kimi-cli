# Phase 1 Execution: Sprint 1 - Foundation Setup

## Sprint Goal
Create working Elixir umbrella project with development environment, ready for team to contribute.

**Duration:** 1 week  
**Team:** 1-2 developers  
**Deliverable:** Working `kimi_gsd_ex` umbrella app with parity testing

---

## Day 1: Project Creation

### Task 1.1: Create Umbrella Project
**Status:** ⏳ READY TO START  
**Assignee:** Lead Developer  
**Time:** 2-3 hours

```bash
# Create project directory
mkdir -p ~/kimi_gsd_ex
cd ~/kimi_gsd_ex

# Create umbrella app
mix new . --umbrella

# Initialize git
git init
git remote add origin https://github.com/optivent/kimi_gsd_ex.git

# Create initial structure
mkdir -p apps/{kimi_core,kimi_gsd,kimi_skills,kimi_ui,kimi_cli}
mkdir -p config scripts docs adr
```

**Deliverable:**
- `~/kimi_gsd_ex/mix.exs` (umbrella root)
- `~/kimi_gsd_ex/.git/` initialized
- `~/kimi_gsd_ex/apps/` directory structure

**Verification:**
```bash
cd ~/kimi_gsd_ex
mix deps.get  # Should work (empty umbrella)
mix compile   # Should succeed
```

---

### Task 1.2: Create First App (kimi_core)
**Status:** ⏳ READY TO START  
**Assignee:** Lead Developer  
**Time:** 2-3 hours

```bash
cd ~/kimi_gsd_ex/apps

# Create kimi_core app
mix new kimi_core --sup

# Edit kimi_core/mix.exs
cat > kimi_core/mix.exs << 'EOF'
defmodule KimiCore.MixProject do
  use Mix.Project

  def project do
    [
      app: :kimi_core,
      version: "0.1.0",
      build_path: "../../_build",
      config_path: "../../config/config.exs",
      deps_path: "../../deps",
      lockfile: "../../mix.lock",
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {KimiCore.Application, []}
    ]
  end

  defp deps do
    [
      # HTTP client for LLM APIs
      {:req, "~> 0.4"},
      # JSON handling
      {:jason, "~> 1.4"},
      # Testing
      {:mox, "~> 1.0", only: :test}
    ]
  end
end
EOF
```

**Deliverable:**
- `apps/kimi_core/` with working structure
- `apps/kimi_core/lib/kimi_core.ex`
- `apps/kimi_core/lib/kimi_core/application.ex`
- `apps/kimi_core/test/` directory

**Verification:**
```bash
cd ~/kimi_gsd_ex
mix deps.get
mix compile
# Should compile without errors
```

---

## Day 2: Tooling Setup

### Task 1.3: Configure Tooling
**Status:** ⏳ READY TO START  
**Assignee:** Lead Developer  
**Time:** 3-4 hours

```bash
cd ~/kimi_gsd_ex

# Create formatter config
cat > .formatter.exs << 'EOF'
[
  inputs: ["{mix,.formatter}.exs", "{config,lib,test}/**/*.{ex,exs}"],
  subdirectories: ["apps/*"]
]
EOF

# Create root mix.exs with dev dependencies
cat > mix.exs << 'EOF'
defmodule KimiGsdEx.MixProject do
  use Mix.Project

  def project do
    [
      apps_path: "apps",
      version: "0.1.0",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases()
    ]
  end

  defp deps do
    [
      # Static analysis
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      # Type checking
      {:dialyxir, "~> 1.3", only: [:dev, :test], runtime: false},
      # Documentation
      {:ex_doc, "~> 0.30", only: :dev, runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "compile"],
      "test.parity": ["test test/parity"],
      "lint": ["format --check-formatted", "credo --strict", "dialyzer"]
    ]
  end
end
EOF

# Create Makefile
cat > Makefile << 'EOF'
.PHONY: setup test lint docs clean

setup:
	mix setup

test:
	mix test

test.parity:
	mix test.parity

lint:
	mix lint

docs:
	mix docs

clean:
	rm -rf _build deps

release:
	mix release
EOF
```

**Deliverable:**
- `.formatter.exs`
- Updated `mix.exs` with tooling
- `Makefile` with common tasks
- `mix setup` works

**Verification:**
```bash
cd ~/kimi_gsd_ex
make setup
make lint  # Will have warnings, that's OK
make docs  # Should generate docs
```

---

### Task 1.4: GitHub Repository Setup
**Status:** ⏳ READY TO START  
**Assignee:** Lead Developer  
**Time:** 1 hour

```bash
cd ~/kimi_gsd_ex

# Create README
cat > README.md << 'EOF'
# KIMI-GSD-EX

Ultimate AI-powered development environment in Elixir.

## Development

```bash
# Setup
make setup

# Run tests
make test

# Run parity tests (compare with stable GSD)
make test.parity

# Lint
make lint

# Documentation
make docs
```

## Architecture

Umbrella app with:
- `kimi_core` - Chat, context, LLM gateway
- `kimi_gsd` - GSD native implementation
- `kimi_skills` - Skills framework
- `kimi_ui` - Terminal and web UI
- `kimi_cli` - CLI entry point

## Stable Reference

This project is built alongside the stable GSD-patched kimi-cli:
- Location: `/Users/aig/kimi_gsd`
- Used for: Reference implementation and testing
- See: `test/parity/` for comparison tests
EOF

# Initial commit
git add -A
git commit -m "Initial commit: KIMI-GSD-EX umbrella project

- Elixir umbrella app structure
- kimi_core app with initial setup
- Tooling: credo, dialyzer, ex_doc
- Makefile for common tasks
- README with development guide"

# Push to GitHub (repo must be created first)
# git push -u origin main
```

**Deliverable:**
- `README.md`
- Initial git commit
- Ready for GitHub push

---

## Day 3-4: Stable Reference Analysis

### Task 1.5: Document Stable GSD Behavior
**Status:** ⏳ READY TO START  
**Assignee:** Any Developer  
**Time:** 4-6 hours

Create reference documentation from stable implementation:

```bash
# Create reference directory
mkdir -p ~/kimi_gsd_ex/docs/reference

# Analyze current GSD patches
cd /Users/aig/kimi_gsd
```

**Document the following:**

#### 1.5.1 StatusSnapshot Fields
```bash
# Read the actual implementation
grep -A 20 "class StatusSnapshot" ~/.local/share/uv/tools/kimi-cli/.../soul/__init__.py

# Document in:
# ~/kimi_gsd_ex/docs/reference/python-gsd-snapshot.md
```

#### 1.5.2 _load_gsd_context Behavior
```bash
# Read implementation
grep -A 50 "def _load_gsd_context" ~/.local/share/uv/tools/kimi-cli/.../soul/kimisoul.py

# Document in:
# ~/kimi_gsd_ex/docs/reference/python-gsd-context-loading.md
```

#### 1.5.3 Status Bar Rendering
```bash
# Read implementation
grep -A 30 "# ADD: GSD status bar" ~/.local/share/uv/tools/kimi-cli/.../ui/shell/prompt.py

# Document in:
# ~/kimi_gsd_ex/docs/reference/python-gsd-status-bar.md
```

**Deliverable:**
- `docs/reference/python-gsd-snapshot.md`
- `docs/reference/python-gsd-context-loading.md`
- `docs/reference/python-gsd-status-bar.md`

**Verification:**
```bash
ls ~/kimi_gsd_ex/docs/reference/
# All 3 files should exist and be populated
```

---

## Day 5: Parity Testing Framework

### Task 1.6: Create First Parity Test
**Status:** ⏳ READY TO START  
**Assignee:** Lead Developer  
**Time:** 3-4 hours

```bash
# Create parity test directory
mkdir -p ~/kimi_gsd_ex/apps/kimi_core/test/parity

# Create test helper
cat > ~/kimi_gsd_ex/apps/kimi_core/test/parity/parity_helper.exs << 'EOF'
defmodule KimiCore.ParityHelper do
  @moduledoc """
  Helpers for comparing Elixir implementation with stable Python GSD.
  """
  
  @stable_gsd_path "/Users/aig/kimi_gsd"
  
  def run_python_context_loader do
    # Run stable Python implementation
    {output, 0} = System.cmd("python3", [
      "-c",
      """
      import sys
      sys.path.insert(0, '#{@stable_gsd_path}/gsd-kimi-cli')
      # Import and run stable GSD context loading
      # ... (actual implementation)
      import json
      print(json.dumps({
        "gsd_enabled": True,
        "gsd_phase": "3",
        "gsd_project": "Kimi GSD Project",
        "gsd_todos_total": 15,
        "gsd_todos_done": 11
      }))
      """
    ], cd: @stable_gsd_path)
    
    Jason.decode!(output)
  end
  
  def equivalent?(python_result, elixir_result) do
    # Compare results, allowing for minor differences
    python_result["gsd_enabled"] == elixir_result.gsd_enabled and
    python_result["gsd_phase"] == elixir_result.gsd_phase and
    python_result["gsd_project"] == elixir_result.gsd_project and
    python_result["gsd_todos_total"] == elixir_result.gsd_todos_total
  end
end
EOF

# Create first parity test
cat > ~/kimi_gsd_ex/apps/kimi_core/test/parity/context_test.exs << 'EOF'
defmodule KimiCore.Parity.ContextTest do
  use ExUnit.Case
  
  alias KimiCore.ParityHelper
  
  @moduletag :parity
  
  test "GSD context loading matches stable Python implementation" do
    # Load from stable Python
    python_result = ParityHelper.run_python_context_loader()
    
    # Load from Elixir (placeholder - implement actual loading)
    elixir_result = %{
      gsd_enabled: true,
      gsd_phase: "3",
      gsd_project: "Kimi GSD Project",
      gsd_todos_total: 15,
      gsd_todos_done: 11
    }
    
    # Verify equivalence
    assert ParityHelper.equivalent?(python_result, elixir_result)
  end
end
EOF

# Update test helper
cat >> ~/kimi_gsd_ex/apps/kimi_core/test/test_helper.exs << 'EOF'

# Load parity helper
Code.require_file("parity/parity_helper.exs", __DIR__)
EOF
```

**Deliverable:**
- `test/parity/parity_helper.exs`
- `test/parity/context_test.exs`
- `mix test.parity` runs parity tests

**Verification:**
```bash
cd ~/kimi_gsd_ex
mix test.parity
# Should run (may fail initially until implemented)
```

---

## Sprint Review Checklist

### Must Have (Day 5)
- [ ] `~/kimi_gsd_ex/` directory exists
- [ ] Umbrella app structure in place
- [ ] `kimi_core` app created
- [ ] `make setup` works
- [ ] `make test` runs
- [ ] Git initialized with README
- [ ] First parity test created

### Should Have (Day 5)
- [ ] All 5 apps scaffolded (kimi_core, kimi_gsd, kimi_skills, kimi_ui, kimi_cli)
- [ ] CI/CD pipeline configured
- [ ] Documentation started
- [ ] Reference docs for stable GSD

### Nice to Have (Day 5)
- [ ] First parity test passing
- [ ] GitHub repository created
- [ ] Docker setup

---

## Definition of Done

**"Team can `git clone && make setup` and start contributing"**

### Verification Steps

```bash
# 1. Fresh clone simulation
mkdir -p /tmp/test-clone
cd /tmp/test-clone
git clone ~/kimi_gsd_ex .  # Or from GitHub

# 2. Setup
make setup
# Should complete without errors

# 3. Test
make test
# Should run tests (may be empty/minimal)

# 4. Lint
make lint
# Should complete (warnings OK)

# 5. Team member can add code
echo '# New module' > apps/kimi_core/lib/kimi_core/new_module.ex
make test
# Should still work
```

---

## Next Sprint Preview

**Sprint 2: Core Engine Basics**

### Planned Tasks
1. **Session GenServer** - Basic session management
2. **GSD Context Loader** - Port from stable Python
3. **First Parity Pass** - Match stable behavior
4. **LLM Client Skeleton** - HTTP client structure

### Success Criteria
- Can create and retrieve sessions
- GSD context loads correctly
- Parity test passes
- Can make HTTP requests

---

## Notes

**Remember:**
- Always compare with stable GSD in `/Users/aig/kimi_gsd`
- Run `/skill:gsd-progress` from stable CLI to verify behavior
- Parity tests are our safety net
- Document everything for team onboarding
