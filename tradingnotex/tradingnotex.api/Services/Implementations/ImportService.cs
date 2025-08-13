// tradingnotex/tradingnotex.api/Services/Implementations/ImportService.cs
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
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
        private readonly ILogger<ImportService> _logger;

        public ImportService(
            IOptions<MongoDbSettings> settings,
            ILogger<ImportService> logger)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _imports = database.GetCollection<Import>(settings.Value.ImportsCollection);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
            _logger = logger;

            // Índice (não-único) p/ acelerar a dedupe simples
            try
            {
                var idx = new CreateIndexModel<Trade>(
                    Builders<Trade>.IndexKeys
                        .Ascending(t => t.OwnerId)
                        .Ascending(t => t.ExecutedAtUTC)
                        .Ascending(t => t.Instrument)
                        .Ascending(t => t.Side)
                        .Ascending(t => t.TradeStatus)
                        .Ascending(t => t.RealizedPLEUR),
                    new CreateIndexOptions { Name = "ix_dedupe_simple" }
                );
                _trades.Indexes.CreateOne(idx);
            }
            catch (MongoCommandException)
            {
                // ok se já existir
            }
        }

        public async Task<ImportTradesResponse> ImportTradesAsync(ImportTradesRequest request, string userId)
        {
            try
            {
                if (request.Trades == null || !request.Trades.Any())
                    throw new InvalidOperationException("Nenhum trade para importar");

                // Parse opcional de StatementDate
                DateTime? statementDate = null;
                if (!string.IsNullOrWhiteSpace(request.StatementDateISO) &&
                    DateTime.TryParse(request.StatementDateISO, null, DateTimeStyles.AdjustToUniversal, out var stmt))
                {
                    statementDate = stmt;
                }

                // Cria registro de importação
                var import = new Import
                {
                    Name = request.Name ?? $"Import_{DateTime.UtcNow:yyyyMMdd_HHmmss}",
                    StatementDate = statementDate,
                    Source = "manual",
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

                var created = 0;
                var skipped = 0;
                var tradesToInsert = new List<Trade>(request.Trades.Count);

                foreach (var item in request.Trades)
                {
                    // Validação mínima
                    if (string.IsNullOrWhiteSpace(item?.Instrument))
                    {
                        _logger.LogWarning("Trade sem instrumento, pulando.");
                        skipped++;
                        continue;
                    }

                    // Normalizações
                    if (!TryParseUtc(item.ExecutedAtUTC, out var executedAt))
                        executedAt = DateTime.UtcNow;

                    var instr = NormInstr(item.Instrument);
                    var side = NormSide(item.Side);
                    var status = (item.RealizedPLEUR >= 0m) ? "Vencedor" : "Perdedor";
                    var pl2 = Round2(item.RealizedPLEUR);

                    // Janela do minuto para comparar (ignora segundos)
                    var execMinStart = TruncToMinuteUtc(executedAt);
                    var execMinEnd = execMinStart.AddMinutes(1);

                    // DEDUPE: já existe trade idêntico?
                    var dupFilter = Builders<Trade>.Filter.And(
                        Builders<Trade>.Filter.Eq(t => t.OwnerId, userId),
                        Builders<Trade>.Filter.Gte(t => t.ExecutedAtUTC, execMinStart),
                        Builders<Trade>.Filter.Lt(t => t.ExecutedAtUTC, execMinEnd),
                        Builders<Trade>.Filter.Eq(t => t.Instrument, instr),
                        Builders<Trade>.Filter.Eq(t => t.Side, side),
                        Builders<Trade>.Filter.Eq(t => t.TradeStatus, status),
                        // comparação de P/L com arredondamento para 2 casas
                        Builders<Trade>.Filter.Where(t => Round2(t.RealizedPLEUR) == pl2)
                    );

                    var alreadyExists = await _trades.Find(dupFilter).Limit(1).AnyAsync();
                    if (alreadyExists)
                    {
                        _logger.LogInformation(
                            "Trade duplicado ignorado: {Time} {Instr} {Side} PL={PL} Status={Status}",
                            execMinStart, instr, side, pl2.ToString("F2", CultureInfo.InvariantCulture), status
                        );
                        skipped++;
                        continue;
                    }

                    // Mapeia para entidade completa
                    var trade = new Trade
                    {
                        ObjectId = ObjectId.GenerateNewId().ToString(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        ExecutedAtUTC = executedAt,

                        Instrument = instr,
                        Side = side,
                        RealizedPLEUR = item.RealizedPLEUR,
                        DurationMin = item.DurationMin,

                        Setup = string.IsNullOrWhiteSpace(item.Setup) ? "SMC" : item.Setup.Trim(),
                        Emotion = new TradeEmotion { Mood = "neutral", Arousal = "calm" },

                        ImportId = import.ObjectId,
                        OwnerId = userId,
                        ACL = new Dictionary<string, ACLPermission>
                        {
                            { userId, new ACLPermission { Read = true, Write = true } }
                        },

                        OpenPrice = item.OpenPrice,
                        ExecPrice = item.ExecPrice,
                        Spread = item.Spread,
                        OtherFees = item.OtherFees,

                        EntryType = 50,
                        Greed = false,
                        YoutubeLink = null,

                        Comments = new List<Comment>(),
                        DailyGoalReached = item.DailyGoalReached ?? false,
                        DailyLossReached = item.DailyLossReached ?? false,

                        TradeStatus = status,
                        ChartScreenshots = new List<ChartScreenshot>(),

                        Notes = item.Notes,
                        Tags = item.Tags ?? new List<string>()
                    };

                    tradesToInsert.Add(trade);
                    created++;
                }

                if (tradesToInsert.Any())
                    await _trades.InsertManyAsync(tradesToInsert);

                // Atualiza a contagem final criada
                import.Count = created;
                await _imports.ReplaceOneAsync(i => i.ObjectId == import.ObjectId, import);

                _logger.LogInformation("Importação concluída: {Created} trades criados, {Skipped} pulados", created, skipped);

                return new ImportTradesResponse
                {
                    ImportId = import.ObjectId,
                    Created = created,
                    Skipped = skipped
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao importar trades");
                throw;
            }
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
            // Deleta trades relacionados
            var tradesFilter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ImportId, importId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            await _trades.DeleteManyAsync(tradesFilter);

            // Deleta registro de importação
            var importFilter = Builders<Import>.Filter.And(
                Builders<Import>.Filter.Eq(i => i.ObjectId, importId),
                Builders<Import>.Filter.Eq(i => i.OwnerId, userId)
            );
            var result = await _imports.DeleteOneAsync(importFilter);

            return result.DeletedCount > 0;
        }

        // ===================== Helpers =====================

        private static bool TryParseUtc(string value, out DateTime dtUtc)
        {
            dtUtc = default;
            if (string.IsNullOrWhiteSpace(value)) return false;

            if (DateTime.TryParse(value, null, DateTimeStyles.AdjustToUniversal, out var dt))
            {
                if (dt.Kind != DateTimeKind.Utc) dt = dt.ToUniversalTime();
                return (dtUtc = dt) != default;
            }
            return false;
        }

        private static DateTime TruncToMinuteUtc(DateTime dt)
        {
            var utc = dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
            return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);
        }

        private static string NormInstr(string s) => (s ?? "").Trim().ToUpperInvariant();

        private static string NormSide(string side)
        {
            var s = (side ?? "buy").Trim().ToLowerInvariant();
            return (s == "buy" || s == "sell") ? s : "buy";
        }

        private static decimal Round2(decimal v) =>
            Math.Round(v, 2, MidpointRounding.AwayFromZero);
    }
}
