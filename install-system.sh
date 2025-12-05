#!/bin/bash

# Script to install PIRATE BORG system to remote Foundry VTT server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

check_pass() {
    echo -e "${GREEN}  ✓${NC} $1"
}

check_fail() {
    echo -e "${RED}  ✗${NC} $1"
}

check_info() {
    echo -e "${CYAN}  ℹ${NC} $1"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Install PIRATE BORG system to remote Foundry VTT server"
    echo ""
    echo "Options:"
    echo "  -c, --check    Dry run mode - verify setup without making changes"
    echo "  -y, --yes      Auto-restart Foundry without prompting"
    echo "  -h, --help     Show this help message"
    echo ""
    echo "Configuration:"
    echo "  Server settings are loaded from .env file"
    echo "  Update .env file to set FOUNDRY_HOST variable"
    echo ""
    echo "Example .env configuration can be found in .env.example"
    echo ""
    exit 1
}

# Parse command line arguments
DRY_RUN=false
AUTO_RESTART=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--check)
            DRY_RUN=true
            shift
            ;;
        -y|--yes)
            AUTO_RESTART=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Load environment variables
if [[ -f ".env" ]]; then
    source .env
    log "Loaded configuration from .env file"
else
    error "No .env file found. Please create one based on .env.example"
    exit 1
fi

# Validate required environment variables
if [[ -z "$FOUNDRY_HOST" ]]; then
    error "FOUNDRY_HOST not set in .env file"
    exit 1
fi

if [[ -z "$FOUNDRY_INSTALL_PATH" ]]; then
    error "FOUNDRY_INSTALL_PATH not set in .env file"
    exit 1
fi

if [[ -z "$SYSTEM_NAME" ]]; then
    error "SYSTEM_NAME not set in .env file"
    exit 1
fi

# Use environment variables directly
REMOTE_HOST="$FOUNDRY_HOST"
SYSTEM_PATH="$FOUNDRY_INSTALL_PATH"

