#!/bin/bash
# Script de deploy do TradingNoteX Backend

echo "🚀 Iniciando deploy do TradingNoteX Backend..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir imagem
echo "🔨 Construindo imagem Docker..."
docker-compose build --no-cache

# Iniciar serviços
echo "🏃 Iniciando serviços..."
docker-compose up -d

# Verificar status
echo "📊 Verificando status dos serviços..."
docker-compose ps

# Esperar MongoDB iniciar
echo "⏳ Aguardando MongoDB iniciar..."
sleep 10

# Verificar conexão com MongoDB
echo "🔍 Testando conexão com MongoDB..."
docker exec tradingnotex-mongo mongosh --eval "db.stats()"

# Verificar logs da API
echo "📋 Verificando logs da API..."
docker-compose logs --tail=20 tradingnotex-api

echo "✅ Deploy concluído!"
echo ""
echo "🌐 URLs de acesso:"
echo "   - API: http://localhost:8080"
echo "   - Swagger: http://localhost:8080/swagger"
echo "   - Mongo Express: http://localhost:8081"
echo "   - Health Check: http://localhost:8080/health"
echo ""
echo "🔑 Credenciais:"
echo "   - Mongo Express: admin/admin123"
echo "   - MongoDB: tradingnotex_user/app_password123"
