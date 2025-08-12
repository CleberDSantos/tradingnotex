using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class TradeService : ITradeService
    {
        private readonly IMongoCollection<Trade> _trades;
        
        public TradeService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
        }
        
        // Métodos existentes (manter os implementados anteriormente)
        public async Task<List<Trade>> GetTradesAsync(string userId, TradeFilterRequest filter)
        {
            // Implementação existente...
            var filterBuilder = Builders<Trade>.Filter;
            //var filters = new List<FilterDefinition<Trade>>
            //{
            //    filterBuilder.Eq(t => t.OwnerId, userId)
            //}

            var filters = new List<FilterDefinition<Trade>>();

            if (!string.IsNullOrEmpty(filter.Instrument) &&
     filter.Instrument.Trim() != "" &&
     filter.Instrument.ToUpper() != "ALL")
            {
                filters.Add(filterBuilder.Eq(t => t.Instrument, filter.Instrument));
            }

            if (filter.StartDate.HasValue)
            {
                filters.Add(filterBuilder.Gte(t => t.ExecutedAtUTC, filter.StartDate.Value));
            }
            
            if (filter.EndDate.HasValue)
            {
                filters.Add(filterBuilder.Lte(t => t.ExecutedAtUTC, filter.EndDate.Value));
            }
            
            var combinedFilter = filterBuilder.And(filters);
            
            var sortDirection = filter.OrderBy.StartsWith("-") ? -1 : 1;
            var sortField = filter.OrderBy.TrimStart('-');
            var sort = Builders<Trade>.Sort.Ascending(sortField);
            if (sortDirection == -1)
            {
                sort = Builders<Trade>.Sort.Descending(sortField);
            }
            

            if(filters.Count == 0)
            {
                combinedFilter = filterBuilder.Eq(t => t.Instrument, "TECH100");
            }
            else
            {
                filters.Add(filterBuilder.Eq(t => t.OwnerId, userId));
                combinedFilter = filterBuilder.And(filters);
            }   

            return await _trades.Find(combinedFilter)
                .Sort(sort)
                .Skip(filter.Skip)
                .Limit(filter.Limit)
                .ToListAsync();
        }
        
        public async Task<Trade> GetTradeByIdAsync(string tradeId, string userId)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            
            return await _trades.Find(filter).FirstOrDefaultAsync();
        }
        
        public async Task<Trade> CreateTradeAsync(Trade trade, string userId)
        {
            trade.OwnerId = userId;
            trade.CreatedAt = DateTime.UtcNow;
            trade.UpdatedAt = DateTime.UtcNow;
            
            trade.ACL = new Dictionary<string, ACLPermission>
            {
                { userId, new ACLPermission { Read = true, Write = true } }
            };
            
            await _trades.InsertOneAsync(trade);
            return trade;
        }
        
        public async Task<Trade> UpdateTradeAsync(string tradeId, Trade trade, string userId)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            
            trade.ObjectId = tradeId;
            trade.OwnerId = userId;
            trade.UpdatedAt = DateTime.UtcNow;
            
            await _trades.ReplaceOneAsync(filter, trade);
            return trade;
        }
        
        public async Task<bool> DeleteTradeAsync(string tradeId, string userId)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            
            var result = await _trades.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }
        
        public async Task<KPIsResponse> GetKPIsAsync(string userId, DateTime? startDate, DateTime? endDate)
        {
            // Implementação existente...
            var filter = Builders<Trade>.Filter.Eq(t => t.OwnerId, userId);
            
            if (startDate.HasValue)
            {
                filter = Builders<Trade>.Filter.And(filter,
                    Builders<Trade>.Filter.Gte(t => t.ExecutedAtUTC, startDate.Value));
            }
            
            if (endDate.HasValue)
            {
                filter = Builders<Trade>.Filter.And(filter,
                    Builders<Trade>.Filter.Lte(t => t.ExecutedAtUTC, endDate.Value));
            }
            
            var trades = await _trades.Find(filter).ToListAsync();
            
            if (!trades.Any())
            {
                return new KPIsResponse();
            }
            
            var totalPL = trades.Sum(t => t.RealizedPLEUR);
            var wins = trades.Count(t => t.RealizedPLEUR > 0);
            var winRate = (decimal)wins / trades.Count * 100;
            var expectancy = totalPL / trades.Count;
            var maxGain = trades.Max(t => t.RealizedPLEUR);
            var maxLoss = trades.Min(t => t.RealizedPLEUR);
            
            decimal cumulative = 0;
            decimal peak = 0;
            decimal maxDrawdown = 0;
            
            foreach (var trade in trades.OrderBy(t => t.ExecutedAtUTC))
            {
                cumulative += trade.RealizedPLEUR;
                if (cumulative > peak) peak = cumulative;
                var currentDrawdown = peak - cumulative;
                if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
            }
            
            return new KPIsResponse
            {
                TotalPL = Math.Round(totalPL, 2),
                WinRate = Math.Round(winRate, 2),
                Expectancy = Math.Round(expectancy, 2),
                MaxGain = Math.Round(maxGain, 2),
                MaxLoss = Math.Round(maxLoss, 2),
                Drawdown = Math.Round(maxDrawdown, 2),
                TotalTrades = trades.Count
            };
        }
        
        public async Task<HourlyHeatmapResponse> GetHourlyHeatmapAsync(string userId)
        {
            // Implementação existente...
            var filter = Builders<Trade>.Filter.Eq(t => t.OwnerId, userId);
            var trades = await _trades.Find(filter).ToListAsync();
            
            var hourlyData = new decimal[24];
            var hourlyCounts = new int[24];
            
            foreach (var trade in trades)
            {
                var hour = trade.ExecutedAtUTC.Hour;
                hourlyData[hour] += trade.RealizedPLEUR;
                hourlyCounts[hour]++;
            }
            
            var heatmap = new List<HourData>();
            for (int h = 0; h < 24; h++)
            {
                heatmap.Add(new HourData
                {
                    Hour = h,
                    PL = Math.Round(hourlyData[h], 2),
                    Trades = hourlyCounts[h],
                    AvgPL = hourlyCounts[h] > 0 
                        ? Math.Round(hourlyData[h] / hourlyCounts[h], 2) 
                        : 0
                });
            }
            
            var sorted = heatmap.OrderByDescending(h => h.PL).ToList();
            
            return new HourlyHeatmapResponse
            {
                Heatmap = heatmap,
                BestHour = sorted.First(),
                WorstHour = sorted.Last()
            };
        }
        
        public async Task<List<string>> GetInsightsAsync(string userId)
        {
            // Implementação existente...
            var kpis = await GetKPIsAsync(userId, null, null);
            var heatmap = await GetHourlyHeatmapAsync(userId);
            
            var insights = new List<string>();
            
            if (kpis.TotalTrades > 0)
            {
                insights.Add($"📊 Você fez {kpis.TotalTrades} trades com resultado líquido de €{kpis.TotalPL} " +
                    $"(Win Rate: {kpis.WinRate}%, Expectancy: €{kpis.Expectancy})");
            }
            
            if (heatmap.BestHour != null && heatmap.WorstHour != null)
            {
                insights.Add($"⏰ Melhor horário: {heatmap.BestHour.Hour}h (€{heatmap.BestHour.PL}). " +
                    $"Pior horário: {heatmap.WorstHour.Hour}h (€{heatmap.WorstHour.PL})");
                
                if (heatmap.WorstHour.PL < 0)
                {
                    insights.Add($"⚠️ Evite operar às {heatmap.WorstHour.Hour}h — é onde mais perde no setup SMC");
                }
            }
            
            insights.Add("💡 Dica SMC: Sempre aguarde o preço voltar ao Order Block antes de entrar");
            insights.Add("💡 No SMC, o melhor R:R vem das entradas em Premium/Discount zones");
            
            if (kpis.WinRate > 60)
            {
                insights.Add("✅ Excelente Win Rate! Seu domínio do SMC está evidente");
            }
            else if (kpis.WinRate < 40)
            {
                insights.Add("⚠️ Win Rate baixo. Revise seus critérios de entrada no setup SMC");
            }
            
            if (kpis.Drawdown > Math.Abs(kpis.TotalPL * 0.5m))
            {
                insights.Add($"⚠️ Drawdown alto (€{kpis.Drawdown}). Considere reduzir o risco por trade");
            }
            
            return insights;
        }
        
        // Novos métodos para Trading Detail
        public async Task<Trade> UpdateTradeDetailsAsync(string tradeId, string userId, UpdateTradeDetailsRequest request)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            
            var update = Builders<Trade>.Update;
            var updates = new List<UpdateDefinition<Trade>>();
            
            if (request.EntryType.HasValue)
                updates.Add(update.Set(t => t.EntryType, request.EntryType.Value));
            
            if (request.Greed.HasValue)
                updates.Add(update.Set(t => t.Greed, request.Greed.Value));
            
            if (request.YoutubeLink != null)
                updates.Add(update.Set(t => t.YoutubeLink, request.YoutubeLink));
            
            if (request.DailyGoalReached.HasValue)
                updates.Add(update.Set(t => t.DailyGoalReached, request.DailyGoalReached.Value));
            
            if (request.DailyLossReached.HasValue)
                updates.Add(update.Set(t => t.DailyLossReached, request.DailyLossReached.Value));
            
            updates.Add(update.Set(t => t.UpdatedAt, DateTime.UtcNow));
            
            await _trades.UpdateOneAsync(filter, update.Combine(updates));
            
            return await GetTradeByIdAsync(tradeId, userId);
        }
        
        public async Task<Comment> AddCommentAsync(string tradeId, string userId, AddCommentRequest request)
        {
            var comment = new Comment
            {
                Author = userId,
                Text = request.Text,
                Screenshot = request.Screenshot,
                CreatedAt = DateTime.UtcNow
            };
            
            var filter = Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId);
            var update = Builders<Trade>.Update.Push(t => t.Comments, comment);
            
            await _trades.UpdateOneAsync(filter, update);
            
            return comment;
        }
        
        public async Task<Comment> AnalyzeCommentAsync(string tradeId, string userId, string commentId)
        {
            var trade = await GetTradeByIdAsync(tradeId, userId);
            var comment = trade.Comments.FirstOrDefault(c => c.Id == commentId);
            
            if (comment == null)
                throw new KeyNotFoundException("Comentário não encontrado");
            
            // Aqui seria integrado com um serviço de IA real
            // Por enquanto, vamos simular uma análise
            comment.AiAnalysis = $"Análise do comentário: {comment.Text}. " +
                $"Este trade foi um {(trade.RealizedPLEUR >= 0 ? "sucesso" : "fracasso")} " +
                $"com P/L de €{trade.RealizedPLEUR}. " +
                $"O trader demonstrou {(trade.Greed ? "sinais de ganância" : "disciplina")} na operação.";
            
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.ElemMatch(t => t.Comments, 
                    Builders<Comment>.Filter.Eq(c => c.Id, commentId))
            );
            
            var update = Builders<Trade>.Update.Set("comments.$.aiAnalysis", comment.AiAnalysis);
            
            await _trades.UpdateOneAsync(filter, update);
            
            return comment;
        }
        
        public async Task<List<Comment>> GetCommentsAsync(string tradeId, string userId)
        {
            var trade = await GetTradeByIdAsync(tradeId, userId);
            return trade.Comments.OrderByDescending(c => c.CreatedAt).ToList();
        }
        
        public async Task<bool> DeleteCommentAsync(string tradeId, string userId, string commentId)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );
            
            var update = Builders<Trade>.Update.PullFilter(t => t.Comments, 
                Builders<Comment>.Filter.Eq(c => c.Id, commentId));
            
            var result = await _trades.UpdateOneAsync(filter, update);
            
            return result.ModifiedCount > 0;
        }
    }
}
