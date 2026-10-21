#!/usr/bin/env bash
# ==============================================================================
# Génération du Keystore de signature Android Release (APK & AAB)
# Connacri MARKETPOS / POS Module Pro
#
# Usage :
#   export KEY_ALIAS=marketpos
#   export KEYSTORE_PASSWORD="$(openssl rand -base64 32)"
#   export KEY_PASSWORD="$KEYSTORE_PASSWORD"
#   bash scripts/generate-release-keystore.sh ./credentials
#
# Le dossier de sortie est ignoré par Git : ne jamais commiter le keystore.
# ==============================================================================
set -euo pipefail

OUTPUT_DIR="${1:-./credentials}"
KEYSTORE_PATH="${OUTPUT_DIR}/release.keystore"
BASE64_PATH="${OUTPUT_DIR}/keystore.base64"
ALIAS="${KEY_ALIAS:-marketpos}"
PASSWORD="${KEYSTORE_PASSWORD:-}"
KEY_PASS="${KEY_PASSWORD:-$PASSWORD}"
CN="${CERT_CN:-Connacri MARKETPOS}"
ORG="${CERT_ORG:-Connacri}"

if [ -z "$PASSWORD" ]; then
  echo "Erreur : KEYSTORE_PASSWORD est obligatoire (aucun mot de passe par défaut)." >&2
  exit 1
fi

if [ -f "$KEYSTORE_PATH" ]; then
  echo "Erreur : $KEYSTORE_PATH existe déjà. Sauvegardez-le avant d'en générer un nouveau." >&2
  exit 1
fi

umask 077
mkdir -p "${OUTPUT_DIR}"

echo "🍃 Génération du keystore de production..."
keytool -genkeypair -v \
  -keystore "${KEYSTORE_PATH}" \
  -storetype PKCS12 \
  -alias "${ALIAS}" \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storepass "${PASSWORD}" \
  -keypass "${KEY_PASS}" \
  -dname "CN=${CN}, OU=POS Division, O=${ORG}, L=Algiers, ST=Algiers, C=DZ"

echo "🔐 Encodage Base64 pour GitHub Secrets..."
base64 -w 0 "${KEYSTORE_PATH}" > "${BASE64_PATH}"
chmod 600 "${KEYSTORE_PATH}" "${BASE64_PATH}"

echo "=============================================================================="
echo "✅ Keystore généré : ${KEYSTORE_PATH}"
echo "   Base64          : ${BASE64_PATH}"
echo "   Alias           : ${ALIAS}"
echo "   Mot de passe    : défini via KEYSTORE_PASSWORD (non affiché)"
echo ""
echo "Étape suivante :"
echo "   gh secret set ANDROID_KEYSTORE_BASE64 < ${BASE64_PATH}"
echo "   gh secret set KEYSTORE_PASSWORD"
echo "   gh secret set KEY_ALIAS"
echo "   gh secret set KEY_PASSWORD"
echo "=============================================================================="
