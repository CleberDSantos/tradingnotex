using Microsoft.Extensions.Options;
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
        private readonly IMongoCollection<Import> _imports;
        private readonly IMongoCollection<Trade> _trades;
        private readonly IAccountService _accountService;

        public ImportService(IOptions<MongoDbSettings> settings, IAccountService accountService)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _imports = database.GetCollection<Import>(settings.Value.ImportsCollection);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
            _accountService = accountService;
        }

        public async Task<ImportTradesResponse> ImportTradesAsync(ImportTradesRequest request, string userId)
        {
            if (request?.Trades == null || !request.Trades.Any())
            {
                throw new ArgumentException("Nenhum trade para importar");
            }

            // Validar conta se especificada
            if (!string.IsNullOrEmpty(request.AccountId))
            {
                var accountExists = await _accountService.AccountExistsAsync(request.AccountId, userId);
                if (!accountExists)
                {
                    throw new InvalidOperationException($"Conta com ID '{request.AccountId}' não encontrada");
                }
            }

            // Criar registro de import
            var import = new Import
            {
                Name = request.Name ?? $"Import {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                StatementDate = request.StatementDateISO?.Date ?? DateTime.UtcNow.Date,
                Source = "api-import",
                Count = request.Trades.Count,
                OwnerId = userId,
                AccountId = request.AccountId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                }
            };

            await _imports.InsertOneAsync(import);

            int created = 0;
            int skipped = 0;

            foreach (var tradeImport in request.Trades)
            {
                try
                {
                    // Verificar duplicação
                    var exists = await TradeExistsAsync(tradeImport, userId, request.AccountId);
                    if (exists)
                    {
                        skipped++;
                        continue;
                    }

                    // Criar trade
                    var trade = new Trade
                    {
                        ExecutedAtUTC = tradeImport.ExecutedAtUTC,
                        Instrument = tradeImport.Instrument?.Trim().ToUpperInvariant() ?? "UNKNOWN",
                        Side = tradeImport.Side?.Trim().ToLowerInvariant() ?? "buy",
                        RealizedPLEUR = tradeImport.RealizedPLEUR,
                        DurationMin = tradeImport.DurationMin,
                        Setup = tradeImport.Setup ?? "SMC",
                        Notes = tradeImport.Notes ?? "",
                        Tags = tradeImport.Tags ?? new List<string>(),
                        YoutubeLink = tradeImport.YoutubeLink ?? "",
                        DailyGoalReached = tradeImport.DailyGoalReached ?? false,
                        DailyLossReached = tradeImport.DailyLossReached ?? false,
                        Greed = tradeImport.Greed ?? false,
                        OpenPrice = tradeImport.OpenPrice,
                        ExecPrice = tradeImport.ExecPrice,
                        StopPrice = tradeImport.StopPrice,
                        TargetPrice = tradeImport.TargetPrice,
                        Spread = tradeImport.Spread,
                        OtherFees = tradeImport.OtherFees,
                        EntryType = tradeImport.EntryType ?? 50,
                        ImportId = import.ObjectId,
                        OwnerId = userId,
                        AccountId = request.AccountId,
                        TradeStatus = tradeImport.RealizedPLEUR >= 0 ? "winner" : "loser",
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

                    await _trades.InsertOneAsync(trade);
                    created++;
                }
                catch (Exception ex)
                {
                    // Log do erro mas continua o import
                    Console.WriteLine($"Erro ao importar trade: {ex.Message}");
                    skipped++;
                }
            }

            // Atualizar contador no import
            await _imports.UpdateOneAsync(
                Builders<Import>.Filter.Eq(i => i.ObjectId, import.ObjectId),
                Builders<Import>.Update.Set(i => i.Count, created)
            );

            return new ImportTradesResponse
            {
                ImportId = import.ObjectId,
                Created = created,
                Skipped = skipped
            };
        }

        public async Task<List<Import>> GetImportsAsync(string userId)
        {
            return await _imports.Find(Builders<Import>.Filter.Eq(i => i.OwnerId, userId))
                .Sort(Builders<Import>.Sort.Descending(i => i.CreatedAt))
                .ToListAsync();
        }

        public async Task<Import> GetImportByIdAsync(string importId, string userId)
        {
            return await _imports.Find(Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            )).FirstOrDefaultAsync();
        }

        public async Task<bool> DeleteImportAsync(string importId, string userId)
        {
            // Primeiro, deletar todos os trades associados
            await _trades.DeleteManyAsync(Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ImportId, importId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            ));

            // Depois, deletar o import
            var result = await _imports.DeleteOneAsync(Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            ));

            return result.DeletedCount > 0;
        }

        private async Task<bool> TradeExistsAsync(TradeImportItem tradeImport, string userId, string? accountId)
        {
            var execMinStart = new DateTime(tradeImport.ExecutedAtUTC.Year, tradeImport.ExecutedAtUTC.Month,
                tradeImport.ExecutedAtUTC.Day, tradeImport.ExecutedAtUTC.Hour, tradeImport.ExecutedAtUTC.Minute, 0, DateTimeKind.Utc);
            var execMinEnd = execMinStart.AddMinutes(1);

            var pl2 = Math.Round(tradeImport.RealizedPLEUR, 2, MidpointRounding.AwayFromZero);
            var eps = 0.005m;
            var plLow = pl2 - eps;
            var plHigh = pl2 + eps;

            var filterBuilder = Builders<Trade>.Filter;
            var filters = new List<FilterDefinition<Trade>>
            {
                filterBuilder.Eq(t => t.OwnerId, userId),
                filterBuilder.Gte(t => t.ExecutedAtUTC, execMinStart),
                filterBuilder.Lt(t => t.ExecutedAtUTC, execMinEnd),
                filterBuilder.Eq(t => t.Instrument, tradeImport.Instrument?.Trim().ToUpperInvariant() ?? "UNKNOWN"),
                filterBuilder.Eq(t => t.Side, tradeImport.Side?.Trim().ToLowerInvariant() ?? "buy"),
                filterBuilder.Gte(t => t.RealizedPLEUR, plLow),
                filterBuilder.Lt(t => t.RealizedPLEUR, plHigh)
            };

            if (!string.IsNullOrEmpty(accountId))
            {
                filters.Add(filterBuilder.Eq(t => t.AccountId, accountId));
            }

            var filter = filterBuilder.And(filters);
            return await _trades.Find(filter).AnyAsync();
        }
    }
}