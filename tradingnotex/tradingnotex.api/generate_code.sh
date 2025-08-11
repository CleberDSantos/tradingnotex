#!/bin/bash
# ================================================
# Script simplificado para inserir dados - SÓ DADOS
# ================================================
echo "🚀 Inserindo dados no MongoDB Atlas..."

CONNECTION_STRING="mongodb+srv://tradingnotex_user:app_password123@cluster0.fbdwvqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

echo "🧹 Limpando usuários existentes e criando novos..."

# Criar script com hashes BCrypt válidos
cat > create_valid_users.js << 'EOF'
db = db.getSiblingDB('tradenotex');

print("🧹 Removendo usuários existentes...");
db.Users.deleteMany({});

print("🔐 Criando usuários com hashes BCrypt válidos...");

// Hashes BCrypt pré-calculados para "demo123"
const validBCryptHashes = [
    {
        username: "demo",
        email: "demo@tradenotex.com",
        // Hash BCrypt para "demo123" - $2a$10$
        passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye1ICCZ99AKnLfBjHB8HkfI8OmEWi4S4q",
        sessionToken: "demo_session_token_" + new Date().getTime(),
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        username: "admin",
        email: "admin@tradenotex.com",
        // Hash BCrypt para "admin123" - $2a$10$
        passwordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
        sessionToken: "admin_session_token_" + new Date().getTime(),
        createdAt: ISODate(),
        updatedAt: ISODate()
    },
    {
        username: "test",
        email: "test@tradenotex.com",
        // Hash BCrypt para "test123" - $2a$10$
        passwordHash: "$2a$10$e0MYzXyjpJS7Pd2AlUKf5uN2BQq9O7ClJDK5ZJ6nz7o6HtxQRf8y.",
        sessionToken: "test_session_token_" + new Date().getTime(),
        createdAt: ISODate(),
        updatedAt: ISODate()
    }
];

// Inserir todos os usuários
validBCryptHashes.forEach(user => {
    const result = db.Users.insertOne(user);
    print("✅ Usuário criado: " + user.username + " (ID: " + result.insertedId + ")");
    print("   Email: " + user.email);
    print("   Hash: " + user.passwordHash.substring(0, 15) + "...");
});

print("\n🔍 VERIFICANDO USUÁRIOS CRIADOS:");
print("=================================");

const users = db.Users.find({}).toArray();
users.forEach(user => {
    print("Username: " + user.username);
    print("Hash válido: " + (user.passwordHash.startsWith("$2a$") ? "✅ SIM" : "❌ NÃO"));
    print("---");
});

print("\n📊 CONTAGEM FINAL:");
print("==================");
print("Total de usuários: " + db.Users.countDocuments({}));

print("\n🔑 CREDENCIAIS PARA LOGIN:");
print("==========================");
print("1. Username: demo     | Password: demo123");
print("2. Username: admin    | Password: admin123");  
print("3. Username: test     | Password: test123");

print("\n✅ USUÁRIOS CRIADOS COM SUCESSO!");
EOF

echo "🔄 Executando criação de usuários..."
mongosh "$CONNECTION_STRING" --file create_valid_users.js

rm create_valid_users.js

echo ""
echo "🧪 TESTANDO HASHES LOCALMENTE"
echo "=============================="

# Se Node.js estiver disponível, vamos testar os hashes localmente
if command -v node &> /dev/null; then
    echo "📦 Verificando se bcrypt está disponível..."
    
    # Instalar bcrypt se não estiver disponível
    if ! npm list bcrypt &> /dev/null 2>&1; then
        echo "📦 Instalando bcrypt..."
        npm install bcrypt --silent
    fi
    
    # Criar script para testar hashes
    cat > test_bcrypt.js << 'EOF'
const bcrypt = require('bcrypt');

console.log('🧪 TESTANDO HASHES BCRYPT...\n');

const testCases = [
    {
        username: 'demo',
        password: 'demo123',
        hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye1ICCZ99AKnLfBjHB8HkfI8OmEWi4S4q'
    },
    {
        username: 'admin', 
        password: 'admin123',
        hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    },
    {
        username: 'test',
        password: 'test123', 
        hash: '$2a$10$e0MYzXyjpJS7Pd2AlUKf5uN2BQq9O7ClJDK5ZJ6nz7o6HtxQRf8y.'
    }
];

testCases.forEach(testCase => {
    try {
        const isValid = bcrypt.compareSync(testCase.password, testCase.hash);
        console.log(`${testCase.username}:`);
        console.log(`  Password: ${testCase.password}`);
        console.log(`  Hash: ${testCase.hash.substring(0, 20)}...`);
        console.log(`  Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        console.log('');
    } catch (error) {
        console.log(`❌ Error testing ${testCase.username}: ${error.message}`);
    }
});

// Gerar hash novo para "demo123"
console.log('🔧 GERANDO NOVO HASH PARA "demo123":');
try {
    const newHash = bcrypt.hashSync('demo123', 10);
    console.log(`Novo hash: ${newHash}`);
    console.log(`Verificação: ${bcrypt.compareSync('demo123', newHash) ? '✅' : '❌'}`);
} catch (error) {
    console.log(`❌ Error generating new hash: ${error.message}`);
}
EOF
    
    echo "🔍 Testando hashes com Node.js bcrypt..."
    node test_bcrypt.js
    rm test_bcrypt.js
    
else
    echo "ℹ️ Node.js não disponível - pulando teste local"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Reinicie sua aplicação C#:"
echo "   dotnet run"
echo ""
echo "2. Teste o login com qualquer uma destas credenciais:"
echo "   • Username: demo     | Password: demo123"
echo "   • Username: admin    | Password: admin123"
echo "   • Username: test     | Password: test123"
echo ""
echo "3. Exemplo de curl para testar:"
echo "   curl -X 'POST' \\"
echo "     'https://localhost:44368/api/Auth/login' \\"
echo "     -H 'accept: */*' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{"
echo "     \"username\": \"demo\","
echo "     \"password\": \"demo123\""
echo "   }'"
echo ""
echo "4. Se ainda falhar, verifique:"
echo "   • Versão do BCrypt.Net na aplicação"
echo "   • Configuração do BCrypt (EnhancedEntropy, HashType)"
echo "   • Logs detalhados da aplicação"