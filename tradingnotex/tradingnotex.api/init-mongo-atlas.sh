#!/bin/bash
# ================================================
# Script para inicializar o MongoDB Atlas
# ================================================

echo "🌩️ Inicializando MongoDB Atlas..."

# Esperar o container da API iniciar
sleep 10

# Verificar se a API está saudável
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ API está saudável!"
    
    # Criar índices no MongoDB Atlas via API
    echo "📊 Criando índices no MongoDB Atlas..."
    
    # Aqui você pode adicionar comandos para criar índices via API
    # Por exemplo, usando o mongo shell dentro do container da API
    
    docker exec tradingnotex-api mongosh "$MONGODB_ATLAS_CONNECTION" --eval '
    db = db.getSiblingDB("TradingNoteX_Prod");

    // Criar índices para a coleção Trades
    db.Trades.createIndex({ "ownerId": 1, "executedAtUTC": -1 });
    db.Trades.createIndex({ "ownerId": 1, "instrument": 1 });
    db.Trades.createIndex({ "ownerId": 1, "setup": 1 });

    // Criar índices para a coleção Imports
    db.Imports.createIndex({ "ownerId": 1, "createdAt": -1 });

    // Criar índices para a coleção RiskSettings
    db.RiskSettings.createIndex({ "ownerId": 1 });

    // Criar índices para a coleção Users
    db.Users.createIndex({ "username": 1 }, { unique: true });
    db.Users.createIndex({ "sessionToken": 1 });

    print("Índices criados com sucesso!");
    '
    
    echo "✅ Índices criados no MongoDB Atlas!"
else
    echo "❌ API não está saudável. Verifique os logs:"
    docker-compose logs tradingnotex-api | tail -20
fi
