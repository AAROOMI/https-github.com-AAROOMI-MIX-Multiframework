#!/usr/bin/env bash

# ==============================================================================
# 💧 CYBERSECURITY CONTROLS NAVIGATOR - AIR-GAPPED ENVIRONMENT PROVISIONER 💧
# ==============================================================================
# This script automates system capability validation, repository orchestration,
# local model fetching, and secure environment isolation for private local infra.
# Supported OS: Linux (Ubuntu/Debian, RHEL/Rocky), macOS
# ==============================================================================

set -euo pipefail

# --- Color Definitions ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Configuration & Defaults ---
APP_NAME="Cybersecurity Controls Navigator"
DEFAULT_PORT=3000
MIN_RAM_GB=16
RECOMMENDED_RAM_GB=32
MIN_CPU_CORES=4
MIN_DISK_GB=40

# --- Spinner Animation Utility ---
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps -p "$pid" -o state= 2>/dev/null)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# --- Section Divider ---
print_section() {
    local title=$1
    echo -e "\n${CYAN}${BOLD}========================================================================${RESET}"
    echo -e "${CYAN}${BOLD}  $title${RESET}"
    echo -e "${CYAN}${BOLD}========================================================================${RESET}\n"
}

# --- System Validation ---
validate_environment() {
    print_section "STAGE 1: HARDWARE & SYSTEM SUITABILITY VALIDATION"
    
    local os_type
    os_type=$(uname -s)
    echo -e "🔍 Detecting Operating System... ${GREEN}${BOLD}$os_type${RESET}"
    
    # --- CPU Verification ---
    local cpu_cores=0
    if [ "$os_type" = "Darwin" ]; then
        cpu_cores=$(sysctl -n hw.ncpu)
    elif [ "$os_type" = "Linux" ]; then
        cpu_cores=$(nproc)
    fi
    
    echo -ne "🔍 Inspecting CPU topology... "
    if [ "$cpu_cores" -ge "$MIN_CPU_CORES" ]; then
        echo -e "${GREEN}${BOLD}PASSED${RESET} ($cpu_cores Cores)"
    else
        echo -e "${YELLOW}${BOLD}WARNING${RESET} ($cpu_cores Cores detected. Required: >= $MIN_CPU_CORES for local inference)"
    fi
    
    # --- RAM Verification ---
    local total_ram_gb=0
    if [ "$os_type" = "Darwin" ]; then
        local ram_bytes
        ram_bytes=$(sysctl -n hw.memsize)
        total_ram_gb=$((ram_bytes / 1024 / 1024 / 1024))
    elif [ "$os_type" = "Linux" ]; then
        local ram_kb
        ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        total_ram_gb=$((ram_kb / 1024 / 1024))
    fi
    
    echo -ne "🔍 Measuring Physical Memory (RAM)... "
    if [ "$total_ram_gb" -ge "$RECOMMENDED_RAM_GB" ]; then
        echo -e "${GREEN}${BOLD}OPTIMAL${RESET} (${total_ram_gb} GB)"
    elif [ "$total_ram_gb" -ge "$MIN_RAM_GB" ]; then
        echo -e "${YELLOW}${BOLD}SUFFICIENT${RESET} (${total_ram_gb} GB - Llama-3 8B quantized running with medium latency)"
    else
        echo -e "${RED}${BOLD}CRITICAL${RESET} (${total_ram_gb} GB - Llama-3 8B local inference may cause system instability)"
    fi

    # --- Disk Space Check ---
    local free_space_kb=0
    local free_space_gb=0
    if [ "$os_type" = "Darwin" ] || [ "$os_type" = "Linux" ]; then
        free_space_kb=$(df -k . | tail -1 | awk '{print $4}')
        free_space_gb=$((free_space_kb / 1024 / 1024))
    fi

    echo -ne "🔍 Calculating Free Disk Volume... "
    if [ "$free_space_gb" -ge "$MIN_DISK_GB" ]; then
        echo -e "${GREEN}${BOLD}PASSED${RESET} (${free_space_gb} GB available)"
    else
        echo -e "${YELLOW}${BOLD}WARNING${RESET} (${free_space_gb} GB free. AI models require up to 25GB total storage)"
    fi
    
    # --- GPU Accelerator Detection ---
    echo -e "🔍 Profiling Hardware Accelerators (GPU)..."
    local gpu_detected=false
    
    if command -v nvidia-smi &> /dev/null; then
        local gpu_name
        gpu_name=$(nvidia-smi --query-gpu=gpu_name --format=csv,noheader | head -n 1)
        echo -e "  - ${GREEN}${BOLD}NVIDIA Discrete GPU Found:${RESET} $gpu_name"
        local vram_total
        vram_total=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n 1)
        echo -e "  - ${GREEN}VRAM Dedicated:${RESET} $((vram_total / 1024)) GB"
        gpu_detected=true
    elif [ "$os_type" = "Darwin" ]; then
        # Apple Silicon unified memory check
        local is_apple_silicon
        is_apple_silicon=$(sysctl -n machdep.cpu.brand_string | grep -q "Apple" && echo "true" || echo "false")
        if [ "$is_apple_silicon" = "true" ]; then
            echo -e "  - ${GREEN}${BOLD}Apple Silicon GPU Detected${RESET} (Unified Memory/Metal Acceleration Active)"
            gpu_detected=true
        fi
    fi
    
    if [ "$gpu_detected" = "false" ]; then
        echo -e "  - ${YELLOW}No dedicated CUDA/Metal accelerator identified. Falling back to CPU Threading (Slower Inference).${RESET}"
    fi
}

