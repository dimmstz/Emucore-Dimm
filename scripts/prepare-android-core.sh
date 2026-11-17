#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/emucorex_repo"
CPP_DIR="$ANDROID_DIR/app/src/main/cpp"
ASSETS_DIR="$ANDROID_DIR/app/src/main/assets"
UPSTREAM_REPO="https://github.com/sashkinbro/EmuCoreX.git"
UPSTREAM_COMMIT="01fc29806d25a14a97c41aa01e8e53e5f2141c7e"

echo "==> Preparando nucleo nativo Android em $ANDROID_DIR..."

if [ ! -d "$CPP_DIR/ARM_ANDROID" ] || [ ! -d "$CPP_DIR/pcsx2" ] || [ ! -d "$ASSETS_DIR" ]; then
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT

  echo "==> Baixando nucleo C++/CMake (ARM_ANDROID, pcsx2) e assets..."
  git init -q "$TMP_DIR/upstream"
  git -C "$TMP_DIR/upstream" remote add origin "$UPSTREAM_REPO"
  git -C "$TMP_DIR/upstream" config core.sparseCheckout true
  {
    echo "app/src/main/cpp/ARM_ANDROID"
    echo "app/src/main/cpp/pcsx2"
    echo "app/src/main/assets"
  } > "$TMP_DIR/upstream/.git/info/sparse-checkout"

  # Robust fetch fallback for GitHub Actions
  git -C "$TMP_DIR/upstream" fetch --depth=100 origin || git -C "$TMP_DIR/upstream" fetch origin
  git -C "$TMP_DIR/upstream" checkout -q "$UPSTREAM_COMMIT" 2>/dev/null || git -C "$TMP_DIR/upstream" checkout -q FETCH_HEAD || true

  mkdir -p "$CPP_DIR" "$ASSETS_DIR"
  cp -rn "$TMP_DIR/upstream/app/src/main/cpp/ARM_ANDROID" "$CPP_DIR/" || cp -r "$TMP_DIR/upstream/app/src/main/cpp/ARM_ANDROID" "$CPP_DIR/" || true
  cp -rn "$TMP_DIR/upstream/app/src/main/cpp/pcsx2" "$CPP_DIR/" || cp -r "$TMP_DIR/upstream/app/src/main/cpp/pcsx2" "$CPP_DIR/" || true
  cp -rn "$TMP_DIR/upstream/app/src/main/assets/"* "$ASSETS_DIR/" 2>/dev/null || cp -r "$TMP_DIR/upstream/app/src/main/assets/"* "$ASSETS_DIR/" 2>/dev/null || true
fi

# Compatibilidade case-sensitive Linux (CMake/Gradle referenciam PCSX2/ em maiusculas)
if [ -d "$CPP_DIR/pcsx2" ] && [ ! -e "$CPP_DIR/PCSX2" ]; then
  ln -sfn pcsx2 "$CPP_DIR/PCSX2"
fi

# Baixa patches.zip oficial se ausente (com fallback seguro)
PATCHES_ZIP="$CPP_DIR/pcsx2/bin/resources/patches.zip"
if [ ! -f "$PATCHES_ZIP" ]; then
  mkdir -p "$(dirname "$PATCHES_ZIP")"
  echo "==> Baixando patches.zip oficial..."
  curl -fsSL -L "https://github.com/PCSX2/pcsx2_patches/releases/latest/download/patches.zip" -o "$PATCHES_ZIP" || {
    echo "Aviso: Falha ao baixar patches.zip; criando arquivo vazio para continuar o build."
    touch "$PATCHES_ZIP"
  }
fi

# Aplica otimizacao de topologia ARM em VMManager.cpp se ausente e se for repositorio git
VMMANAGER_CPP="$CPP_DIR/pcsx2/pcsx2/VMManager.cpp"
if [ -f "$VMMANAGER_CPP" ] && ! grep -q "s_big_cores_android" "$VMMANAGER_CPP"; then
  echo "==> Aplicando otimizacoes de afinidade ARM64 em VMManager.cpp..."
  if [ -d "$ANDROID_DIR/.git" ]; then
    git -C "$ANDROID_DIR" apply --ignore-space-change --ignore-whitespace --include="app/src/main/cpp/pcsx2/pcsx2/VMManager.cpp" "$ROOT_DIR/patches/0001-emucorex-galaxy-m23-optimization.patch" 2>/dev/null || true
  else
    echo "Aviso: emucorex_repo nao e um repositorio git; patch sera aplicado se necessario ou ignorado."
  fi
fi

echo "==> Nucleo nativo Android pronto."
