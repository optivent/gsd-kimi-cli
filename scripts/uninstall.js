#!/usr/bin/env node

/**
 * Uninstall script for gsd-kimi-cli
 * Removes GSD skills and agents from all possible locations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GSD_SKILLS_DIR = path.join(__dirname, '..', 'skills');
const GSD_AGENTS_DIR = path.join(__dirname, '..', 'agents');

// All possible skill locations (in priority order)
const SKILL_LOCATIONS = [
  path.join(os.homedir(), '.config/agents/skills'),
  path.join(os.homedir(), '.agents/skills'),
  path.join(os.homedir(), '.kimi/skills'),
  path.join(os.homedir(), '.claude/skills'),
  path.join(os.homedir(), '.codex/skills'),
];

const KIMI_DIR = path.join(os.homedir(), '.kimi');

function findGSDSkills() {
  const found = [];
  
  for (const loc of SKILL_LOCATIONS) {
    if (fs.existsSync(loc)) {
      const skills = fs.readdirSync(loc)
        .filter(name => name.startsWith('gsd-'))
        .filter(name => fs.statSync(path.join(loc, name)).isDirectory());
      
      if (skills.length > 0) {
        found.push({ dir: loc, skills });
      }
    }
  }
  
  return found;
}

function findGSDAgents() {
  const found = [];
  
  // Check all skill locations for gsd-agents subdirectory
  for (const loc of SKILL_LOCATIONS) {
    const agentsDir = path.join(loc, 'gsd-agents');
    if (fs.existsSync(agentsDir)) {
      const agents = fs.readdirSync(agentsDir)
        .filter(name => name.startsWith('gsd-'))
        .filter(name => fs.statSync(path.join(agentsDir, name)).isDirectory());
      
      if (agents.length > 0) {
        found.push({ dir: agentsDir, agents });
      }
    }
  }
  
  // Also check old ~/.kimi/agents location
  const oldAgentsDir = path.join(KIMI_DIR, 'agents');
  if (fs.existsSync(oldAgentsDir)) {
    const agents = fs.readdirSync(oldAgentsDir)
      .filter(name => name.startsWith('gsd-'))
      .filter(name => fs.statSync(path.join(oldAgentsDir, name)).isDirectory());
    
    if (agents.length > 0) {
      found.push({ dir: oldAgentsDir, agents, legacy: true });
    }
  }
  
  return found;
}

function uninstallSkills() {
  console.log('\n📦 Removing GSD skills...\n');
  
  const locations = findGSDSkills();
  
  if (locations.length === 0) {
    console.log('  ⚠️  No GSD skills found in any location');
    return { removed: 0, notFound: 0 };
  }
  
  let totalRemoved = 0;
  
  for (const { dir, skills } of locations) {
    console.log(`  From: ${dir}`);
    
    for (const skill of skills) {
      const targetDir = path.join(dir, skill);
      
      try {
        fs.rmSync(targetDir, { recursive: true });
        console.log(`    ✓ ${skill}`);
        totalRemoved++;
      } catch (err) {
        console.error(`    ✗ ${skill} - ${err.message}`);
      }
    }
    
    // Also remove Flow Skills
    const flowSkills = ['gsd-bootstrap', 'gsd-execute-flow'];
    for (const flowSkill of flowSkills) {
      const flowDir = path.join(dir, flowSkill);
      if (fs.existsSync(flowDir)) {
        try {
          fs.rmSync(flowDir, { recursive: true });
          console.log(`    ✓ ${flowSkill}`);
          totalRemoved++;
        } catch (err) {
          console.error(`    ✗ ${flowSkill} - ${err.message}`);
        }
      }
    }
  }
  
  console.log(`\n  ✅ ${totalRemoved} skills removed`);
  return { removed: totalRemoved };
}

function uninstallAgents() {
  console.log('\n🤖 Removing GSD agents...\n');
  
  const locations = findGSDAgents();
  
  if (locations.length === 0) {
    console.log('  ⚠️  No GSD agents found in any location');
    return { removed: 0 };
  }
  
  let totalRemoved = 0;
  
  for (const { dir, agents, legacy } of locations) {
    console.log(`  From: ${dir}${legacy ? ' (legacy)' : ''}`);
    
    for (const agent of agents) {
      const targetDir = path.join(dir, agent);
      
      try {
        fs.rmSync(targetDir, { recursive: true });
        console.log(`    ✓ ${agent}`);
        totalRemoved++;
      } catch (err) {
        console.error(`    ✗ ${agent} - ${err.message}`);
      }
    }
    
    // Try to remove empty gsd-agents directory
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      try {
        fs.rmdirSync(dir);
        console.log(`    ✓ Removed empty ${path.basename(dir)} directory`);
      } catch (err) {
        // Ignore errors
      }
    }
  }
  
  console.log(`\n  ✅ ${totalRemoved} agents removed`);
  return { removed: totalRemoved };
}

function uninstallMasterAgent() {
  console.log('\n🎯 Removing GSD master agent...\n');
  
  const masterAgentFile = path.join(KIMI_DIR, 'gsd-agent.yaml');
  const systemPromptFile = path.join(KIMI_DIR, 'agents', 'gsd-system.md');
  
  let removed = 0;
  
  if (fs.existsSync(masterAgentFile)) {
    try {
      fs.unlinkSync(masterAgentFile);
      console.log(`  ✓ ${masterAgentFile}`);
      removed++;
    } catch (err) {
      console.error(`  ✗ ${masterAgentFile} - ${err.message}`);
    }
  }
  
  if (fs.existsSync(systemPromptFile)) {
    try {
      fs.unlinkSync(systemPromptFile);
      console.log(`  ✓ ${systemPromptFile}`);
      removed++;
    } catch (err) {
      console.error(`  ✗ ${systemPromptFile} - ${err.message}`);
    }
  }
  
  if (removed === 0) {
    console.log('  ℹ️  No master agent files found');
  }
  
  return { removed };
}

function removeShellAliases() {
  console.log('\n🐚 Checking shell aliases...\n');
  
  const shellConfigs = [
    path.join(os.homedir(), '.zshrc'),
    path.join(os.homedir(), '.bashrc'),
    path.join(os.homedir(), '.bash_profile'),
  ];
  
  for (const configFile of shellConfigs) {
    if (fs.existsSync(configFile)) {
      let content = fs.readFileSync(configFile, 'utf8');
      const originalContent = content;
      
      // Remove GSD aliases and comments
      content = content.replace(/\n# GSD for Kimi CLI\n/g, '\n');
      content = content.replace(/alias kimi-gsd=.*\n/g, '');
      content = content.replace(/alias gsd=.*\n/g, '');
      
      if (content !== originalContent) {
        try {
          fs.writeFileSync(configFile, content);
          console.log(`  ✓ Removed aliases from ${path.basename(configFile)}`);
        } catch (err) {
          console.error(`  ✗ Failed to update ${path.basename(configFile)}`);
        }
      }
    }
  }
}

function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           GSD for Kimi CLI - Uninstallation                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  console.log('\n⚠️  This will remove all GSD components from your system.');
  console.log('   Your project files (.planning/ directories) will NOT be affected.');
  
  // In npm uninstall context, just proceed without asking
  // For manual use, could add a prompt here
  
  try {
    const skillsResult = uninstallSkills();
    const agentsResult = uninstallAgents();
    const masterResult = uninstallMasterAgent();
    removeShellAliases();
    
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                   Uninstallation Summary                             ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Skills: ${String(skillsResult.removed).padStart(3)} removed                                             ║`);
    console.log(`║  Agents: ${String(agentsResult.removed).padStart(3)} removed                                             ║`);
    console.log(`║  Master: ${String(masterResult.removed).padStart(3)} files removed                                       ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    
    console.log('\n✅ GSD has been uninstalled.');
    console.log('   Your project planning files are preserved.');
    console.log('   To reinstall: npm install -g gsd-kimi-cli');
    console.log('');
    
  } catch (err) {
    console.error('\n❌ Uninstallation failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
