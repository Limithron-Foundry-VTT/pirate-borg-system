#!/bin/bash

# Script to install PIRATE BORG system to remote Foundry VTT server

set -e

# Show usage information
show_usage() {
    echo "Usage: $0"
    echo ""
    echo "Install PIRATE BORG system to remote Foundry VTT server"
    echo ""
    echo "Configuration:"
    echo "  Server settings are loaded from .env file"
    echo "  Update .env file to set FOUNDRY_HOST variable"
    echo ""
    echo "Example .env configuration can be found in .env.example"
    echo ""
    exit 1
}

# Check for help flag
if [[ $1 == "--help" || $1 == "-h" ]]; then
    show_usage
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

log "=========================================="
log "Installing ${SYSTEM_NAME} System"
log "=========================================="
log "Target Host: ${REMOTE_HOST}"
log "Foundry Version: ${FOUNDRY_VERSION}"
log "System Path: ${SYSTEM_PATH}"
log "System ID: ${SYSTEM_NAME}"

# Create temporary directory for installation
TEMP_DIR=$(mktemp -d)
log "Created temporary directory: $TEMP_DIR"
trap "log 'Cleaning up temporary directory...'; rm -rf $TEMP_DIR" EXIT

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

# echo ""
# log "Restarting Foundry..."
# ssh $REMOTE_HOST "source ~/.nvm/nvm.sh && pm2 restart 0" || {
#     error "Failed to restart Foundry"
#     warning "Module is installed but Foundry may need manual restart"
# }
# success "Foundry restarted"

echo ""
log "=========================================="
success "System installed successfully!"
log "System ID: ${SYSTEM_NAME}"
log "Installation Path: ${REMOTE_HOST}:${SYSTEM_PATH}"
log "Note: You may need to restart Foundry to see the system"
log "==========================================" 