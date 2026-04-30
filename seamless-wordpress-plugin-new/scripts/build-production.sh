#!/bin/bash

# Production Build Script for Seamless WordPress Plugin
# This script creates a clean, optimized production build

set -e  # Exit on error

echo "================================"
echo "Seamless Production Build Script"
echo "================================"
echo ""

# Get the plugin directory (parent of scripts/)
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PLUGIN_DIR"

echo "📁 Working directory: $PLUGIN_DIR"
echo ""

# Step 1: Check dependencies
echo "1️⃣  Checking dependencies..."
if ! command -v yarn &> /dev/null; then
    echo "❌ Error: yarn is not installed"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    echo "❌ Error: composer is not installed"
    exit 1
fi
echo "✅ Dependencies OK"
echo ""

# Step 2: Install node dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "2️⃣  Installing node dependencies..."
    yarn install
    echo "✅ Node dependencies installed"
else
    echo "2️⃣  Node dependencies already installed"
fi
echo ""

# Step 3: Build assets with Vite
echo "3️⃣  Building production assets..."
yarn build:production
echo "✅ Assets built successfully"
echo ""

# Step 4: Optimize Composer autoloader (optional - can reduce vendor size slightly)
echo "4️⃣  Optimizing Composer autoloader..."
composer dump-autoload --optimize --no-dev 2>/dev/null || composer dump-autoload --optimize
echo "✅ Autoloader optimized"
echo ""

# Step 5: Verify build outputs
echo "5️⃣  Verifying build outputs..."
if [ ! -d "src/Public/dist/js" ] || [ ! -d "src/Public/dist/css" ]; then
    echo "❌ Error: Build outputs not found in src/Public/dist/"
    exit 1
fi
echo "✅ Build outputs verified"
echo ""

# Step 6: Show build statistics
echo "📊 Build Statistics:"
echo "-------------------"
du -sh node_modules 2>/dev/null && echo "  node_modules: $(du -sh node_modules | cut -f1)" || echo "  node_modules: Not found"
echo "  vendor: $(du -sh vendor | cut -f1)"
echo "  dist assets: $(du -sh src/Public/dist | cut -f1)"
echo ""

# Step 7: Create production ZIP
echo "6️⃣  Creating production ZIP..."
PLUGIN_NAME=$(basename "$PLUGIN_DIR")
PARENT_DIR=$(dirname "$PLUGIN_DIR")
ZIP_NAME="seamless-production-$(date +%Y%m%d-%H%M%S).zip"
TEMP_EXCLUDE_FILE=""

cd "$PARENT_DIR"

cleanup() {
    if [ -n "$TEMP_EXCLUDE_FILE" ] && [ -f "$TEMP_EXCLUDE_FILE" ]; then
        rm -f "$TEMP_EXCLUDE_FILE"
    fi
}

trap cleanup EXIT

build_zip_pattern() {
    local pattern="$1"

    # Ignore comments / blanks before calling this helper.
    if [[ "$pattern" == */ ]]; then
        printf '%s/%s*\n' "$PLUGIN_NAME" "$pattern"
        return
    fi

    printf '%s/%s\n' "$PLUGIN_NAME" "$pattern"
}

# Check if .distignore exists
if [ -f "$PLUGIN_NAME/.distignore" ]; then
    echo "  Using .distignore for exclusions..."
    TEMP_EXCLUDE_FILE=$(mktemp)

    while IFS= read -r raw_line || [ -n "$raw_line" ]; do
        line="${raw_line%$'\r'}"

        # Skip comments and blank lines.
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # zip exclude files do not support gitignore-style negation.
        # Keep explicit include patterns out of the generated exclude list.
        if [[ "$line" == !* ]]; then
            continue
        fi

        build_zip_pattern "$line" >> "$TEMP_EXCLUDE_FILE"
    done < "$PLUGIN_NAME/.distignore"

    zip -r "$ZIP_NAME" "$PLUGIN_NAME" -x@"$TEMP_EXCLUDE_FILE"
	else
	    echo "  ⚠️  Warning: .distignore not found, using default exclusions"
	    zip -r "$ZIP_NAME" "$PLUGIN_NAME" \
	        -x "$PLUGIN_NAME/node_modules/*" \
	        -x "$PLUGIN_NAME/src/js/seamless.js" \
	        -x "$PLUGIN_NAME/src/css/seamless.css" \
	        -x "$PLUGIN_NAME/.git/*" \
	        -x "$PLUGIN_NAME/package.json" \
	        -x "$PLUGIN_NAME/yarn.lock" \
	        -x "$PLUGIN_NAME/vite.config.js"
	fi

ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "✅ Production ZIP created: $ZIP_NAME ($ZIP_SIZE)"
echo ""

	# Step 8: Verify ZIP contents
	echo "7️⃣  Verifying ZIP contents..."
	if unzip -l "$ZIP_NAME" | grep -q "$PLUGIN_NAME/src/js/shop.js"; then
	    echo "✅ shop.js included in production ZIP"
	else
	    echo "❌ Error: $PLUGIN_NAME/src/js/shop.js is missing from production ZIP"
	    exit 1
	fi

	# Verify dev-only files are excluded.
	EXCLUDED_CHECK=$(unzip -l "$ZIP_NAME" \
	    | grep -E "(node_modules|src/js/seamless\\.js|src/css/seamless\\.css|package.json|vite.config)" \
	    || echo "")
	if [ -z "$EXCLUDED_CHECK" ]; then
	    echo "✅ All development files properly excluded"
	else
	    echo "⚠️  Warning: Some development files may be included:"
    echo "$EXCLUDED_CHECK"
fi
echo ""

# Restore composer dependencies if we used --no-dev
if grep -q "no-dev" <<< "$@"; then
    echo "8️⃣  Restoring dev dependencies..."
    cd "$PLUGIN_DIR"
    composer install
    echo "✅ Dev dependencies restored"
    echo ""
fi

echo "================================"
echo "✅ Production build complete!"
echo "================================"
echo ""
echo "📦 Package: $PARENT_DIR/$ZIP_NAME"
echo "📏 Size: $ZIP_SIZE"
echo ""
echo "Next steps:"
echo "  1. Test the plugin by extracting $ZIP_NAME"
echo "  2. Verify all features work correctly"
echo "  3. Deploy to production"
echo ""
