#!/bin/bash
# ================================================
# Script para verificar conexão com MongoDB Atlas
# ================================================

echo "🔍 Verificando conexão com MongoDB Atlas..."

# Testar conexão usando o container da API
if docker-compose ps | grep -q "tradingnotex-api.*Up"; then
    echo "🧪 Testando conexão com MongoDB Atlas..."
    
    # Testar com ping
    if docker exec tradingnotex-api timeout 30 mongosh "$MONGODB_ATLAS_CONNECTION" --eval "db.stats()" >/dev/null 2>&1; then
        echo "✅ Conexão com MongoDB Atlas estabelecida!"
        
        # Mostrar informações do cluster
        echo "📊 Informações do cluster:"
        docker exec tradingnotex-api mongosh "$MONGODB_ATLAS_CONNECTION" --eval '
        db.stats()
        '
    else
        echo "❌ Não foi possível conectar ao MongoDB Atlas"
        echo "🔍 Verifique:"
        echo "   - A string de conexão está correta"
        echo "   - O IP do cluster está na whitelist do MongoDB Atlas"
        echo "   - As credenciais estão corretas"
        echo "   - O firewall não está bloqueando a conexão"
    fi
else
    echo "❌ O container da API não está rodando"
    echo "🚀 Inicie os serviços: docker-compose up -d"
fi
