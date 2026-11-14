#!/usr/bin/env bash
set -euo pipefail

# Uso: ./scripts/release.sh v0.5.0
TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Uso: $0 <tag-semver> (ex: ./scripts/release.sh v0.5.0)"
  exit 1
fi

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Erro: Tag inválida '$TAG'. Use o formato SemVer: vX.Y.Z"
  exit 1
fi

VERSION="${TAG#v}"

echo "==> Validando TypeScript e Build Web..."
npm run lint
npm run build

echo "==> Atualizando versão para $VERSION..."
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

if [ -f "emucorex_repo/app/build.gradle.kts" ]; then
  sed -i -E "s/versionName = \"[^\"]+\"/versionName = \"$VERSION\"/" emucorex_repo/app/build.gradle.kts
fi

echo "==> Criando commit e tag anotada $TAG..."
git add package.json emucorex_repo/app/build.gradle.kts CHANGELOG.md 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit -m "chore(release): $TAG"
fi

git tag -a "$TAG" -m "EmuStation $TAG"

echo ""
echo "Tag $TAG criada com sucesso!"
echo "Para publicar o Release automaticamente no GitHub Actions, execute:"
echo "  git push origin HEAD && git push origin $TAG"