# ============================================
# DRY RUN MODE - Validate setup without changes
# ============================================
if [[ "$DRY_RUN" == true ]]; then
    echo ""
    log "=========================================="
    log "DRY RUN - Checking Installation Setup"
    log "=========================================="
    echo ""
    
    CHECK_PASSED=true
    
    # Section 1: Environment Configuration
    echo -e "${BLUE}Environment Configuration:${NC}"
    check_pass ".env file loaded successfully"
    check_pass "FOUNDRY_HOST: ${FOUNDRY_HOST}"
    check_pass "FOUNDRY_INSTALL_PATH: ${FOUNDRY_INSTALL_PATH}"
    check_pass "SYSTEM_NAME: ${SYSTEM_NAME}"
    echo ""
    
    # Section 2: Local Files
    echo -e "${BLUE}Local System Files:${NC}"
    if [ -f "system.json" ]; then
        # Extract local system info for comparison later
        LOCAL_SYSTEM_JSON=$(cat system.json)
        SYSTEM_VERSION=$(echo "$LOCAL_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).version||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
        LOCAL_TITLE=$(echo "$LOCAL_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).title||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
        LOCAL_COMPAT_MIN=$(echo "$LOCAL_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).compatibility?.minimum||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
        LOCAL_COMPAT_VERIFIED=$(echo "$LOCAL_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).compatibility?.verified||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
        LOCAL_COMPAT="${LOCAL_COMPAT_MIN} - ${LOCAL_COMPAT_VERIFIED}"
        check_pass "system.json (version: ${SYSTEM_VERSION})"
    else
        check_fail "system.json - NOT FOUND"
        CHECK_PASSED=false
    fi
    
    if [ -f "module/pirateborg.js" ]; then
        check_pass "module/pirateborg.js"
    else
        check_fail "module/pirateborg.js - NOT FOUND"
        CHECK_PASSED=false
    fi
    
    if [ -f "template.json" ]; then
        check_pass "template.json"
    else
        check_fail "template.json - NOT FOUND"
        CHECK_PASSED=false
    fi
    echo ""
    
    # Section 3: Git Information
    echo -e "${BLUE}Git Information:${NC}"
    if command -v git &> /dev/null; then
        if git rev-parse --git-dir > /dev/null 2>&1; then
            GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
            GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
            # Extract base version (everything before the first dash)
            BASE_VERSION=$(echo "$SYSTEM_VERSION" | cut -d'-' -f1)
            check_pass "Git repository detected"
            check_info "Current branch: ${GIT_BRANCH}"
            check_info "Current commit: ${GIT_COMMIT}"
            check_info "Version will be tagged: ${BASE_VERSION}-${GIT_BRANCH}-${GIT_COMMIT}"
        else
            check_fail "Not a git repository - version tagging will fail"
            CHECK_PASSED=false
        fi
    else
        check_fail "Git not installed - version tagging will fail"
        CHECK_PASSED=false
    fi
    echo ""
    
    # Section 4: Node.js
    echo -e "${BLUE}Node.js:${NC}"
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
        check_pass "Node.js installed (${NODE_VERSION})"
    else
        check_fail "Node.js not installed - required for version tagging"
        CHECK_PASSED=false
    fi
    echo ""
    
    # Section 5: SSH Connectivity
    echo -e "${BLUE}SSH Connectivity:${NC}"
    log "Testing SSH connection to ${REMOTE_HOST}..."
    if ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" "echo 'connected'" > /dev/null 2>&1; then
        check_pass "SSH connection to ${REMOTE_HOST} successful"
        
        # Check remote directory
        if ssh "$REMOTE_HOST" "[ -d $(dirname $SYSTEM_PATH) ]" 2>/dev/null; then
            check_pass "Parent directory $(dirname $SYSTEM_PATH) exists"
        else
            check_fail "Parent directory $(dirname $SYSTEM_PATH) does not exist"
            CHECK_PASSED=false
        fi
        
        # Check if system already exists and get details
        if ssh "$REMOTE_HOST" "[ -d $SYSTEM_PATH ]" 2>/dev/null; then
            check_info "Existing system found at ${SYSTEM_PATH} (will be replaced)"
            REMOTE_SYSTEM_EXISTS=true
        else
            check_info "No existing system at ${SYSTEM_PATH} (fresh install)"
            REMOTE_SYSTEM_EXISTS=false
        fi
        
        # Check write permissions
        if ssh "$REMOTE_HOST" "touch $(dirname $SYSTEM_PATH)/.install_test && rm $(dirname $SYSTEM_PATH)/.install_test" 2>/dev/null; then
            check_pass "Write permissions verified"
        else
            check_fail "No write permissions to $(dirname $SYSTEM_PATH)"
            CHECK_PASSED=false
        fi
        # Section 6: Remote System Info (only if exists and SSH works)
        if [[ "$REMOTE_SYSTEM_EXISTS" == true ]]; then
            echo ""
            echo -e "${BLUE}Remote System Info:${NC}"
            
            # Get remote system.json info
            REMOTE_SYSTEM_JSON=$(ssh "$REMOTE_HOST" "cat $SYSTEM_PATH/system.json 2>/dev/null" || echo "{}")
            if [[ "$REMOTE_SYSTEM_JSON" != "{}" ]]; then
                REMOTE_VERSION=$(echo "$REMOTE_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).version||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
                REMOTE_TITLE=$(echo "$REMOTE_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).title||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
                REMOTE_COMPAT_MIN=$(echo "$REMOTE_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).compatibility?.minimum||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
                REMOTE_COMPAT_VERIFIED=$(echo "$REMOTE_SYSTEM_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).compatibility?.verified||'unknown')}catch{console.log('unknown')}})" 2>/dev/null || echo "unknown")
                REMOTE_COMPAT="${REMOTE_COMPAT_MIN} - ${REMOTE_COMPAT_VERIFIED}"
                check_info "Title: ${REMOTE_TITLE}"
                check_info "Version: ${REMOTE_VERSION}"
                check_info "Foundry Compatibility: ${REMOTE_COMPAT}"
                REMOTE_INFO_AVAILABLE=true
            else
                check_info "Could not read remote system.json"
                REMOTE_INFO_AVAILABLE=false
            fi
            
            # Get last modified time
            REMOTE_MODIFIED=$(ssh "$REMOTE_HOST" "stat -c '%y' $SYSTEM_PATH/system.json 2>/dev/null | cut -d'.' -f1" || echo "unknown")
            if [[ "$REMOTE_MODIFIED" != "unknown" && -n "$REMOTE_MODIFIED" ]]; then
                check_info "Last modified: ${REMOTE_MODIFIED}"
            fi
            
            # Count files
            REMOTE_FILE_COUNT=$(ssh "$REMOTE_HOST" "find $SYSTEM_PATH -type f 2>/dev/null | wc -l" || echo "unknown")
            if [[ "$REMOTE_FILE_COUNT" != "unknown" ]]; then
                check_info "Total files: ${REMOTE_FILE_COUNT}"
            fi
            
            # Count local files for comparison
            LOCAL_FILE_COUNT=$(find . -type f \( ! -path './.git/*' ! -path './node_modules/*' ! -name '*.log' ! -name '.DS_Store' ! -name 'install-system.sh' ! -name 'gulpfile.js' ! -name 'package*.json' ! -path './utils/*' ! -path './scss/*' \) 2>/dev/null | wc -l || echo "unknown")
        else
            REMOTE_INFO_AVAILABLE=false
        fi
    else
        check_fail "SSH connection to ${REMOTE_HOST} failed"
        check_info "Ensure SSH key is configured and host is reachable"
        CHECK_PASSED=false
        REMOTE_SYSTEM_EXISTS=false
        REMOTE_INFO_AVAILABLE=false
    fi
    echo ""
    
    # Section 7: Changes Summary (comparison)
    if [[ "$REMOTE_SYSTEM_EXISTS" == true && "$REMOTE_INFO_AVAILABLE" == true ]]; then
        echo -e "${BLUE}Changes Summary:${NC}"
        echo ""
        
        # Calculate the new version that will be applied
        NEW_VERSION="${BASE_VERSION}-${GIT_BRANCH}-${GIT_COMMIT}"
        
        # Helper function to show comparison line
        compare_field() {
            local field_name="$1"
            local remote_val="$2"
            local local_val="$3"
            
            if [[ "$remote_val" == "$local_val" ]]; then
                printf "  ${CYAN}%-22s${NC} %-30s ${YELLOW}→${NC} %-30s\n" "$field_name" "$remote_val" "(no change)"
            else
                printf "  ${CYAN}%-22s${NC} %-30s ${GREEN}→${NC} %-30s\n" "$field_name" "$remote_val" "$local_val"
            fi
        }
        
        # Table header
        printf "  ${CYAN}%-22s${NC} ${YELLOW}%-30s${NC}   ${GREEN}%-30s${NC}\n" "Field" "Remote (current)" "Local (new)"
        printf "  %-22s %-30s   %-30s\n" "──────────────────────" "──────────────────────────────" "──────────────────────────────"
        
        # Compare each field
        compare_field "Version" "$REMOTE_VERSION" "$NEW_VERSION"
        compare_field "Title" "$REMOTE_TITLE" "$LOCAL_TITLE"
        compare_field "Foundry Min" "$REMOTE_COMPAT_MIN" "$LOCAL_COMPAT_MIN"
        compare_field "Foundry Verified" "$REMOTE_COMPAT_VERIFIED" "$LOCAL_COMPAT_VERIFIED"
        compare_field "File Count" "$REMOTE_FILE_COUNT" "$LOCAL_FILE_COUNT"
        
        echo ""
        
        # Show git changes summary if version differs
        if [[ "$REMOTE_VERSION" != "$NEW_VERSION" ]]; then
            # Extract remote commit if it follows the pattern
            REMOTE_COMMIT=$(echo "$REMOTE_VERSION" | grep -oE '[a-f0-9]{7}$' || echo "")
            if [[ -n "$REMOTE_COMMIT" && -n "$GIT_COMMIT" && "$REMOTE_COMMIT" != "$GIT_COMMIT" ]]; then
                COMMIT_COUNT=$(git rev-list --count ${REMOTE_COMMIT}..${GIT_COMMIT} 2>/dev/null || echo "")
                if [[ -n "$COMMIT_COUNT" && "$COMMIT_COUNT" -gt 0 ]]; then
                    check_info "${COMMIT_COUNT} new commit(s) since last install"
                fi
            fi
        fi
        echo ""
    elif [[ "$REMOTE_SYSTEM_EXISTS" == false ]]; then
        echo -e "${BLUE}Changes Summary:${NC}"
        check_info "Fresh installation - no remote system to compare"
        echo ""
    fi
    
    # Section 8: Required Tools
    echo -e "${BLUE}Required Tools:${NC}"
    if command -v rsync &> /dev/null; then
        check_pass "rsync installed"
    else
        check_fail "rsync not installed"
        CHECK_PASSED=false
    fi
    
    if command -v scp &> /dev/null; then
        check_pass "scp installed"
    else
        check_fail "scp not installed"
        CHECK_PASSED=false
    fi
    echo ""
    
    # Summary
    log "=========================================="
    if [[ "$CHECK_PASSED" == true ]]; then
        success "All checks passed! Ready to install."
        log "Run without --check flag to perform installation"
        log "=========================================="
        exit 0
    else
        error "Some checks failed. Please fix the issues above."
        log "=========================================="
        exit 1
    fi
fi

# ============================================
# NORMAL INSTALLATION MODE
# ============================================

log "=========================================="
log "Installing ${SYSTEM_NAME} System"
log "=========================================="
log "Target Host: ${REMOTE_HOST}"
log "System Path: ${SYSTEM_PATH}"
log "System ID: ${SYSTEM_NAME}"

# Create temporary directory for installation
TEMP_DIR=$(mktemp -d)
log "Created temporary directory: $TEMP_DIR"
trap "log 'Cleaning up temporary directory...'; rm -rf $TEMP_DIR" EXIT

# Update version with git info before copying
log "Updating version with git information..."
node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('system.json')); s.version=s.version.split('-')[0]+'-'+require('child_process').execSync('git branch --show-current',{encoding:'utf8'}).trim()+'-'+require('child_process').execSync('git rev-parse --short HEAD',{encoding:'utf8'}).trim(); fs.writeFileSync('system.json',JSON.stringify(s,null,2)+'\n'); console.log('Updated version:',s.version)"

# Copy system files to temp directory (exclude dev files and temp files)
log "Copying system files to temporary directory..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='*.log' --exclude='.DS_Store' --exclude='install-system.sh' --exclude='gulpfile.js' --exclude='package*.json' --exclude='utils' --exclude='scss' ./ "$TEMP_DIR/"

# List files being installed
log "Files to be installed:"
ls -la "$TEMP_DIR/" | while read line; do
    echo "  $line"
done

# Verify critical files exist
if [ ! -f "$TEMP_DIR/system.json" ]; then
    error "system.json not found in source files!"
    exit 1
fi

if [ ! -f "$TEMP_DIR/module/pirateborg.js" ]; then
    error "module/pirateborg.js not found in source files!"
    exit 1
fi

if [ ! -f "$TEMP_DIR/template.json" ]; then
    error "template.json not found in source files!"
    exit 1
fi

success "System files prepared for installation"

# Remove existing system on remote
log "Cleaning up existing system on remote host..."
if ssh $REMOTE_HOST "[ -d $SYSTEM_PATH ]"; then
    warning "Existing system found at $SYSTEM_PATH, removing..."
    ssh $REMOTE_HOST "rm -rf $SYSTEM_PATH" || {
        error "Failed to remove existing system"
        exit 1
    }
    success "Existing system removed"
else
    log "No existing system found, proceeding with fresh install"
fi

log "Creating system directory on remote host..."
ssh $REMOTE_HOST "mkdir -p $SYSTEM_PATH" || {
    error "Failed to create system directory"
    exit 1
}
success "System directory created"

# Copy system to Foundry
log "Copying system to Foundry..."
log "Transfer starting..."
scp -r "$TEMP_DIR"/* "$REMOTE_HOST:$SYSTEM_PATH" || {
    error "Failed to copy system files"
    exit 1
}
success "System files transferred successfully"

# Verify installation
log "Verifying installation..."
REMOTE_FILES=$(ssh $REMOTE_HOST "ls -la $SYSTEM_PATH" 2>&1)
if [ $? -eq 0 ]; then
    log "Installed files on remote:"
    echo "$REMOTE_FILES" | while read line; do
        echo "  $line"
    done
    
    # Check for critical files
    ssh $REMOTE_HOST "[ -f $SYSTEM_PATH/system.json ]" || {
        error "system.json not found after installation!"
        exit 1
    }
    ssh $REMOTE_HOST "[ -f $SYSTEM_PATH/module/pirateborg.js ]" || {
        error "module/pirateborg.js not found after installation!"
        exit 1
    }
    ssh $REMOTE_HOST "[ -f $SYSTEM_PATH/template.json ]" || {
        error "template.json not found after installation!"
        exit 1
    }
    success "Installation verified"
else
    error "Failed to verify installation"
    exit 1
fi

echo ""
log "=========================================="
success "System installed successfully!"
log "System ID: ${SYSTEM_NAME}"
log "Installation Path: ${REMOTE_HOST}:${SYSTEM_PATH}"
log "=========================================="

echo ""

# Handle restart based on AUTO_RESTART flag or user input
if [[ "$AUTO_RESTART" == true ]]; then
    log "Auto-restart enabled, restarting Foundry..."
    if ssh $REMOTE_HOST "source ~/.nvm/nvm.sh && pm2 restart 0" 2>/dev/null; then
        success "Foundry restarted successfully!"
    else
        error "Failed to restart Foundry"
        warning "System is installed but Foundry may need manual restart"
        warning "Try: ssh $REMOTE_HOST 'source ~/.nvm/nvm.sh && pm2 restart 0'"
    fi
else
    echo -e "${YELLOW}Press Enter to restart Foundry, or any other key to skip...${NC}"
    read -n 1 -s key

    if [[ -z "$key" ]]; then
        log "Restarting Foundry..."
        if ssh $REMOTE_HOST "source ~/.nvm/nvm.sh && pm2 restart 0" 2>/dev/null; then
            success "Foundry restarted successfully!"
        else
            error "Failed to restart Foundry"
            warning "System is installed but Foundry may need manual restart"
            warning "Try: ssh $REMOTE_HOST 'source ~/.nvm/nvm.sh && pm2 restart 0'"
        fi
    else
        echo ""
        log "Skipped Foundry restart"
        warning "Remember to restart Foundry to see the updated system"
        log "Run: ssh $REMOTE_HOST 'source ~/.nvm/nvm.sh && pm2 restart 0'"
    fi
fi

echo ""
log "=========================================="
log "Installation complete!"
log "==========================================" 