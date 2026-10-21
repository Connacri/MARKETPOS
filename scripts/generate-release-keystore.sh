#!/usr/bin/env bash
# ==============================================================================
# Script de génération du Keystore de signature Android Release (APK & AAB)
# Connacri MARKETPOS / POS Module Pro
# ==============================================================================
set -euo pipefail

OUTPUT_DIR="${1:-./credentials}"
KEYSTORE_PATH="${OUTPUT_DIR}/release.keystore"
BASE64_PATH="${OUTPUT_DIR}/keystore_base64.txt"
ALIAS="${KEY_ALIAS:-marketpos}"
PASSWORD="${KEYSTORE_PASSWORD:-SherwoodPos2026SecretKey!}"
CN="${CERT_CN:-Connacri MARKETPOS}"
ORG="${CERT_ORG:-Connacri}"

mkdir -p "${OUTPUT_DIR}"

echo "🍃 Génération du Keystore de production..."
if command -v keytool &> /dev/null; then
  keytool -genkey -v \
    -keystore "${KEYSTORE_PATH}" \
    -alias "${ALIAS}" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "${PASSWORD}" \
    -keypass "${PASSWORD}" \
    -dname "CN=${CN}, OU=POS Division, O=${ORG}, L=Algiers, ST=Algiers, C=DZ"
elif command -v openssl &> /dev/null; then
  TMP_KEY=$(mktemp)
  TMP_CERT=$(mktemp)
  openssl req -x509 -newkey rsa:2048 -keyout "${TMP_KEY}" -out "${TMP_CERT}" -days 10000 -nodes \
    -subj "/CN=${CN}/OU=POS Division/O=${ORG}/L=Algiers/ST=Algiers/C=DZ"
  openssl pkcs12 -export -in "${TMP_CERT}" -inkey "${TMP_KEY}" -out "${KEYSTORE_PATH}" \
    -name "${ALIAS}" -passout pass:"${PASSWORD}"
  rm -f "${TMP_KEY}" "${TMP_CERT}"
else
  echo "Erreur : Ni keytool ni openssl n'est installé." >&2
  exit 1
fi

echo "🔐 Encodage en Base64 pour GitHub Secrets..."
base64 -w 0 "${KEYSTORE_PATH}" > "${BASE64_PATH}"

echo "=============================================================================="
echo "✅ Keystore généré avec succès !"
echo "Fichier Keystore : ${KEYSTORE_PATH}"
echo "Fichier Base64   : ${BASE64_PATH}"
echo "Alias            : ${ALIAS}"
echo "Mot de passe     : ${PASSWORD}"
echo "=============================================================================="
