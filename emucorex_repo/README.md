# EmuStation

[![License: GPL v3+](https://img.shields.io/badge/License-GPLv3%2B-blue.svg)](LICENSE)

**EmuStation** (`com.dimm.emustation`) é uma biblioteca, launcher e emulador de PlayStation 2 para Android projetado para GPUs **Qualcomm Adreno** e **ARM Mali / Immortalis**.

## Destaques

- Motor de emulação nativo ARM64-v8a otimizado para Android moderno (páginas de **4 KB** e **16 KB** para Android 15+)
- Perfis adaptativos para topologias **2+6 big.LITTLE** (Adreno intermediárias) e **1+3+4 DynamIQ** (Motorola Edge 60 Pro / Mali-G615 e flagships)
- Tela inicial com capas, pesquisa rápida, histórico recente e gerenciamento de diretórios/ISOs
- Painel rápido durante o jogo para Motor Gráfico (`Vulkan` / `OpenGL ES`), proporção `16:9`, resolução interna, Turbo e Save States
- Controles DualShock 2 em tela sem sobreposição para modos retrato e paisagem, além de suporte completo a Gamepads físicos
- Central de patches (`.pnach`), Memory Cards virtuais (`.ps2`) e sistema de Conquistas

## Requisitos Recomendados

- **Processador:** Snapdragon 750G / 855 ou MediaTek Dimensity equivalente ou superior
- **Memória:** mínimo de 4 GB de RAM (6 GB+ recomendados para escalonamento 2x+)
- **Sistema:** Android 10 (API 29) ou superior

## Especificações do Módulo Android

- `applicationId`: `com.dimm.emustation`
- `namespace`: `com.dimm.emustation`
- `minSdk`: `29`
- `targetSdk`: `37`
- `abiFilters`: `arm64-v8a`

## Compilação Local

### Requisitos
- Android Studio com **NDK `29.0.14206865`** e **CMake `3.22.1`**
- **JDK 17**

### Build Debug & Release

```bash
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```

## Estrutura de Pastas

- `app/` Módulo principal Android
- `app/src/main/cpp` Código nativo C++ / JNI / CMake
- `app/src/main/assets` Recursos integrados do emulador

## Avisos Legais

- Este projeto **não distribui** arquivos de BIOS nem imagens de jogos.
- Utilize apenas backups obtidos legalmente dos seus próprios consoles e discos.

## Licença

Distribuído sob os termos da licença GNU General Public License v3.0 ou posterior. Consulte [LICENSE](LICENSE).
