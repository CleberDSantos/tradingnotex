using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class RiskSettingsService : IRiskSettingsService
    {
        private readonly IMongoCollection<RiskSettings> _riskSettings;
        
        public RiskSettingsService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _riskSettings = database.GetCollection<RiskSettings>(settings.Value.RiskSettingsCollection);
        }
        
        public async Task<RiskSettings> GetRiskSettingsAsync(string userId)
        {
            var filter = Builders<RiskSettings>.Filter.Eq(r => r.OwnerId, userId);
            return await _riskSettings.Find(filter).FirstOrDefaultAsync() ?? new RiskSettings { OwnerId = userId };
        }
        
        public async Task<RiskSettings> SaveRiskSettingsAsync(RiskSettings settings, string userId)
        {
            settings.OwnerId = userId;
            settings.CreatedAt = DateTime.UtcNow;
            settings.UpdatedAt = DateTime.UtcNow;
            
            settings.ACL = new Dictionary<string, ACLPermission>
            {
                { userId, new ACLPermission { Read = true, Write = true } }
            };
            
            await _riskSettings.InsertOneAsync(settings);
            return settings;
        }
        
        public async Task<RiskSettings> UpdateRiskSettingsAsync(string settingsId, RiskSettings settings, string userId)
        {
            var filter = Builders<RiskSettings>.Filter.And(
                Builders<RiskSettings>.Filter.Eq(r => r.ObjectId, settingsId),
                Builders<RiskSettings>.Filter.Eq(r => r.OwnerId, userId)
            );
            
            settings.ObjectId = settingsId;
            settings.OwnerId = userId;
            settings.UpdatedAt = DateTime.UtcNow;
            
            await _riskSettings.ReplaceOneAsync(filter, settings);
            return settings;
        }
    }
}