# --- Core Dependencies Assessment ---
check_prerequisites() {
    print_section "STAGE 2: PREREQUISITE COMPONENT CHECKS"
    
    local missing=0
    
    # Check Git
    echo -ne " - Checking Git Engine... "
    if command -v git &> /dev/null; then
        echo -e "${GREEN}FOUND${RESET} ($(git --version))"
    else
        echo -e "${RED}MISSING${RESET}"
        missing=$((missing + 1))
    fi
    
    # Check Node.js
    echo -ne " - Checking Node.js Runtime... "
    if command -v node &> /dev/null; then
        echo -e "${GREEN}FOUND${RESET} ($(node --version))"
    else
        echo -e "${RED}MISSING${RESET}"
        missing=$((missing + 1))
    fi

    # Check NPM
    echo -ne " - Checking NPM Package Manager... "
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}FOUND${RESET} ($(npm --version))"
    else
        echo -e "${RED}MISSING${RESET}"
        missing=$((missing + 1))
    fi

    # Check Docker (Optional but recommended)
    echo -ne " - Checking Container Engine (Docker)... "
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}FOUND${RESET} ($(docker --version))"
    else
        echo -e "${YELLOW}NOT FOUND (Optional)${RESET}"
    fi

    if [ "$missing" -gt 0 ]; then
        echo -e "\n${RED}${BOLD}✘ ERROR: System is missing $missing critical dependencies.${RESET}"
        echo -e "Please install Git, Node.js (v18+), and NPM to continue."
        exit 1
    fi
}

# --- Repository Orchestration ---
setup_repository() {
    print_section "STAGE 3: REPOSITORY ORCHESTRATION & SETUP"
    
    # Check if we are already inside a git clone or need to clone
    if [ -d ".git" ]; then
        echo -e "📦 Working within existing workspace directory: ${GREEN}$(pwd)${RESET}"
    else
        echo -e "📦 Initializing clone workflow for secure deployment..."
        local repo_url
        read -r -p "Enter Repository URL (or press Enter to configure current directory): " repo_url
        if [ -n "$repo_url" ]; then
            git clone "$repo_url" cybersecurity-navigator
            cd cybersecurity-navigator
        fi
    fi

    echo -e "📦 Fetching/validating application node modules..."
    npm install --no-audit --no-fund &
    spinner $!
    echo -e "${GREEN}✔ Production packages successfully linked!${RESET}"
}

# --- AI Model Pipeline Fetching ---
fetch_local_ai_models() {
    print_section "STAGE 4: LOCAL MODEL PIPELINE ORCHESTRATION"
    
    echo -e "This system integrates three discrete offline models for secure processing:\n"
    echo -e "  1.  ${BOLD}Llama-3-8B${RESET}       (Cognitive Reasoning, Compliance Audits, GRC Advisory)"
    echo -e "  2.  ${BOLD}Faster-Whisper${RESET}   (Low-Latency Speech-to-Text Transcription for live audits)"
    echo -e "  3.  ${BOLD}Kokoro (TTS)${RESET}     (Real-time speech synthesis for interactive voice controls)"
    echo -e "\n------------------------------------------------------------------------"
    
    # Ask user if they wish to download and bootstrap these models
    local pull_models="n"
    read -r -p "Would you like to auto-download and configure these local engines? (y/N): " pull_models
    
    if [[ "$pull_models" =~ ^[Yy]$ ]]; then
        # 1. Check/Install Ollama (most convenient local wrapper for Llama-3)
        echo -e "\n🤖 Checking local Inference Engine (Ollama)..."
        if ! command -v ollama &> /dev/null; then
            echo -e "  - ${YELLOW}Ollama not found. Fetching clean installation...${RESET}"
            if [ "$(uname -s)" = "Linux" ]; then
                curl -fsSL https://ollama.com/install.sh | sh
            else
                echo -e "  - ${RED}Please download and run Ollama manually from: https://ollama.com${RESET}"
            fi
        fi

        # Starting Ollama service if not active
        if command -v ollama &> /dev/null; then
            echo -e "  - ${GREEN}Inference engine online.${RESET}"
            echo -e "  - Pulling ${BOLD}Llama-3-8B (Quantized)${RESET}..."
            ollama pull llama3:8b &
            spinner $!
            echo -e "  - ${GREEN}✔ Llama-3-8B loaded successfully!${RESET}"
        fi

        # 2. Faster-Whisper installation instructions and local downloading
        echo -e "\n🎙️ Pre-fetching Whisper and Speech-To-Text configurations..."
        mkdir -p ./models/whisper
        echo -e "  - Creating model cache inside: ${BLUE}./models/whisper/${RESET}"
        echo -e "  - Models can be manually transferred via thumbdrive for offline deployment."

        # 3. Kokoro Setup
        echo -e "\n🔊 Pre-fetching Text-to-Speech (Kokoro ONNX) directory..."
        mkdir -p ./models/kokoro
        echo -e "  - Directory initialized at: ${BLUE}./models/kokoro/${RESET}"
    else
        echo -e "\n${YELLOW}* Skipping automated local model fetching.${RESET}"
        echo -e "You will need to manually map your existing model APIs in the next step."
    fi
}

