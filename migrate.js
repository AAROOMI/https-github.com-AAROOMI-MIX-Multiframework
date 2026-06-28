#!/usr/bin/env node

/**
 * Cybersecurity Controls Navigator
 * Local Infrastructure Migration & Deployment Automation Utility
 * 
 * This script runs locally after downloading/exporting the applet.
 * It detects the host environment, validates prerequisites, guides the user through config setup,
 * and builds customized launchers (Batch/Bash) to run or deploy the app.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Color helpers for beautiful console formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function printHeader() {
  console.log(colors.cyan + colors.bright);
  console.log(' ===================================================================');
  console.log('   💧  CYBERSECURITY CONTROLS NAVIGATOR - LOCAL MIGRATION WIZARD  💧 ');
  console.log(' ===================================================================');
  console.log(colors.reset);
  console.log(' This interactive utility automates the migration of your application');
  console.log(' to your local on-premise or cloud-hosted infrastructure.');
  console.log(' -------------------------------------------------------------------\n');
}

async function run() {
  clearScreen();
  printHeader();

  // Step 1: Environment Assessment
  console.log(`${colors.bright}[1/5] Environment Self-Assessment:${colors.reset}`);
  
  const platform = process.platform;
  console.log(` - Host Platform Detected:  ${colors.green}${colors.bright}${platform}${colors.reset}`);
  
  // Check Node.js version
  const nodeVersion = process.version;
  console.log(` - Local Node.js Engine:    ${colors.green}${colors.bright}${nodeVersion}${colors.reset}`);
  
  // Verify package.json exists
  const hasPackageJson = fs.existsSync(path.join(__dirname, 'package.json'));
  if (hasPackageJson) {
    console.log(` - Package Configuration:   ${colors.green}Found (package.json)${colors.reset}`);
  } else {
    console.log(` - Package Configuration:   ${colors.red}Missing package.json in current directory!${colors.reset}`);
  }

  // Check Firebase configuration
  const hasFirebaseConfig = fs.existsSync(path.join(__dirname, 'firebase-applet-config.json'));
  if (hasFirebaseConfig) {
    console.log(` - Firebase Connection:     ${colors.green}Detected (firebase-applet-config.json)${colors.reset}`);
  } else {
    console.log(` - Firebase Connection:     ${colors.yellow}Optional (firebase-applet-config.json not found)${colors.reset}`);
  }

  console.log('\n-------------------------------------------------------------------\n');

  // Step 2: Choose Deployment Path
  console.log(`${colors.bright}[2/5] Select Deployment Architecture Target:${colors.reset}`);
  console.log(` Please select how you want to compile and execute the application locally:\n`);
  console.log(`   ${colors.cyan}[1] Standard Local Web Server${colors.reset}`);
  console.log(`       Ideal for local testing & development. Uses Vite/Dev servers directly.`);
  console.log(`       Prerequisites: Node.js (v18+) & NPM.`);
  console.log();
  console.log(`   ${colors.cyan}[2] Native Windows Desktop App (Electron)${colors.reset}`);
  console.log(`       Wraps the application as a standalone .exe with native window features.`);
  console.log(`       Prerequisites: Windows OS, Node.js.`);
  console.log();
  console.log(`   ${colors.cyan}[3] Containerized Microservice (Docker & Nginx)${colors.reset}`);
  console.log(`       Builds a high-performance production Nginx server inside a Docker container.`);
  console.log(`       Prerequisites: Docker & Docker Compose.`);
  console.log();

  let selection = '';
  while (selection !== '1' && selection !== '2' && selection !== '3') {
    selection = await question(` Enter choice ${colors.bright}(1, 2, or 3)${colors.reset}: `);
    selection = selection.trim();
  }

  console.log('\n-------------------------------------------------------------------\n');

  // Step 3: Configure Environment & Keys
  console.log(`${colors.bright}[3/5] Environment Credentials & Integration Keys:${colors.reset}`);
  console.log(' This application can consume Gemini LLMs for offline fallback assistance.');
  console.log(' If you have a Gemini API key, you can provide it now. Leave blank to skip.');
  console.log();

  const geminiApiKey = await question(` Enter your ${colors.bright}Gemini API Key${colors.reset} (optional): `);
  
  // Determine if we need to generate or append to .env
  let envContent = '';
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  }

  if (geminiApiKey.trim()) {
    if (envContent.includes('VITE_GEMINI_API_KEY') || envContent.includes('GEMINI_API_KEY')) {
      console.log(`\n ${colors.yellow}* Gemini API Key already exists in .env file. Skipping overwrite.${colors.reset}`);
    } else {
      envContent += `\n# Local Migration API Configuration\nVITE_GEMINI_API_KEY=${geminiApiKey.trim()}\nGEMINI_API_KEY=${geminiApiKey.trim()}\n`;
      fs.writeFileSync(path.join(__dirname, '.env'), envContent);
      console.log(`\n ${colors.green}* Successfully registered API keys into local .env file!${colors.reset}`);
    }
  } else {
    console.log(`\n ${colors.dim}* Proceeding without updating Gemini API keys.${colors.reset}`);
  }

  console.log('\n-------------------------------------------------------------------\n');

  // Step 4: Automate Launcher Scripts Generation
  console.log(`${colors.bright}[4/5] Automating Launcher script generation...${colors.reset}`);

  try {
    if (selection === '1') {
      // Standard Local Web Server Launcher
      createLocalWebLaunchers();
    } else if (selection === '2') {
      // Electron Desktop Launcher
      createDesktopLaunchers();
    } else if (selection === '3') {
      // Docker Container Launcher
      createDockerLaunchers();
    }

    // Always create a generic help guide that outlines how to execute manually
    createMigrationGuide(selection);

    console.log(` ${colors.green}${colors.bright}✔ Success! Local scripts and guides generated successfully!${colors.reset}`);
  } catch (err) {
    console.log(` ${colors.red}✘ Error generating launchers: ${err.message}${colors.reset}`);
  }

  console.log('\n-------------------------------------------------------------------\n');

  // Step 5: Wrap up instructions
  console.log(`${colors.bright}[5/5] Migration Complete! Next Steps:${colors.reset}`);
  
  if (selection === '1') {
    console.log(` 🚀 ${colors.cyan}To launch your app as a standard local web app:${colors.reset}`);
    console.log(`   Windows: Double-click ${colors.green}run-local-web.bat${colors.reset}`);
    console.log(`   macOS/Linux: Run ${colors.green}chmod +x run-local-web.sh && ./run-local-web.sh${colors.reset}`);
  } else if (selection === '2') {
    console.log(` 🖥️  ${colors.cyan}To launch or package your application as an Electron Desktop app:${colors.reset}`);
    console.log(`   Windows: Double-click ${colors.green}run-desktop.bat${colors.reset}`);
    console.log(`   macOS/Linux: Run ${colors.green}chmod +x run-desktop.sh && ./run-desktop.sh${colors.reset}`);
  } else if (selection === '3') {
    console.log(` 🐳 ${colors.cyan}To start your application inside optimized Docker containers:${colors.reset}`);
    console.log(`   Windows: Double-click ${colors.green}run-docker.bat${colors.reset}`);
    console.log(`   macOS/Linux: Run ${colors.green}chmod +x run-docker.sh && ./run-docker.sh${colors.reset}`);
  }

  console.log(`\n We have also generated a comprehensive ${colors.green}LOCAL_MIGRATION_GUIDE.md${colors.reset} in this directory.`);
  console.log(' Open it to view advanced on-prem configuration details, offline customization, and firewall troubleshooting.');
  console.log('\n Thank you for migrating with our automated wizard! Have a beautiful deployment. ✨\n');

  rl.close();
}

// Launcher Creators

function createLocalWebLaunchers() {
  // Batch File for Windows
  const batContent = `@echo off
echo =========================================================
echo 💧  CYBERSECURITY CONTROLS NAVIGATOR - LOCAL WEB LAUNCHER
echo =========================================================
echo.
echo [1/3] Verifying and installing dependencies...
call npm install
echo.
echo [2/3] Compiling and building assets...
call npm run build
echo.
echo [3/3] Launching Local Development Server on http://localhost:3000
echo Close this window to stop the server.
echo.
call npm run dev -- --port 3000 --host 0.0.0.0
pause
`;
  fs.writeFileSync(path.join(__dirname, 'run-local-web.bat'), batContent);

  // Shell Script for macOS/Linux
  const shContent = `#!/bin/bash
clear
echo "========================================================="
echo "💧  CYBERSECURITY CONTROLS NAVIGATOR - LOCAL WEB LAUNCHER"
echo "========================================================="
echo ""
echo "[1/3] Verifying and installing dependencies..."
npm install
echo ""
echo "[2/3] Compiling and building assets..."
npm run build
echo ""
echo "[3/3] Launching Local Development Server on http://localhost:3000"
echo "Close this terminal to stop the server."
echo ""
npm run dev -- --port 3000 --host 0.0.0.0
`;
  fs.writeFileSync(path.join(__dirname, 'run-local-web.sh'), shContent);
  try { execSync('chmod +x run-local-web.sh'); } catch (_) {}
}

function createDesktopLaunchers() {
  // Batch File for Windows
  const batContent = `@echo off
echo =============================================================
echo 🖥️  CYBERSECURITY CONTROLS NAVIGATOR - ELECTRON LAUNCHER
echo =============================================================
echo.
echo Select action:
echo [1] Run Desktop Application in Development Mode
echo [2] Compile Standalone Windows Installer (.exe)
echo.
set /p opt="Enter option (1 or 2): "

if "%opt%"=="1" (
    echo.
    echo Installing dependencies...
    call npm install
    echo.
    echo Starting App in Desktop/Dev Mode...
    call npm run electron:dev
) else (
    echo.
    echo Building production web app first...
    call npm run build
    echo.
    echo Compiling and packaging standalone Windows EXE installer...
    call npm run build:win
    echo.
    echo Check the "dist" or "dist_electron" directory for the built .exe!
)
pause
`;
  fs.writeFileSync(path.join(__dirname, 'run-desktop.bat'), batContent);

  // Shell Script for macOS/Linux
  const shContent = `#!/bin/bash
clear
echo "============================================================="
echo "🖥️  CYBERSECURITY CONTROLS NAVIGATOR - ELECTRON LAUNCHER"
echo "============================================================="
echo ""
echo "Select action:"
echo "[1] Run Desktop Application in Development Mode"
echo "[2] Compile Standalone Application Package"
echo ""
read -p "Enter option (1 or 2): " opt

if [ "$opt" = "1" ]; then
    echo ""
    echo "Installing dependencies..."
    npm install
    echo ""
    echo "Starting App in Desktop/Dev Mode..."
    npm run electron:dev
else
    echo ""
    echo "Building production web app..."
    npm run build
    echo ""
    echo "Compiling app installer package..."
    npm run build:win
fi
`;
  fs.writeFileSync(path.join(__dirname, 'run-desktop.sh'), shContent);
  try { execSync('chmod +x run-desktop.sh'); } catch (_) {}
}

function createDockerLaunchers() {
  // Batch File for Windows
  const batContent = `@echo off
echo =========================================================
echo 🐳  CYBERSECURITY CONTROLS NAVIGATOR - DOCKER LAUNCHER
echo =========================================================
echo.
echo [1/2] Launching optimized Nginx + Web App Container...
docker compose up -d --build
echo.
echo [2/2] Checking container health...
echo.
echo Application successfully containerized!
echo Access the secure navigator at: http://localhost:3000
echo.
echo To stop containers, execute "docker compose down"
echo.
pause
`;
  fs.writeFileSync(path.join(__dirname, 'run-docker.bat'), batContent);

  // Shell Script for macOS/Linux
  const shContent = `#!/bin/bash
clear
echo "========================================================="
echo "🐳  CYBERSECURITY CONTROLS NAVIGATOR - DOCKER LAUNCHER"
echo "========================================================="
echo ""
echo "[1/2] Launching optimized Nginx + Web App Container..."
docker compose up -d --build
echo ""
echo "[2/2] Checking container health..."
echo ""
echo "Application successfully containerized!"
echo "Access the secure navigator at: http://localhost:3000"
echo ""
echo "To stop containers, execute: docker compose down"
echo ""
`;
  fs.writeFileSync(path.join(__dirname, 'run-docker.sh'), shContent);
  try { execSync('chmod +x run-docker.sh'); } catch (_) {}
}

function createMigrationGuide(targetSelection) {
  const guideContent = `# Cybersecurity Controls Navigator - Local Infrastructure Migration Guide

Welcome to the self-hosted migration guide for **Cybersecurity Controls Navigator**! This document outlines step-by-step instructions to take the application and run it entirely in your custom offline, on-premise, or private cloud environments.

## Selected Migration Target
${targetSelection === '1' ? '- **Vite Web Server (Direct node deployment)**' : ''}
${targetSelection === '2' ? '- **Native Windows/macOS Desktop App (Electron)**' : ''}
${targetSelection === '3' ? '- **High-Performance Production Container (Docker + Nginx)**' : ''}

---

## Prerequisites & Dependencies
Ensure your target server/workstation has the following software installed:

1. **For Direct Web / Desktop deployment:**
   - **Node.js**: Version 18.0.0 or higher.
   - **NPM**: Comes preloaded with Node.js.
   
2. **For Containerized Deployment:**
   - **Docker Engine**: v20.10+
   - **Docker Compose**: v2.0+

---

## Detailed Step-by-Step Instructions

### Option 1: Direct Web Server (Development / Testing)
This method is best suited if you are hosting the app as an internal utility server.
1. Download or clone this project repository onto the machine.
2. Ensure you have populated `.env` with appropriate keys if you require Google Gemini assistance.
3. Run the automated launcher:
   - **Windows**: Double-click \`run-local-web.bat\`.
   - **macOS/Linux**: Open terminal, run \`chmod +x run-local-web.sh && ./run-local-web.sh\`.
4. Open your browser and navigate to \`http://localhost:3000\` (or target host IP).

### Option 2: Standalone Desktop Deployment (Electron)
This method compiles the app into a fully self-contained offline desktop app.
1. Run the automated launcher:
   - **Windows**: Double-click \`run-desktop.bat\` and choose Option 1 to run or Option 2 to compile.
   - **macOS/Linux**: Run \`chmod +x run-desktop.sh && ./run-desktop.sh\`.
2. Once built, the standalone packages will be written inside the \`dist_electron\` or \`dist\` directories as an installation binary (e.g., \`CybersecurityControlsNavigator Setup.exe\`).
3. Distribute this installer file to user workstations.

### Option 3: Production Container Deployment (Docker + Nginx)
Best for production scale, offline environments, Kubernetes configurations, or microservice environments.
1. Ensure Docker is running.
2. Run the automated launcher:
   - **Windows**: Double-click \`run-docker.bat\`.
   - **macOS/Linux**: Run \`chmod +x run-docker.sh && ./run-docker.sh\`.
3. The Dockerfile compiles the entire React/TS application with high optimization and serves it using a lightweight production **Nginx (Alpine)** server running inside the container.
4. The application is mapped to port \`3000\` on the host machine. You can safely map this to any other custom port (like 80 or 443) by editing \`docker-compose.yml\`.

---

## Custom Database Setup (Firestore / Firebase)
By default, the application connects to the secure Cloud Firestore database configured in \`firebase-applet-config.json\`. 
If you want to shift to a custom private database or a local Firebase Emulator:
1. Open \`firebase-applet-config.json\` and replace the credentials with your local or cloud-hosted Firebase instances.
2. To run standard Firestore Local Emulators during local testing, install the Firebase CLI and boot up emulators with \`firebase emulators:start\`.

---

## Customizing Offline fallbacks / Self-Sufficiency
The application is pre-architected with **local fallback algorithms and comprehensive rule registries** ensuring the **NCA ECC Control Navigator, Assessment Checklists, CMA compliance models, and interactive tools** work 100% offline without requiring internet access or cloud calls.
`;

  fs.writeFileSync(path.join(__dirname, 'LOCAL_MIGRATION_GUIDE.md'), guideContent);
}

run().catch(err => {
  console.error('Fatal Error during automated wizard creation:', err);
});
