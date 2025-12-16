#!/bin/bash

echo "Correction des chemins dans les fichiers CSS..."

# Pour caisse.css
echo "=== Correction de caisse.css ==="
sed -i "s|/home/synaptics/Essais/client/src/components/images/logo_csr.png|./components/images/logo_csr.png|g" src/caisse.css
sed -i "s|url(/home/.*logo_csr.*png)|url(./components/images/logo_csr.png)|g" src/caisse.css

# Pour index.css
echo "=== Correction de index.css ==="
sed -i "s|/home/synaptics/Essais/client/src/components/images/logo_csr.png|./components/images/logo_csr.png|g" src/index.css
sed -i "s|url(/home/.*logo_csr.*png)|url(./components/images/logo_csr.png)|g" src/index.css

# Pour caisse_old.css
echo "=== Correction de caisse_old.css ==="
if [ -f "src/components/caisse_old.css" ]; then
  sed -i "s|/home/synaptics/Essais/client/src/components/images/logo_csr.png|./images/logo_csr.png|g" src/components/caisse_old.css
fi

echo "=== Vérification des chemins corrigés ==="
grep -n "logo_csr" src/caisse.css src/index.css src/components/caisse_old.css 2>/dev/null || true
