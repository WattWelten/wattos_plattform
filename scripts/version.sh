#!/bin/bash
set -euo pipefail

COMMAND=${1:-help}

case "$COMMAND" in
  "bump")
    TYPE=${2:-patch}
    
    if [ "$TYPE" != "major" ] && [ "$TYPE" != "minor" ] && [ "$TYPE" != "patch" ]; then
      echo "❌ Invalid version type: $TYPE"
      echo "Usage: $0 bump [major|minor|patch]"
      exit 1
    fi
    
    echo "Bumping $TYPE version..."
    
    # Get current version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo "Current version: $CURRENT_VERSION"
    
    # Bump version
    npm version "$TYPE" --no-git-tag-version
    
    # Get new version
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "New version: $NEW_VERSION"
    
    # Update all package.json files in monorepo
    find apps packages -name "package.json" -type f | while read -r pkg; do
      if [ -f "$pkg" ]; then
        # Update version in package.json (if it exists)
        node -e "
          const fs = require('fs');
          const pkg = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
          if (pkg.version) {
            pkg.version = '$NEW_VERSION';
            fs.writeFileSync('$pkg', JSON.stringify(pkg, null, 2) + '\n');
          }
        " || true
      fi
    done
    
    echo "✅ Version bumped to $NEW_VERSION"
    echo "Don't forget to commit and tag:"
    echo "  git add ."
    echo "  git commit -m 'chore: bump version to $NEW_VERSION'"
    echo "  git tag v$NEW_VERSION"
    echo "  git push && git push --tags"
    ;;
  
  "current")
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo "Current version: $CURRENT_VERSION"
    ;;
  
  "tag")
    VERSION=${2:-}
    
    if [ -z "$VERSION" ]; then
      VERSION=$(node -p "require('./package.json').version")
    fi
    
    # Remove 'v' prefix if present
    VERSION=${VERSION#v}
    
    echo "Creating git tag: v$VERSION"
    git tag "v$VERSION"
    echo "✅ Tag created: v$VERSION"
    echo "Push with: git push --tags"
    ;;
  
  *)
    echo "Usage: $0 [bump|current|tag]"
    echo ""
    echo "Commands:"
    echo "  bump [major|minor|patch]  - Bump version"
    echo "  current                   - Show current version"
    echo "  tag [version]             - Create git tag"
    exit 1
    ;;
esac












