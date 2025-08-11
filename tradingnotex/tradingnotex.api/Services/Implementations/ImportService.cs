using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class ImportService : IImportService
    {
        private readonly IMongoCollection<Import> _imports;
        private readonly IMongoCollection<Trade> _trades;
        
        public ImportService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _imports = database.GetCollection<Import>(settings.Value.ImportsCollection);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
        }
        
        public async Task<ImportTradesResponse> ImportTradesAsync(ImportTradesRequest request, string userId)
        {
            var import = new Import
            {
                Name = request.Name,
                StatementDate = !string.IsNullOrEmpty(request.StatementDateISO) 
                    ? DateTime.Parse(request.StatementDateISO) 
                    : null,
                Source = "t212",
                Count = request.Trades.Count,
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                }
            };
            
            await _imports.InsertOneAsync(import);
            
            var tradesToInsert = new List<Trade>();
            foreach (var tradeItem in request.Trades)
            {
                var trade = new Trade
                {
                    ExecutedAtUTC = DateTime.Parse(tradeItem.ExecutedAtUTC),
                    Instrument = tradeItem.Instrument,
                    Side = tradeItem.Side.ToLower(),
                    RealizedPLEUR = tradeItem.RealizedPLEUR,
                    DurationMin = tradeItem.DurationMin,
                    Setup = "SMC",
                    ImportId = import.ObjectId,
                    OwnerId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ACL = new Dictionary<string, ACLPermission>
                    {
                        { userId, new ACLPermission { Read = true, Write = true } }
                    }
                };
                
                tradesToInsert.Add(trade);
            }
            
            if (tradesToInsert.Any())
            {
                await _trades.InsertManyAsync(tradesToInsert);
            }
            
            return new ImportTradesResponse
            {
                ImportId = import.ObjectId,
                Created = tradesToInsert.Count,
                Skipped = 0
            };
        }
        
        public async Task<List<Import>> GetImportsAsync(string userId)
        {
            var filter = Builders<Import>.Filter.Eq(i => i.OwnerId, userId);
            var sort = Builders<Import>.Sort.Descending(i => i.CreatedAt);
            
            return await _imports.Find(filter).Sort(sort).ToListAsync();
        }
        
        public async Task<Import> GetImportByIdAsync(string importId, string userId)
        {
            var filter = Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            );
            
            return await _imports.Find(filter).FirstOrDefaultAsync();
        }
        
        public async Task<bool> DeleteImportAsync(string importId, string userId)
        {
            var filter = Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            );
            
            var result = await _imports.DeleteOneAsync(filter);
            
            if (result.DeletedCount > 0)
            {
                var tradeFilter = Builders<Trade>.Filter.And(
                    Builders<Trade>.Filter.Eq(t => t.ImportId, importId),
                    Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
                );
                
                await _trades.DeleteManyAsync(tradeFilter);
            }
            
            return result.DeletedCount > 0;
        }
    }
}
