#!/bin/bash

# FFmpeg Installation Script für Video-Service
# Unterstützt: macOS, Linux (Ubuntu/Debian), Windows (via Chocolatey)

set -e

echo "🎥 FFmpeg Installation für Video-Service"

# OS Detection
OS="$(uname -s)"
case "${OS}" in
    Linux*)
        echo "📦 Linux erkannt"
        if command -v apt-get &> /dev/null; then
            echo "Installing FFmpeg via apt-get..."
            sudo apt-get update
            sudo apt-get install -y ffmpeg
        elif command -v yum &> /dev/null; then
            echo "Installing FFmpeg via yum..."
            sudo yum install -y ffmpeg
        else
            echo "❌ Paket-Manager nicht erkannt. Bitte FFmpeg manuell installieren."
            exit 1
        fi
        ;;
    Darwin*)
        echo "📦 macOS erkannt"
        if command -v brew &> /dev/null; then
            echo "Installing FFmpeg via Homebrew..."
            brew install ffmpeg
        else
            echo "❌ Homebrew nicht gefunden. Installiere Homebrew:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "📦 Windows erkannt"
        if command -v choco &> /dev/null; then
            echo "Installing FFmpeg via Chocolatey..."
            choco install ffmpeg -y
        else
            echo "❌ Chocolatey nicht gefunden. Installiere Chocolatey:"
            echo "   https://chocolatey.org/install"
            echo ""
            echo "Oder lade FFmpeg manuell herunter:"
            echo "   https://ffmpeg.org/download.html"
            exit 1
        fi
        ;;
    *)
        echo "❌ Betriebssystem nicht unterstützt: ${OS}"
        echo "Bitte installiere FFmpeg manuell: https://ffmpeg.org/download.html"
        exit 1
        ;;
esac

# Verify Installation
if command -v ffmpeg &> /dev/null && command -v ffprobe &> /dev/null; then
    echo "✅ FFmpeg erfolgreich installiert!"
    echo ""
    echo "Version:"
    ffmpeg -version | head -n 1
    ffprobe -version | head -n 1
else
    echo "❌ FFmpeg Installation fehlgeschlagen"
    exit 1
fi
