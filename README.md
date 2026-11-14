<div align="center">
  <img src="public/assets/aistudio/file_00000000e108820ebd0c993f45fc28b9_7f7680c5.png" alt="EmuStation Logo" width="120" height="120" />
  <h1>EmuStation</h1>
  <p><strong>Emulador PlayStation 2 Multi-Dispositivo para Android (Adreno &amp; Mali)</strong></p>
  <p>Repositório: <code>Emustation-Google-Ai</code> · Pacote: <code>com.dimm.emustation</code> · Arquitetura: <code>arm64-v8a</code></p>
</div>

---

## Visão Geral

O **EmuStation** combina uma interface moderna em estilo Android com um motor gráfico calibrado automaticamente para diferentes arquiteturas móveis — cobrindo desde intermediários **Qualcomm Adreno** (`2+6 big.LITTLE`) até dispositivos avançados **ARM Mali / Immortalis** (`1+3+4 DynamIQ`), como o **Motorola Edge 60 Pro** com suporte nativo ao Android 15+.

## Principais Recursos

- **Calibração Multi-GPU (Adreno & Mali)**: Perfis automáticos e manuais por dispositivo, ajustando `Vulkan 1.3` / `OpenGL ES 3.2`, resolução interna, leitura de memória de vídeo (`HWDownloadMode`), `VSync` e processamento multi-thread (`MTVU`).
- **Controle DualShock 2 em Tela + Gamepad**: Layout responsivo sem sobreposição nos modos retrato, paisagem e desktop, com edição de posição por arraste, vibração háptica, estilos visuais e compatibilidade com controles USB/Bluetooth.
- **Biblioteca & Catálogo de Jogos**: Visualização em grade ou lista, adição local de ISOs (`.iso`, `.chd`, `.cso`, `.bin`), histórico recente e catálogo com perfis otimizados.
- **Central de Patches & Conquistas**: Gerenciamento integrado de patches de desempenho/widescreen (`.pnach`), Memory Cards virtuais (`.ps2`), exportação de perfis `.ini` e painel de Conquistas.
- **Pronto para Android 15+**: Compilação universal `arm64-v8a` com alinhamento ELF de **16 KB** (`0x4000`) e **4 KB** (`0x1000`).

---

## Estrutura do Projeto

```text
.
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # Build & Lint Web + Android CI
│   │   ├── release.yml           # Publicação automática ao enviar tag v*.*.*
│   │   └── tag-and-version.yml   # Bump de versão & criação de Tag via Actions
│   ├── ISSUE_TEMPLATE/           # Relatório de Bug e Perfil de Dispositivo
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── src/                          # Interface Web & Configurador Interativo
├── public/assets/                # Ícone oficial e ativos estáticos
├── emucorex_repo/                # Projeto Nativo Android (Kotlin + C++ JNI/CMake)
├── scripts/release.sh            # Script auxiliar de Tag & Release SemVer
├── CHANGELOG.md
└── README.md
```

---

## Como Rodar Localmente

### 1. Interface Web / Configurador

Requer **Node.js 20+** e **npm**:

```bash
npm install
npm run lint
npm run build
npm run dev
```

### 2. Aplicativo Android (`com.dimm.emustation`)

Requer **JDK 17**, **Android SDK (API 36/37)**, **NDK `29.0.14206865`** e **CMake `3.22.1`** dentro de `emucorex_repo/`:

```bash
cd emucorex_repo
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
```

Para assinar o APK/AAB de release localmente, adicione ao arquivo `emucorex_repo/local.properties`:

```properties
emucorex.release.storeFile=caminho/para/sua.keystore
emucorex.release.storePassword=SUA_SENHA_STORE
emucorex.release.keyAlias=SEU_ALIAS
emucorex.release.keyPassword=SUA_SENHA_KEY
```

---

## Fluxo de GitHub Actions, Tags e Releases

### 1. Integração Contínua (`ci.yml`)
Executado automaticamente em todo `push` e `pull_request` para `main`, `master` ou `develop`:
- Valida TypeScript (`npm run lint`), gera o build Vite (`npm run build`) e salva o artefato web.
- Verifica a configuração do pacote `com.dimm.emustation` e compila o APK Android Debug quando o Gradle wrapper estiver presente.

### 2. Criando Tags e Publicando Releases (`release.yml` e `tag-and-version.yml`)

Você pode gerar uma nova versão e disparar o Release de **duas formas**:

**Opção A — Pelo GitHub Actions (1 clique):**
1. Acesse a aba **Actions → Bump Version & Create Tag**.
2. Clique em **Run workflow** e escolha `patch`, `minor`, `major` ou `custom`.
3. O workflow atualiza `package.json` + `versionCode`/`versionName`, cria a tag anotada `vX.Y.Z` e dispara o `EmuStation Release`.

**Opção B — Via terminal local:**
```bash
./scripts/release.sh v0.5.0
git push origin HEAD && git push origin v0.5.0
```

### Secrets recomendados para APK/AAB assinado no GitHub
Configure em **Settings → Secrets and variables → Actions**:
- `ANDROID_KEYSTORE_BASE64`: Conteúdo da keystore convertido em Base64 (`base64 -w0 release.keystore`)
- `ANDROID_STORE_PASSWORD`: Senha da keystore
- `ANDROID_KEY_ALIAS`: Alias da chave
- `ANDROID_KEY_PASSWORD`: Senha da chave

---

## Licença

Consulte o arquivo [`emucorex_repo/LICENSE`](emucorex_repo/LICENSE) para detalhes de licenciamento.
