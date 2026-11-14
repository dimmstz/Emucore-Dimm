# Changelog

Todas as mudanças notáveis do **EmuStation** (`com.dimm.emustation`) são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.5.0] - 2026-11-14

### Added
- Identidade oficial **EmuStation** e pacote Android **`com.dimm.emustation`**, com novo emblema 3D aplicado na interface, menu lateral, conquistas e metadados web.
- Suporte multi-dispositivo calibrado para GPUs **Qualcomm Adreno** e **ARM Mali / Immortalis**, incluindo **Motorola Edge 60 Pro** (Dimensity 8350 Extreme / Mali-G615), **Samsung Galaxy M23 5G** (Adreno 619) e flagships.
- Pipelines de **CI**, **Release automático por Tag SemVer** (`v*.*.*`) e **Bump & Tag** em `.github/workflows/`.
- Alinhamento nativo ARM64-v8a de **4 KB e 16 KB** para compatibilidade completa com Android 15+.

### Changed
- Reorganização do menu lateral e simplificação completa dos rótulos e categorias de configurações para o usuário final (`Geral`, `Gráficos`, `Desempenho`, `Áudio`, `Controles`).
- Redesign responsivo dos controles DualShock 2 em tela com ancoragem segura para retrato, paisagem e desktop, eliminando qualquer sobreposição entre botões, analógicos e barras de ação.

### Fixed
- Corrigida colisão dos botões `L1`/`L2` e `R1`/`R2` com a barra superior e conflitos horizontais entre `L3`, `R3` e barra central em telas móveis.
