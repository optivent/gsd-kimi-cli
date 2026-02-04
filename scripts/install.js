#!/usr/bin/env node

/**
 * GSD for Kimi CLI - Complete Installation Script
 * 
 * This script installs:
 * 1. 27 GSD skills
 * 2. 11 GSD agents
 * 3. 9 GSD reference knowledge bases
 * 4. 9 GSD workflow templates
 * 5. GSD master agent configuration
 * 6. Source code patches (optional)
 * 7. Shell aliases and launcher
 * 
 * Usage:
 *   node scripts/install.js
 *   node scripts/install.js --skills-only
 *   node scripts/install.js --verify
 * 
 * Repository: https://github.com/optivent/gsd-kimi-cli
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const GSD_VERSION = '2.0.0';
const GSD_DIR = path.join(__dirname, '..');

// Colors for terminal output
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(msg, color = C.reset) {
  console.log(color + msg + C.reset);
}

function showBanner() {
  console.log(`
${C.cyan}${C.bold}   ██████╗ ███████╗██████╗${C.reset}
${C.cyan}${C.bold}  ██╔════╝ ██╔════╝██╔══██╗${C.reset}
${C.cyan}${C.bold}  ██║  ███╗███████╗██║  ██║${C.reset}
${C.cyan}${C.bold}  ██║   ██║╚════██║██║  ██║${C.reset}
${C.cyan}${C.bold}  ╚██████╔╝███████║██████╔╝${C.reset}
${C.cyan}${C.bold}   ╚═════╝ ╚══════╝╚═════╝${C.reset}

${C.bold}  Get Shit Done for Kimi CLI v${GSD_VERSION}${C.reset}
${C.dim}  Spec-driven development workflow system${C.reset}
`);
}

// Skill location candidates (in priority order)
const SKILL_LOCATIONS = [
  { path: path.join(os.homedir(), '.config/agents/skills'), name: 'XDG Agents (recommended)' },
  { path: path.join(os.homedir(), '.agents/skills'), name: 'Legacy Agents' },
  { path: path.join(os.homedir(), '.kimi/skills'), name: 'Kimi' },
];

const KIMI_DIR = path.join(os.homedir(), '.kimi');

// Parse command line args
const args = process.argv.slice(2);
const skillsOnly = args.includes('--skills-only');
const verifyMode = args.includes('--verify');
const uninstallMode = args.includes('--uninstall');

function detectBestSkillsLocation() {
  // Find first existing directory
  for (const loc of SKILL_LOCATIONS) {
    if (fs.existsSync(loc.path)) {
      return { dir: loc.path, name: loc.name };
    }
  }
  // Default to recommended location
  return { dir: SKILL_LOCATIONS[0].path, name: SKILL_LOCATIONS[0].name };
}

function copyDirRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function installSkills(targetDir) {
  log('\n📦 Installing GSD skills...', C.blue);
  log(`   Location: ${targetDir}\n`, C.dim);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const skillsDir = path.join(GSD_DIR, 'skills');
  const skills = fs.readdirSync(skillsDir)
    .filter(name => name.startsWith('gsd-'))
    .filter(name => fs.statSync(path.join(skillsDir, name)).isDirectory());
  
  let installed = 0;
  let updated = 0;
  
  for (const skill of skills) {
    const source = path.join(skillsDir, skill);
    const target = path.join(targetDir, skill);
    
    if (fs.existsSync(target)) {
      updated++;
      log(`  ↻ ${skill}`, C.yellow);
    } else {
      installed++;
      log(`  ✓ ${skill}`, C.green);
    }
    
    copyDirRecursive(source, target);
  }
  
  return { installed, updated, dir: targetDir };
}

function installAgents(skillsDir) {
  log('\n🤖 Installing GSD agents...', C.blue);
  
  const agentsDir = path.join(GSD_DIR, 'agents');
  const targetAgentsDir = path.join(skillsDir, 'gsd-agents');
  
  if (!fs.existsSync(targetAgentsDir)) {
    fs.mkdirSync(targetAgentsDir, { recursive: true });
  }
  
  const agents = fs.readdirSync(agentsDir)
    .filter(name => name.startsWith('gsd-'))
    .filter(name => fs.statSync(path.join(agentsDir, name)).isDirectory());
  
  let installed = 0;
  let updated = 0;
  
  for (const agent of agents) {
    const source = path.join(agentsDir, agent);
    const target = path.join(targetAgentsDir, agent);
    
    if (fs.existsSync(target)) {
      updated++;
      log(`  ↻ ${agent}`, C.yellow);
    } else {
      installed++;
      log(`  ✓ ${agent}`, C.green);
    }
    
    copyDirRecursive(source, target);
  }
  
  // Copy gsd-system.md
  const systemSource = path.join(agentsDir, 'gsd-system.md');
  if (fs.existsSync(systemSource)) {
    fs.copyFileSync(systemSource, path.join(targetAgentsDir, 'gsd-system.md'));
  }
  
  return { installed, updated, dir: targetAgentsDir };
}

function installReferences(skillsDir) {
  log('\n📚 Installing GSD references...', C.blue);
  
  const refsDir = path.join(GSD_DIR, 'references');
  const targetRefsDir = path.join(skillsDir, 'gsd-references');
  
  if (!fs.existsSync(targetRefsDir)) {
    fs.mkdirSync(targetRefsDir, { recursive: true });
  }
  
  const refs = fs.readdirSync(refsDir).filter(name => name.endsWith('.md'));
  
  for (const ref of refs) {
    fs.copyFileSync(path.join(refsDir, ref), path.join(targetRefsDir, ref));
    log(`  ✓ ${ref}`, C.green);
  }
  
  return { installed: refs.length };
}

function installWorkflows(skillsDir) {
  log('\n🔄 Installing GSD workflows...', C.blue);
  
  const workflowsDir = path.join(GSD_DIR, 'workflows');
  const targetWorkflowsDir = path.join(skillsDir, 'gsd-workflows');
  
  if (!fs.existsSync(targetWorkflowsDir)) {
    fs.mkdirSync(targetWorkflowsDir, { recursive: true });
  }
  
  const workflows = fs.readdirSync(workflowsDir).filter(name => name.endsWith('.md'));
  
  for (const workflow of workflows) {
    fs.copyFileSync(path.join(workflowsDir, workflow), path.join(targetWorkflowsDir, workflow));
    log(`  ✓ ${workflow}`, C.green);
  }
  
  return { installed: workflows.length };
}

function installMasterAgent(agentsDir) {
  log('\n🎯 Installing GSD master agent...', C.blue);
  
  if (!fs.existsSync(KIMI_DIR)) {
    fs.mkdirSync(KIMI_DIR, { recursive: true });
  }
  
  const source = path.join(GSD_DIR, 'gsd-agent.yaml');
  const target = path.join(KIMI_DIR, 'gsd-agent.yaml');
  
  // Read and update paths
  let content = fs.readFileSync(source, 'utf8');
  content = content.replace(/~\/\.kimi/g, KIMI_DIR);
  
  fs.writeFileSync(target, content);
  log(`  ✓ gsd-agent.yaml → ${target}`, C.green);
  
  return { success: true, path: target };
}

function installPatches() {
  log('\n🔧 Installing GSD patches...', C.blue);
  
  const patchesDir = path.join(KIMI_DIR, 'patches');
  if (!fs.existsSync(patchesDir)) {
    fs.mkdirSync(patchesDir, { recursive: true });
  }
  
  const sourcePatches = path.join(GSD_DIR, 'patches');
  const patches = fs.readdirSync(sourcePatches).filter(name => name.endsWith('.py'));
  
  for (const patch of patches) {
    fs.copyFileSync(path.join(sourcePatches, patch), path.join(patchesDir, patch));
    fs.chmodSync(path.join(patchesDir, patch), 0o755);
    log(`  ✓ ${patch}`, C.green);
  }
  
  // Create jim executable
  const jimPath = path.join(os.homedir(), '.local', 'bin', 'jim');
  const jimDir = path.dirname(jimPath);
  if (!fs.existsSync(jimDir)) {
    fs.mkdirSync(jimDir, { recursive: true });
  }
  
  const jimScript = `#!/usr/bin/env python3
import sys
from pathlib import Path

patches_dir = Path.home() / '.kimi' / 'patches'
sys.path.insert(0, str(patches_dir))

if len(sys.argv) > 1 and sys.argv[1] in ['--patch', '--restore', '--status']:
    patcher = patches_dir / 'kimi_cli_patcher_v2.py'
    if not patcher.exists():
        patcher = patches_dir / 'kimi_cli_patcher.py'
    if patcher.exists():
        import subprocess
        action = sys.argv[1].replace('--', '')
        subprocess.run([sys.executable, str(patcher), action])
    else:
        print("❌ Patcher not found. Run: node scripts/install.js")
else:
    import subprocess
    agent_file = Path.home() / '.kimi' / 'gsd-agent.yaml'
    cmd = ['kimi']
    if agent_file.exists():
        cmd.extend(['--agent-file', str(agent_file)])
    cmd.extend(sys.argv[1:])
    subprocess.run(cmd)
`;
  
  fs.writeFileSync(jimPath, jimScript);
  fs.chmodSync(jimPath, 0o755);
  log(`  ✓ jim command → ${jimPath}`, C.green);
  
  return { success: true, path: patchesDir };
}

function installShellAliases() {
  log('\n📝 Configuring shell...', C.blue);
  
  const shell = process.env.SHELL || '';
  const rcFile = shell.includes('zsh') ? '.zshrc' : '.bashrc';
  const rcPath = path.join(os.homedir(), rcFile);
  
  // Read current content
  let rcContent = '';
  if (fs.existsSync(rcPath)) {
    rcContent = fs.readFileSync(rcPath, 'utf8');
  }
  
  // Add PATH if not present
  let updated = false;
  if (!rcContent.includes('.local/bin')) {
    const pathExport = '\n# Add local bin to PATH\nexport PATH="$HOME/.local/bin:$PATH"\n';
    fs.appendFileSync(rcPath, pathExport);
    updated = true;
  }
  
  // Remove old jim alias if present
  if (rcContent.includes('alias jim=')) {
    rcContent = rcContent.replace(/alias jim=.*\n/g, '');
    fs.writeFileSync(rcPath, rcContent);
    updated = true;
  }
  
  if (updated) {
    log(`  ✓ Updated ${rcFile}`, C.green);
  } else {
    log(`  ✓ ${rcFile} already configured`, C.dim);
  }
  
  return { updated, rcFile };
}

function verifyInstallation(skillsDir, agentsDir, masterPath) {
  log('\n🔍 Verifying installation...', C.blue);
  
  let allGood = true;
  
  // Check skills
  const skillsCount = fs.readdirSync(skillsDir)
    .filter(name => name.startsWith('gsd-')).length;
  if (skillsCount >= 27) {
    log(`  ✓ Skills: ${skillsCount} installed`, C.green);
  } else {
    log(`  ✗ Skills: only ${skillsCount} found (expected 27+)`, C.red);
    allGood = false;
  }
  
  // Check agents
  const agentsCount = fs.readdirSync(agentsDir)
    .filter(name => name.startsWith('gsd-')).length;
  if (agentsCount >= 11) {
    log(`  ✓ Agents: ${agentsCount} installed`, C.green);
  } else {
    log(`  ✗ Agents: only ${agentsCount} found (expected 11+)`, C.red);
    allGood = false;
  }
  
  // Check master agent
  if (fs.existsSync(masterPath)) {
    log(`  ✓ Master agent: ${masterPath}`, C.green);
  } else {
    log(`  ✗ Master agent not found`, C.red);
    allGood = false;
  }
  
  // Check patches
  const patchesDir = path.join(KIMI_DIR, 'patches');
  if (fs.existsSync(patchesDir)) {
    const patchCount = fs.readdirSync(patchesDir).filter(f => f.endsWith('.py')).length;
    log(`  ✓ Patches: ${patchCount} installed`, C.green);
  } else {
    log(`  ⚠ Patches not installed`, C.yellow);
  }
  
  // Check jim command
  const jimPath = path.join(os.homedir(), '.local', 'bin', 'jim');
  if (fs.existsSync(jimPath)) {
    log(`  ✓ jim command: ${jimPath}`, C.green);
  } else {
    log(`  ✗ jim command not found`, C.red);
    allGood = false;
  }
  
  return allGood;
}

function printUsage(skillsDir, agentsDir, masterPath) {
  console.log(`
${C.bold}═══════════════════════════════════════════════════════════════${C.reset}

${C.bold}Quick Start:${C.reset}

  1. Apply patches (optional but recommended):
     ${C.cyan}jim --patch${C.reset}

  2. Start using GSD:
     ${C.cyan}jim${C.reset}

  3. Try these commands:
     ${C.cyan}/skill:gsd-new-project${C.reset}     # Create a new project
     ${C.cyan}/skill:gsd-help${C.reset}            # Show all commands
     ${C.cyan}/skill:gsd-progress${C.reset}        # Check project status

${C.bold}After Kimi CLI Updates:${C.reset}

  ${C.dim}# Update Kimi CLI${C.reset}
  uv tool update kimi-cli
  
  ${C.dim}# Re-apply GSD patches${C.reset}
  jim --patch

${C.bold}Repository:${C.reset}
  https://github.com/optivent/gsd-kimi-cli

${C.bold}═══════════════════════════════════════════════════════════════${C.reset}
`);
}

function main() {
  showBanner();
  
  if (verifyMode) {
    const { dir: skillsDir } = detectBestSkillsLocation();
    const agentsDir = path.join(skillsDir, 'gsd-agents');
    const masterPath = path.join(KIMI_DIR, 'gsd-agent.yaml');
    const result = verifyInstallation(skillsDir, agentsDir, masterPath);
    process.exit(result ? 0 : 1);
  }
  
  if (uninstallMode) {
    log('\n🗑️  Uninstalling GSD...\n', C.yellow);
    // Add uninstall logic here if needed
    log('To uninstall manually, remove:', C.dim);
    log(`  - ${detectBestSkillsLocation().dir}/gsd-*`, C.dim);
    log(`  - ${KIMI_DIR}/gsd-agent.yaml`, C.dim);
    log(`  - ${KIMI_DIR}/patches/`, C.dim);
    return;
  }
  
  // Detect best location
  const { dir: skillsDir, name: locationName } = detectBestSkillsLocation();
  log(`📍 Using: ${locationName}`, C.dim);
  log(`   ${skillsDir}\n`, C.dim);
  
  try {
    // Install components
    const skillsResult = installSkills(skillsDir);
    const agentsResult = installAgents(skillsDir);
    const refsResult = installReferences(skillsDir);
    const workflowsResult = installWorkflows(skillsDir);
    const masterResult = installMasterAgent(agentsResult.dir);
    const patchesResult = skillsOnly ? { success: true } : installPatches();
    const aliasResult = installShellAliases();
    
    // Show summary
    console.log(`\n${C.bold}╔═══════════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}║                   Installation Summary                        ║${C.reset}`);
    console.log(`${C.bold}╠═══════════════════════════════════════════════════════════════╣${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Skills:     ${String(skillsResult.installed).padStart(2)} new, ${String(skillsResult.updated).padStart(2)} updated                    ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Agents:     ${String(agentsResult.installed).padStart(2)} new, ${String(agentsResult.updated).padStart(2)} updated                    ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  References: ${String(refsResult.installed).padStart(2)} knowledge bases                        ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Workflows:  ${String(workflowsResult.installed).padStart(2)} templates                            ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Master:     ${masterResult.success ? '✓ Installed' : '✗ Failed'}                                ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Patches:    ${patchesResult.success ? '✓ Installed' : '⚠ Skipped'}                                ${C.bold}║${C.reset}`);
    console.log(`${C.bold}║${C.reset}  Shell:      ${aliasResult.updated ? '✓ Updated' : '✓ OK'}                                    ${C.bold}║${C.reset}`);
    console.log(`${C.bold}╚═══════════════════════════════════════════════════════════════╝${C.reset}`);
    
    // Verify
    const verified = verifyInstallation(skillsDir, agentsResult.dir, masterResult.path);
    
    printUsage(skillsDir, agentsResult.dir, masterResult.path);
    
    if (aliasResult.updated) {
      log(`📝 Run: source ~/${aliasResult.rcFile}`, C.yellow);
    }
    
    process.exit(verified ? 0 : 1);
    
  } catch (err) {
    log(`\n❌ Installation failed: ${err.message}`, C.red);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
