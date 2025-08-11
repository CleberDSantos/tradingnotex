// Criar usuário de aplicação
db.createUser({
    user: "tradingnotex_user",
    pwd: "app_password123",
    roles: [
        {
            role: "readWrite",
            db: "tradenotex"
        }
    ]
});

// Mudar para o banco de dados tradenotex
db = db.getSiblingDB('tradenotex');

// Criar coleções e índices
db.createCollection("Trades");
db.Trades.createIndex({ "ownerId": 1, "executedAtUTC": -1 });
db.Trades.createIndex({ "ownerId": 1, "instrument": 1 });
db.Trades.createIndex({ "ownerId": 1, "setup": 1 });
db.Trades.createIndex({ "executedAtUTC": -1 });
db.Trades.createIndex({ "instrument": 1 });

db.createCollection("Imports");
db.Imports.createIndex({ "ownerId": 1, "createdAt": -1 });

db.createCollection("RiskSettings");
db.RiskSettings.createIndex({ "ownerId": 1 });

db.createCollection("Users");
db.Users.createIndex({ "username": 1 }, { unique: true });
db.Users.createIndex({ "sessionToken": 1 });

// Inserir dados dos trades
const tradesData = [
    {
        executedAtUTC: ISODate("2025-08-07T13:46:41Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: 4.84,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T13:50:13Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: 0,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T13:56:21Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: -1.61,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T14:05:20Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: 0,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T14:24:58Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: -3.15,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T14:45:24Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: 0,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T16:40:59Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: 5.41,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T17:04:11Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: 0,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-07T17:37:35Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: -2.73,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-08T10:02:06Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: -0.37,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-08T10:53:47Z"),
        instrument: "TECH100",
        side: "sell",
        realizedPLEUR: 0.02,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        executedAtUTC: ISODate("2025-08-08T12:50:07Z"),
        instrument: "TECH100",
        side: "buy",
        realizedPLEUR: 1.17,
        durationMin: null,
        setup: "SMC",
        emotion: null,
        notes: "",
        tags: [],
        entryType: 50,
        greed: false,
        youtubeLink: "",
        comments: [],
        dailyGoalReached: false,
        dailyLossReached: false,
        ownerId: "demo_user",
        acl: { "demo_user": { read: true, write: true } },
        createdAt: ISODate(),
        updatedAt: ISODate()
    }
];

db.Trades.insertMany(tradesData);

// Criar usuário demo
const demoUser = {
    username: "demo",
    email: "demo@tradenotex.com",
    passwordHash: "$2a$11$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZJ6", // senha: demo123
    sessionToken: "demo_session_token_" + new Date().getTime(),
    createdAt: ISODate(),
    updatedAt: ISODate()
};
db.Users.insertOne(demoUser);

// Criar configurações de risco
const riskSettings = {
    ownerId: "demo_user",
    goalEUR: 2.0,
    maxLossEUR: 2.0,
    acl: { "demo_user": { read: true, write: true } },
    createdAt: ISODate(),
    updatedAt: ISODate()
};
db.RiskSettings.insertOne(riskSettings);

// Criar registro de importação
const importRecord = {
    name: "Importação Demo - Trading212",
    statementDate: ISODate("2025-08-08"),
    source: "trading212",
    count: tradesData.length,
    ownerId: "demo_user",
    acl: { "demo_user": { read: true, write: true } },
    createdAt: ISODate(),
    updatedAt: ISODate()
};
db.Imports.insertOne(importRecord);

// Adicionar comentários ao primeiro trade
const firstTrade = db.Trades.findOne({
    executedAtUTC: ISODate("2025-08-07T13:46:41Z")
});

if (firstTrade) {
    const comments = [
        {
            id: "comment_1",
            author: "demo_user",
            text: "Entrada baseada em rompimento da resistência. Volume estava aumentando.",
            screenshot: "",
            createdAt: ISODate("2025-08-07T14:00:00Z"),
            aiAnalysis: "Excelente observação! O rompimento de resistência com aumento de volume é um sinal técnico forte. Para melhorar, considere verificar o RSI para confirmar se não está sobrecomprado."
        },
        {
            id: "comment_2",
            author: "demo_user",
            text: "Setup clássico de reversão. Identifiquei divergência no RSI.",
            screenshot: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSIjMWIyMzMwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzljYTNhZiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSI+W0dyw6ZpY28gZGUgZXhlbXBsb108L3RleHQ+PC9zdmc+",
            createdAt: ISODate("2025-08-07T15:30:00Z"),
            aiAnalysis: "Interessante estratégia! O reconhecimento de padrões está melhorando. Sugiro monitorar também o volume relativo para confirmar a força do movimento."
        }
    ];

    db.Trades.updateOne(
        { _id: firstTrade._id },
        { $set: { comments: comments } }
    );
}

print("MongoDB inicializado com sucesso!");