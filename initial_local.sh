#!/bin/sh
docker compose up -d --build
echo "Containers ativos!"
echo "Atualizando arquivos..."
sleep 4
cp -f ./web/custom/interface_config.js ./web/interface_config.js
echo "Arquivo interface_config.js atualizado com sucesso!"
# Substitui o config.js padrão pelo custom
cp -f ./web/custom/config.js ./web/config.js
echo "Arquivo config.js atualizado com sucesso!"