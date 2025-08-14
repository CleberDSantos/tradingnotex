using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class ImportService : IImportService
    {
        private readonly IMongoCollection<Trade> _trades;
        private readonly IMongoCollection<Import> _imports;
        private readonly IAccountService _accountService;
        private readonly ILogger<ImportService> _logger;

        public ImportService(
            IOptions<MongoDbSettings> settings,
            IAccountService accountService,
            ILogger<ImportService> logger)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
            _imports = database.GetCollection<Import>(settings.Value.ImportsCollection);
            _accountService = accountService;
            _logger = logger;
        }

        public async Task<ImportTradesResponse> ImportTradesAsync(ImportTradesRequest request, string userId)
        {
            // Validar se a conta existe e pertence ao usuário (se especificada)
            if (!string.IsNullOrEmpty(request.AccountId))
            {
                var accountExists = await _accountService.AccountExistsAsync(request.AccountId, userId);
                if (!accountExists)
                {
                    throw new InvalidOperationException($"Conta com ID '{request.AccountId}' não encontrada ou não pertence ao usuário");
                }
            }

            // Criar registro de importação
            var import = new Import
            {
                Name = request.Name ?? $"Import {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                StatementDate = request.StatementDateISO,
                Source = "api",
                Count = request.Trades?.Count ?? 0,
                OwnerId = userId,
                AccountId = request.AccountId, // Associar com conta
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                }
            };

            await _imports.InsertOneAsync(import);

            var created = 0;
            var skipped = 0;

            if (request.Trades != null && request.Trades.Any())
            {
                foreach (var tradeData in request.Trades)
                {
                    // Verificar duplicação
                    var isDuplicate = await IsDuplicateTradeAsync(
                        tradeData.ExecutedAtUTC,
                        tradeData.Instrument,
                        tradeData.Side,
                        tradeData.RealizedPLEUR,
                        userId,
                        request.AccountId
                    );

                    if (isDuplicate)
                    {
                        skipped++;
                        _logger.LogInformation($"Trade duplicado ignorado: {tradeData.ExecutedAtUTC} {tradeData.Instrument}");
                        continue;
                    }

                    // Criar novo trade
                    var trade = new Trade
                    {
                        ExecutedAtUTC = tradeData.ExecutedAtUTC,
                        Instrument = tradeData.Instrument,
                        Side = tradeData.Side,
                        RealizedPLEUR = tradeData.RealizedPLEUR,
                        DurationMin = tradeData.DurationMin,
                        Setup = string.IsNullOrEmpty(tradeData.Setup) ? "SMC" : tradeData.Setup,
                        Notes = tradeData.Notes ?? "",
                        Tags = tradeData.Tags ?? new List<string>(),
                        ImportId = import.ObjectId,
                        OwnerId = userId,
                        AccountId = request.AccountId, // Associar com conta
                        YoutubeLink = tradeData.YoutubeLink ?? "",
                        DailyGoalReached = tradeData.DailyGoalReached ?? false,
                        DailyLossReached = tradeData.DailyLossReached ?? false,
                        Greed = tradeData.Greed ?? false,
                        OpenPrice = tradeData.OpenPrice,
                        ExecPrice = tradeData.ExecPrice,
                        StopPrice = tradeData.StopPrice,
                        TargetPrice = tradeData.TargetPrice,
                        Spread = tradeData.Spread,
                        OtherFees = tradeData.OtherFees,
                        EntryType = tradeData.EntryType ?? 50,
                        Emotion = new TradeEmotion { Mood = "neutral", Arousal = "calm" },
                        Comments = new List<Comment>(),
                        ChartScreenshots = new List<ChartScreenshot>(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        ACL = new Dictionary<string, ACLPermission>
                        {
                            { userId, new ACLPermission { Read = true, Write = true } }
                        }
                    };

                    // Determinar status do trade
                    if (string.IsNullOrEmpty(trade.TradeStatus))
                    {
                        trade.TradeStatus = trade.RealizedPLEUR >= 0 ? "winner" : "loser";
                    }

                    await _trades.InsertOneAsync(trade);
                    created++;
                }
            }

            // Atualizar contagem no registro de importação
            await _imports.UpdateOneAsync(
                Builders<Import>.Filter.Eq(i => i.ObjectId, import.ObjectId),
                Builders<Import>.Update
                    .Set(i => i.Count, created)
                    .Set(i => i.UpdatedAt, DateTime.UtcNow)
            );

            return new ImportTradesResponse
            {
                ImportId = import.ObjectId,
                Created = created,
                Skipped = skipped
            };
        }

        private async Task<bool> IsDuplicateTradeAsync(
            DateTime executedAt,
            string instrument,
            string side,
            decimal realizedPL,
            string userId,
            string accountId)
        {
            // Verificar trades no mesmo minuto, mesmo instrumento, side, P/L e conta
            var startMinute = new DateTime(
                executedAt.Year,
                executedAt.Month,
                executedAt.Day,
                executedAt.Hour,
                executedAt.Minute,
                0,
                DateTimeKind.Utc
            );
            var endMinute = startMinute.AddMinutes(1);

            var filterBuilder = Builders<Trade>.Filter;
            var filters = new List<FilterDefinition<Trade>>
            {
                filterBuilder.Eq(t => t.OwnerId, userId),
                filterBuilder.Gte(t => t.ExecutedAtUTC, startMinute),
                filterBuilder.Lt(t => t.ExecutedAtUTC, endMinute),
                filterBuilder.Eq(t => t.Instrument, instrument),
                filterBuilder.Eq(t => t.Side, side)
            };

            // Adicionar filtro de conta se especificada
            if (!string.IsNullOrEmpty(accountId))
            {
                filters.Add(filterBuilder.Eq(t => t.AccountId, accountId));
            }

            // Verificar P/L com tolerância
            var plTolerance = 0.01m;
            filters.Add(filterBuilder.Gte(t => t.RealizedPLEUR, realizedPL - plTolerance));
            filters.Add(filterBuilder.Lte(t => t.RealizedPLEUR, realizedPL + plTolerance));

            var filter = filterBuilder.And(filters);
            var count = await _trades.CountDocumentsAsync(filter);

            return count > 0;
        }

        public async Task<List<Import>> GetImportsAsync(string userId)
        {
            var filter = Builders<Import>.Filter.Eq(i => i.OwnerId, userId);
            return await _imports.Find(filter)
                .Sort(Builders<Import>.Sort.Descending(i => i.CreatedAt))
                .ToListAsync();
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
            // Primeiro, deletar todos os trades associados
            var tradesFilter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ImportId, importId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );

            await _trades.DeleteManyAsync(tradesFilter);

            // Depois, deletar o registro de importação
            var importFilter = Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            );

            var result = await _imports.DeleteOneAsync(importFilter);
            return result.DeletedCount > 0;
        }

       
    }

   
}