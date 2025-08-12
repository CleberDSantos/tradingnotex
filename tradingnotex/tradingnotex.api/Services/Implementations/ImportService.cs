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
                    Setup = !string.IsNullOrEmpty(tradeItem.Setup) ? tradeItem.Setup : "SMC",
                    Notes = tradeItem.Notes ?? "",
                    Tags = tradeItem.Tags ?? new List<string>(),
                    ImportId = import.ObjectId,
                    OwnerId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ACL = new Dictionary<string, ACLPermission>
                    {
                        { userId, new ACLPermission { Read = true, Write = true } }
                    },

                    // Novos campos opcionais
                    OpenPrice = tradeItem.OpenPrice,
                    ExecPrice = tradeItem.ExecPrice,
                    Spread = tradeItem.Spread,
                    OtherFees = tradeItem.OtherFees,
                    DailyGoalReached = tradeItem.DailyGoalReached ?? false,
                    DailyLossReached = tradeItem.DailyLossReached ?? false,

                    // Campos com valores padrão
                    EntryType = 50, // Balanceado por padrão
                    Greed = false,
                    YoutubeLink = "",
                    Comments = new List<Comment>(),

                    // Calcular status inicial
                    TradeStatus = CalculateInitialStatus(tradeItem.RealizedPLEUR, tradeItem.ExecPrice, null)
                };

                // Se temos ExecPrice mas não OpenPrice, usar execPrice como base
                if (trade.ExecPrice.HasValue && !trade.OpenPrice.HasValue)
                {
                    // Estimar OpenPrice baseado no lado do trade
                    if (trade.Side == "buy")
                    {
                        trade.OpenPrice = trade.ExecPrice.Value * 0.9995m; // 0.05% abaixo
                    }
                    else
                    {
                        trade.OpenPrice = trade.ExecPrice.Value * 1.0005m; // 0.05% acima
                    }
                }

                // Calcular spread se temos ambos os preços
                if (trade.OpenPrice.HasValue && trade.ExecPrice.HasValue)
                {
                    trade.Spread = Math.Abs(trade.ExecPrice.Value - trade.OpenPrice.Value);
                }

                // Estimar stop e target baseado em P/L se não fornecidos
                if (trade.ExecPrice.HasValue && trade.RealizedPLEUR != 0)
                {
                    var pointValue = 2m; // €2 por ponto para MNQ
                    var points = Math.Abs(trade.RealizedPLEUR / pointValue);

                    if (trade.Side == "buy")
                    {
                        if (trade.RealizedPLEUR > 0)
                        {
                            trade.TargetPrice = trade.ExecPrice.Value + points;
                            trade.StopPrice = trade.ExecPrice.Value - (points * 0.5m);
                        }
                        else
                        {
                            trade.StopPrice = trade.ExecPrice.Value - points;
                            trade.TargetPrice = trade.ExecPrice.Value + (points * 2m);
                        }
                    }
                    else // sell
                    {
                        if (trade.RealizedPLEUR > 0)
                        {
                            trade.TargetPrice = trade.ExecPrice.Value - points;
                            trade.StopPrice = trade.ExecPrice.Value + (points * 0.5m);
                        }
                        else
                        {
                            trade.StopPrice = trade.ExecPrice.Value + points;
                            trade.TargetPrice = trade.ExecPrice.Value - (points * 2m);
                        }
                    }
                }

                tradesToInsert.Add(trade);
            }

            if (tradesToInsert.Any())
            {
                await _trades.InsertManyAsync(tradesToInsert);

                // Analisar padrões de ganância e loss após importação
                await AnalyzeImportedTradesPatterns(tradesToInsert, userId);
            }

            return new ImportTradesResponse
            {
                ImportId = import.ObjectId,
                Created = tradesToInsert.Count,
                Skipped = 0
            };
        }

        private string CalculateInitialStatus(decimal pl, decimal? execPrice, decimal? targetPrice)
        {
            if (execPrice.HasValue && targetPrice.HasValue &&
                Math.Abs(execPrice.Value - targetPrice.Value) < 0.01m)
            {
                return "winner"; // Atingiu o alvo
            }

            return pl >= 0 ? "winner" : "loser";
        }

        private async Task AnalyzeImportedTradesPatterns(List<Trade> trades, string userId)
        {
            // Agrupar trades por dia
            var tradesByDay = trades.GroupBy(t => t.ExecutedAtUTC.Date)
                                    .OrderBy(g => g.Key);

            foreach (var dayGroup in tradesByDay)
            {
                var dayTrades = dayGroup.OrderBy(t => t.ExecutedAtUTC).ToList();
                decimal cumulativePL = 0;
                bool goalReached = false;
                bool lossReached = false;
                DateTime? goalReachedTime = null;
                DateTime? lossReachedTime = null;

                var dailyGoal = 2m; // €2 meta padrão
                var dailyMaxLoss = 2m; // €2 loss máximo padrão

                foreach (var trade in dayTrades)
                {
                    cumulativePL += trade.RealizedPLEUR;

                    // Verificar se atingiu a meta
                    if (!goalReached && cumulativePL >= dailyGoal)
                    {
                        goalReached = true;
                        goalReachedTime = trade.ExecutedAtUTC;
                    }

                    // Verificar se atingiu o loss máximo
                    if (!lossReached && cumulativePL <= -dailyMaxLoss)
                    {
                        lossReached = true;
                        lossReachedTime = trade.ExecutedAtUTC;
                    }

                    // Marcar trades que ocorreram após atingir a meta (possível ganância)
                    if (goalReached && trade.ExecutedAtUTC > goalReachedTime)
                    {
                        var filter = Builders<Trade>.Filter.Eq(t => t.ObjectId, trade.ObjectId);
                        var update = Builders<Trade>.Update
                            .Set(t => t.Greed, true)
                            .Set(t => t.DailyGoalReached, true);
                        await _trades.UpdateOneAsync(filter, update);
                    }

                    // Marcar trades que ocorreram após atingir o loss máximo
                    if (lossReached && trade.ExecutedAtUTC > lossReachedTime)
                    {
                        var filter = Builders<Trade>.Filter.Eq(t => t.ObjectId, trade.ObjectId);
                        var update = Builders<Trade>.Update
                            .Set(t => t.DailyLossReached, true);
                        await _trades.UpdateOneAsync(filter, update);
                    }
                }
            }
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