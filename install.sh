#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
say(){ printf '\n[Konferans Radar] %s\n' "$1"; }
fail(){ printf '\nKurulum durdu: %s\n' "$1" >&2; exit 1; }
temporary=""
cleanup(){ if [ -n "$temporary" ]; then rm -rf -- "$temporary"; fi; }
trap cleanup EXIT
trap 'printf "\nKurulum tamamlanamadı. Üstteki hatayı giderip komutu tekrar çalıştırın.\n" >&2' ERR
valid_node(){ command -v node >/dev/null 2>&1 && node -e 'if(Number(process.versions.node.split(".")[0])<24)process.exit(1);const db=new(require("node:sqlite").DatabaseSync)(":memory:");db.close()' >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; }
if [ -x .runtime/node/bin/node ]; then export PATH="$PWD/.runtime/node/bin:$PATH"; fi
if valid_node; then say "Uygun Node.js bulundu: $(node -v)"
else
 say "Uygun Node.js yok. Node.js 24 proje klasörüne kurulacak."
 case "$(uname -s)" in Linux) platform=linux;; Darwin) platform=darwin;; *) fail "Desteklenmeyen sistem. Windows için install.ps1 kullanın.";; esac
 case "$(uname -m)" in x86_64|amd64) architecture=x64;; aarch64|arm64) architecture=arm64;; *) fail "Desteklenmeyen işlemci. Node.js 24+ kurup tekrar deneyin.";; esac
 command -v tar >/dev/null || fail "tar gerekli."
 temporary="$(mktemp -d)"
 download(){ if command -v curl >/dev/null; then curl --fail --location --retry 3 --connect-timeout 20 --max-time 600 "$1" -o "$2"; elif command -v wget >/dev/null; then wget --tries=3 --timeout=60 -O "$2" "$1"; else fail "curl veya wget gerekli. Kurup komutu yeniden çalıştırın."; fi; }
 base="https://nodejs.org/dist/latest-v24.x"
 download "$base/SHASUMS256.txt" "$temporary/SHASUMS256.txt"
 archive="$(awk -v suffix="-$platform-$architecture.tar.gz" '$2 ~ /^node-v24\.[0-9]+\.[0-9]+-/ && index($2,suffix)==length($2)-length(suffix)+1 {print $2;exit}' "$temporary/SHASUMS256.txt")"
 [ -n "$archive" ] || fail "Bu sistem için resmi Node.js paketi bulunamadı."
 expected="$(awk -v name="$archive" '$2==name {print $1}' "$temporary/SHASUMS256.txt")"
 download "$base/$archive" "$temporary/$archive"
 if command -v sha256sum >/dev/null; then actual="$(sha256sum "$temporary/$archive" | awk '{print $1}')"
 elif command -v shasum >/dev/null; then actual="$(shasum -a 256 "$temporary/$archive" | awk '{print $1}')"
 else fail "SHA-256 doğrulama aracı bulunamadı."; fi
 [ "$actual" = "$expected" ] || fail "İndirilen paketin SHA-256 özeti uyuşmuyor. Kurulum yapılmadı."
 mkdir "$temporary/node"
 tar -xzf "$temporary/$archive" -C "$temporary/node" --strip-components=1
 "$temporary/node/bin/node" -e 'require("node:sqlite")' || fail "Node.js bu sistemde çalışmıyor; işletim sistemi uyumluluğunu kontrol edin."
 mkdir -p .runtime
 if [ -e .runtime/node ]; then mv .runtime/node ".runtime/node-previous-$(date +%s)"; fi
 mv "$temporary/node" .runtime/node
 export PATH="$PWD/.runtime/node/bin:$PATH"
fi
export RADAR_NPM_CLI="$(command -v npm)"
node scripts/setup.mjs
