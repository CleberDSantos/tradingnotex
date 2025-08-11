using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;

namespace TradingNoteX.Configuration
{
    public class MongoDbIndexConfiguration
    {
        private readonly IMongoDatabase _database;
        private readonly MongoDbSettings _settings;
        
        public MongoDbIndexConfiguration(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            _database = client.GetDatabase(settings.Value.DatabaseName);
            _settings = settings.Value;
        }
        
        public async Task CreateIndexesAsync()
        {
            var tradesCollection = _database.GetCollection<Trade>(_settings.TradesCollection);
            var importsCollection = _database.GetCollection<Import>(_settings.ImportsCollection);
            var riskSettingsCollection = _database.GetCollection<RiskSettings>(_settings.RiskSettingsCollection);
            var usersCollection = _database.GetCollection<User>(_settings.UsersCollection);
            
            // Trades indexes
            var tradesIndexKeys = Builders<Trade>.IndexKeys
                .Ascending(t => t.OwnerId)
                .Descending(t => t.ExecutedAtUTC);
            
            await tradesCollection.Indexes.CreateOneAsync(
                new CreateIndexModel<Trade>(tradesIndexKeys));
            
            // Imports indexes
            var importsIndexKeys = Builders<Import>.IndexKeys
                .Ascending(i => i.OwnerId)
                .Descending(i => i.CreatedAt);
            
            await importsCollection.Indexes.CreateOneAsync(
                new CreateIndexModel<Import>(importsIndexKeys));
            
            // RiskSettings indexes
            var riskSettingsIndexKeys = Builders<RiskSettings>.IndexKeys
                .Ascending(r => r.OwnerId);
            
            await riskSettingsCollection.Indexes.CreateOneAsync(
                new CreateIndexModel<RiskSettings>(riskSettingsIndexKeys));
            
            // Users indexes
            var usersIndexKeys = Builders<User>.IndexKeys
                .Ascending(u => u.Username)
                .Ascending(u => u.SessionToken);
            
            await usersCollection.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(usersIndexKeys));
        }
    }
}