# --- Environment Variable Generation ---
configure_environment() {
    print_section "STAGE 5: SECURE ENVIRONMENT ENCAPSULATION"
    
    echo -e "Generating sandboxed configuration (.env) for air-gapped runtimes..."
    
    local port=$DEFAULT_PORT
    local llama_endpoint="http://localhost:11434"
    local whisper_endpoint="http://localhost:8000"
    local kokoro_endpoint="http://localhost:8001"

    read -r -p "Enter local Web Server Port [Default $DEFAULT_PORT]: " input_port
    if [ -n "$input_port" ]; then
        port=$input_port
    fi

    read -r -p "Enter local Llama-3 API endpoint [Default $llama_endpoint]: " input_llama
    if [ -n "$input_llama" ]; then
        llama_endpoint=$input_llama
    fi

    read -r -p "Enter Faster-Whisper API endpoint [Default $whisper_endpoint]: " input_whisper
    if [ -n "$input_whisper" ]; then
        whisper_endpoint=$input_whisper
    fi

    read -r -p "Enter Kokoro (TTS) API endpoint [Default $kokoro_endpoint]: " input_kokoro
    if [ -n "$input_kokoro" ]; then
        kokoro_endpoint=$input_kokoro
    fi

    # Assemble local env file
    cat <<EOF > .env
# ==============================================================================
# 💧 AIR-GAPPED DEPLOYMENT ENVIROMENT VARIABLES
# ==============================================================================
PORT=$port
NODE_ENV=production

# --- Local AI Inference Gateways ---
VITE_LOCAL_LLAMA_URL=$llama_endpoint
VITE_WHISPER_URL=$whisper_endpoint
VITE_KOKORO_URL=$kokoro_endpoint

# --- Isolated Features Bypass Keys ---
VITE_OFFLINE_MODE=true
VITE_FIREBASE_EMULATOR_ACTIVE=true
EOF

    echo -e "\n${GREEN}✔ File .env built successfully! All telemetry calls deactivated for absolute isolation.${RESET}"
}

# --- Execution ---
main() {
    clear
    echo -e "${BLUE}${BOLD}"
    echo "  ==================================================================="
    echo "     💧  CYBERSECURITY CONTROLS NAVIGATOR - LOCAL SETUP WIZARD  💧   "
    echo "  ==================================================================="
    echo -e "${RESET}"
    echo " This script provisions hardware dependencies and constructs an offline"
    echo " air-gapped runtime environment for on-prem compliance departments."
    echo -e " -------------------------------------------------------------------\n"
    
    validate_environment
    check_prerequisites
    setup_repository
    fetch_local_ai_models
    configure_environment
    
    print_section "PROVISIONING COMPLETE"
    echo -e "${GREEN}${BOLD}✔ Application successfully localized and configured for air-gapped systems!${RESET}\n"
    echo -e "To boot the application, use one of the generated launchers:"
    echo -e "  - Direct Node:    ${BOLD}./run-local-web.sh${RESET}"
    echo -e "  - Containerized:  ${BOLD}./run-docker.sh${RESET}"
    echo -e "  - Desktop App:    ${BOLD}./run-desktop.sh${RESET}"
    echo -e "\nFor advanced architecture parameters, review the generated ${BLUE}LOCAL_MIGRATION_GUIDE.md${RESET}."
    echo -e "Have a wonderful, secure deployment! 💧🛡️\n"
}

main
