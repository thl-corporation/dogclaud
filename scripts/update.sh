#!/bin/bash
# DogClaud - Script de actualización automática
# Cierra la app, pull, compila, instala .deb y reinicia

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "==> Cerrando DogClaud..."
pkill -f "/opt/DogClaud/dogclaud" 2>/dev/null && sleep 1 || echo "    (no estaba corriendo)"

echo "==> Pulling últimos cambios..."
git pull origin main

echo "==> Instalando dependencias..."
npm install --silent

echo "==> Compilando y empaquetando..."
npm run dist:linux

echo "==> Instalando paquete .deb..."
if [ -z "$SUDO_PASS" ]; then
  read -s -p "    Contraseña sudo: " SUDO_PASS
  echo
fi
VERSION=$(node -p "require('./package.json').version")
echo "$SUDO_PASS" | sudo -S dpkg -i "$PROJECT_DIR/release/dogclaud_${VERSION}_amd64.deb"

echo "==> Iniciando DogClaud..."
nohup dogclaud >/dev/null 2>&1 &
disown

echo "==> DogClaud actualizado y corriendo."
