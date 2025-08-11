import pymongo
from datetime import datetime
import sys

# Configuração do MongoDB Atlas
CONNECTION_STRING = "mongodb+srv://admin:O9km3laNa3eQsYeJ@cluster0.fbdwvqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "tradenotex"

try:
    # Conectar ao MongoDB
    client = pymongo.MongoClient(CONNECTION_STRING)
    db = client[DB_NAME]
    
    print("📊 Conectado ao MongoDB Atlas")
    print(f"Banco de dados: {DB_NAME}")
    
    # ================================================
    # 1. CRIAR COLLECTIONS E ÍNDICES
    # ================================================
    
    # Collection: Trades
    if "Trades" not in db.list_collection_names():
        db.create_collection("Trades")
    db.Trades.create_index([("ownerId", 1), ("executedAtUTC", -1)])
    db.Trades.create_index([("ownerId", 1), ("instrument", 1)])
    db.Trades.create_index([("ownerId", 1), ("setup", 1)])
    db.Trades.create_index([("executedAtUTC", -1)])
    db.Trades.create_index([("instrument", 1)])
    print("✅ Collection Trades criada com índices")
    
    # Collection: Imports
    if "Imports" not in db.list_collection_names():
        db.create_collection("Imports")
    db.Imports.create_index([("ownerId", 1), ("createdAt", -1)])
    print("✅ Collection Imports criada com índices")
    
    # Collection: RiskSettings
    if "RiskSettings" not in db.list_collection_names():
        db.create_collection("RiskSettings")
    db.RiskSettings.create_index([("ownerId", 1)])
    print("✅ Collection RiskSettings criada com índices")
    
    # Collection: Users
    if "Users" not in db.list_collection_names():
        db.create_collection("Users")
    db.Users.create_index([("username", 1)], unique=True)
    db.Users.create_index([("sessionToken", 1)])
    print("✅ Collection Users criada com índices")
    
    # ================================================
    # 2. INSERIR DADOS DOS TRADES
    # ================================================
    
    trades_data = [
        {
            "executedAtUTC": datetime(2025, 8, 7, 13, 46, 41),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": 4.84,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 13, 50, 13),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": 0,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 13, 56, 21),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": -1.61,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 14, 5, 20),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": 0,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 14, 24, 58),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": -3.15,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 14, 45, 24),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": 0,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 16, 40, 59),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": 5.41,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 17, 4, 11),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": 0,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 7, 17, 37, 35),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": -2.73,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 8, 10, 2, 6),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": -0.37,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 8, 10, 53, 47),
            "instrument": "TECH100",
            "side": "sell",
            "realizedPLEUR": 0.02,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "executedAtUTC": datetime(2025, 8, 8, 12, 50, 7),
            "instrument": "TECH100",
            "side": "buy",
            "realizedPLEUR": 1.17,
            "durationMin": None,
            "setup": "SMC",
            "emotion": None,
            "notes": "",
            "tags": [],
            "entryType": 50,
            "greed": False,
            "youtubeLink": "",
            "comments": [],
            "dailyGoalReached": False,
            "dailyLossReached": False,
            "ownerId": "demo_user",
            "acl": {"demo_user": {"read": True, "write": True}},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]
    
    # Inserir trades
    result = db.Trades.insert_many(trades_data)
    print(f"✅ Inseridos {len(result.inserted_ids)} trades")
    
    # ================================================
    # 3. INSERIR DADOS DE DEMO PARA OUTRAS COLLECTIONS
    # ================================================
    
    # Criar usuário demo
    demo_user = {
        "username": "demo",
        "email": "demo@tradenotex.com",
        "passwordHash": "$2a$11$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZJ6",  # senha: demo123
        "sessionToken": "demo_session_token_" + str(int(datetime.utcnow().timestamp())),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    db.Users.insert_one(demo_user)
    print("✅ Usuário demo criado (username: demo, senha: demo123)")
    
    # Criar configurações de risco
    risk_settings = {
        "ownerId": "demo_user",
        "goalEUR": 2.0,
        "maxLossEUR": 2.0,
        "acl": {"demo_user": {"read": True, "write": True}},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    db.RiskSettings.insert_one(risk_settings)
    print("✅ Configurações de risco criadas")
    
    # Criar registro de importação
    import_record = {
        "name": "Importação Demo - Trading212",
        "statementDate": datetime(2025, 8, 8),
        "source": "trading212",
        "count": len(trades_data),
        "ownerId": "demo_user",
        "acl": {"demo_user": {"read": True, "write": True}},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    db.Imports.insert_one(import_record)
    print("✅ Registro de importação criado")
    
    # ================================================
    # 4. ADICIONAR COMENTÁRIOS AO PRIMEIRO TRADE
    # ================================================
    
    first_trade = db.Trades.find_one({"executedAtUTC": datetime(2025, 8, 7, 13, 46, 41)})
    if first_trade:
        comments = [
            {
                "id": "comment_1",
                "author": "demo_user",
                "text": "Entrada baseada em rompimento da resistência. Volume estava aumentando.",
                "screenshot": "",
                "createdAt": datetime(2025, 8, 7, 14, 0, 0),
                "aiAnalysis": "Excelente observação! O rompimento de resistência com aumento de volume é um sinal técnico forte. Para melhorar, considere verificar o RSI para confirmar se não está sobrecomprado."
            },
            {
                "id": "comment_2",
                "author": "demo_user",
                "text": "Setup clássico de reversão. Identifiquei divergência no RSI.",
                "screenshot": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSIjMWIyMzMwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzljYTNhZiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSI+W0dyw6ZpY28gZGUgZXhlbXBsb108L3RleHQ+PC9zdmc+",
                "createdAt": datetime(2025, 8, 7, 15, 30, 0),
                "aiAnalysis": "Interessante estratégia! O reconhecimento de padrões está melhorando. Sugiro monitorar também o volume relativo para confirmar a força do movimento."
            }
        ]
        
        db.Trades.update_one(
            {"_id": first_trade["_id"]},
            {"$set": {"comments": comments}}
        )
        print("✅ Comentários adicionados ao primeiro trade")
    
    #
