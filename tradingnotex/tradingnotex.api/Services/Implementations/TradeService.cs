using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using tradingnotex.api.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class TradeService : ITradeService
    {
        private readonly IMongoCollection<Trade> _trades;
        private readonly IAIAnalysisService _aiAnalysisService;
        private readonly ILogger<TradeService> _logger;
        private readonly IMongoCollection<Import> _imports;

        public TradeService(
            IOptions<MongoDbSettings> settings,
            IAIAnalysisService aiAnalysisService,
            ILogger<TradeService> logger)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
            _aiAnalysisService = aiAnalysisService;
            _logger = logger;
            _imports = database.GetCollection<Import>(settings.Value.ImportsCollection);
        }

        public async Task<Trade> UpdateTradeDetailsAsync(string tradeId, string userId, UpdateTradeDetailsRequest request)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );

            var update = Builders<Trade>.Update;
            var updates = new List<UpdateDefinition<Trade>>();

            // Atualizar preços e níveis
            if (request.OpenPrice.HasValue)
                updates.Add(update.Set(t => t.OpenPrice, request.OpenPrice.Value));

            if (request.ExecPrice.HasValue)
                updates.Add(update.Set(t => t.ExecPrice, request.ExecPrice.Value));

            if (request.StopPrice.HasValue)
                updates.Add(update.Set(t => t.StopPrice, request.StopPrice.Value));

            if (request.TargetPrice.HasValue)
                updates.Add(update.Set(t => t.TargetPrice, request.TargetPrice.Value));

            if (request.Spread.HasValue)
                updates.Add(update.Set(t => t.Spread, request.Spread.Value));

            if (request.OtherFees.HasValue)
                updates.Add(update.Set(t => t.OtherFees, request.OtherFees.Value));

            // Atualizar comportamento
            if (request.EntryType.HasValue)
                updates.Add(update.Set(t => t.EntryType, request.EntryType.Value));

            if (request.Greed.HasValue)
                updates.Add(update.Set(t => t.Greed, request.Greed.Value));

            if (request.YoutubeLink != null)
                updates.Add(update.Set(t => t.YoutubeLink, request.YoutubeLink));

            // Atualizar status
            if (request.DailyGoalReached.HasValue)
                updates.Add(update.Set(t => t.DailyGoalReached, request.DailyGoalReached.Value));

            if (request.DailyLossReached.HasValue)
                updates.Add(update.Set(t => t.DailyLossReached, request.DailyLossReached.Value));

            if (!string.IsNullOrEmpty(request.TradeStatus))
                updates.Add(update.Set(t => t.TradeStatus, request.TradeStatus));

            // Calcular e atualizar status do trade baseado nas regras
            var trade = await GetTradeByIdAsync(tradeId, userId);
            if (trade != null)
            {
                var calculatedStatus = CalculateTradeStatus(trade, request);
                updates.Add(update.Set(t => t.TradeStatus, calculatedStatus));
            }

            updates.Add(update.Set(t => t.UpdatedAt, DateTime.UtcNow));

            if (updates.Any())
            {
                await _trades.UpdateOneAsync(filter, update.Combine(updates));
            }

            return await GetTradeByIdAsync(tradeId, userId);
        }

        private string CalculateTradeStatus(Trade trade, UpdateTradeDetailsRequest request)
        {
            var execPrice = request.ExecPrice ?? trade.ExecPrice ?? 0;
            var targetPrice = request.TargetPrice ?? trade.TargetPrice ?? 0;
            var pl = trade.RealizedPLEUR;

            // Regras de status conforme o código JavaScript
            if (execPrice > 0 && targetPrice > 0 && Math.Abs(execPrice - targetPrice) < 0.01m)
            {
                return "winner"; // Atingiu o alvo
            }

            if (execPrice < targetPrice && pl > 0)
            {
                return "protection"; // Proteção
            }

            return pl >= 0 ? "winner" : "loser";
        }

        public async Task<Trade> CreateTradeAsync(CreateTradeRequest request, string userId)
        {
            if (string.IsNullOrWhiteSpace(request?.Instrument))
                throw new ArgumentException("Instrument é obrigatório.");

            // Normalizações
            var executedAt = request.ExecutedAtUTC.Kind == DateTimeKind.Utc
                ? request.ExecutedAtUTC
                : request.ExecutedAtUTC.ToUniversalTime();

            var instrument = (request.Instrument ?? "").Trim().ToUpperInvariant();

            var side = (request.Side ?? "buy").Trim().ToLowerInvariant();
            if (side != "buy" && side != "sell") side = "buy";

            var status = !string.IsNullOrWhiteSpace(request.TradeStatus)
                ? request.TradeStatus.Trim()
                : (request.RealizedPLEUR >= 0m ? "Vencedor" : "Perdedor");

            // (Opcional) Dedupe simples por trade manual (mesma minute-window, mesmo instrumento/side/PL/status)
            var execMinStart = new DateTime(executedAt.Year, executedAt.Month, executedAt.Day, executedAt.Hour, executedAt.Minute, 0, DateTimeKind.Utc);
            var execMinEnd = execMinStart.AddMinutes(1);
            var pl2 = Math.Round(request.RealizedPLEUR, 2, MidpointRounding.AwayFromZero);

            var eps = 0.005m;              // meia casa de centavo
            var plLow = pl2 - eps;
            var plHigh = pl2 + eps;

            var dupFilter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId),
                Builders<Trade>.Filter.Gte(t => t.ExecutedAtUTC, execMinStart),
                Builders<Trade>.Filter.Lt(t => t.ExecutedAtUTC, execMinEnd),
                Builders<Trade>.Filter.Eq(t => t.Instrument, instrument),
                Builders<Trade>.Filter.Eq(t => t.Side, side),
                Builders<Trade>.Filter.Eq(t => t.TradeStatus, status),
                Builders<Trade>.Filter.Gte(t => t.RealizedPLEUR, plLow),
                Builders<Trade>.Filter.Lt(t => t.RealizedPLEUR, plHigh)
            );

            var exists = await _trades.Find(dupFilter).Limit(1).AnyAsync();
            if (exists)
            {
                _logger.LogInformation("CreateTrade ignorado (duplicado): {Time} {Instr} {Side} PL={PL} {Status}",
                    execMinStart, instrument, side, pl2.ToString("F2", CultureInfo.InvariantCulture), status);
                // Pode retornar o registro existente, ou lançar 409. Aqui vou retornar o existente.
                return await _trades.Find(dupFilter).FirstOrDefaultAsync();
            }

            // Criar/usar um Import "Manual" para vincular entradas do formulário
            var import = new Import
            {
                Name = $"Manual Form {DateTime.UtcNow:yyyy-MM-dd}",
                StatementDate = DateTime.UtcNow.Date,
                Source = "manual-form",
                Count = 1,
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                }
            };
            await _imports.InsertOneAsync(import);

            // Montar entidade completa com defaults para campos "required"
            var entity = new Trade
            {
                ObjectId = ObjectId.GenerateNewId().ToString(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ExecutedAtUTC = executedAt,

                Instrument = instrument,
                Side = side,
                RealizedPLEUR = request.RealizedPLEUR,
                DurationMin = request.DurationMin,
                Setup = string.IsNullOrWhiteSpace(request.Setup) ? "SMC" : request.Setup.Trim(),

                // Campos obrigatórios que causavam 400:
                Emotion = new TradeEmotion { Mood = "neutral", Arousal = "calm" },
                Notes = "",                // default vazio para não quebrar validação
                YoutubeLink = "",          // idem

                ImportId = import.ObjectId,
                OwnerId = userId,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                },

                // Opcionais do formulário
                OpenPrice = request.OpenPrice,
                ExecPrice = request.ExecPrice,
                StopPrice = request.StopPrice,
                TargetPrice = request.TargetPrice,
                Spread = request.Spread,
                OtherFees = request.OtherFees,
                EntryType = request.EntryType,
                DailyGoalReached = request.DailyGoalReached,
                DailyLossReached = request.DailyLossReached,
                Greed = request.Greed,

                TradeStatus = status,

                Comments = new List<Comment>(),
                ChartScreenshots = new List<ChartScreenshot>()
            };

            await _trades.InsertOneAsync(entity);
            return entity;
        }
    

        public async Task<List<Trade>> GetTradesAsync(string userId, TradeFilterRequest filter)
        {
            var filterBuilder = Builders<Trade>.Filter;
            var filters = new List<FilterDefinition<Trade>>
            {
                filterBuilder.Eq(t => t.OwnerId, userId)
            };

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
            var sort = sortDirection == -1
                ? Builders<Trade>.Sort.Descending(sortField)
                : Builders<Trade>.Sort.Ascending(sortField);

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
                BestHour = sorted.FirstOrDefault(),
                WorstHour = sorted.LastOrDefault()
            };
        }

        public async Task<List<string>> GetInsightsAsync(string userId)
        {
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

        public async Task<Comment> AddCommentAsync(string tradeId, string userId, AddCommentRequest request)
        {
            var attachments = new List<CommentAttachment>();

            if (request.Attachments != null && request.Attachments.Any())
            {
                foreach (var attachmentDto in request.Attachments)
                {
                    attachments.Add(new CommentAttachment
                    {
                        Type = attachmentDto.Type,
                        Data = attachmentDto.Data,
                        Filename = attachmentDto.Filename,
                        Size = attachmentDto.Size,
                        MimeType = attachmentDto.MimeType
                    });
                }
            }

            // Compatibilidade com screenshot antigo
            if (!string.IsNullOrWhiteSpace(request.Screenshot) && !attachments.Any())
            {
                attachments.Add(new CommentAttachment
                {
                    Type = "image",
                    Data = request.Screenshot,
                    Filename = "screenshot.png",
                    Size = 0,
                    MimeType = "image/png"
                });
            }

            var comment = new Comment
            {
                Author = userId,
                Text = request.Text,
                Screenshot = request.Screenshot,
                Attachments = attachments,
                CreatedAt = DateTime.UtcNow
            };

            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId)
            );

            var update = Builders<Trade>.Update.Push(t => t.Comments, comment);

            await _trades.UpdateOneAsync(filter, update);

            return comment;
        }

        public async Task<Comment> AnalyzeCommentAsync(string tradeId, string userId, string commentId)
        {
            var trade = await GetTradeByIdAsync(tradeId, userId);

            if (trade == null)
                throw new KeyNotFoundException("Trade não encontrado");

            var comment = trade.Comments.FirstOrDefault(c => c.Id == commentId);

            if (comment == null)
                throw new KeyNotFoundException("Comentário não encontrado");

            if (_aiAnalysisService != null)
            {
                try
                {
                    var aiResponse = await _aiAnalysisService.GenerateFormattedAnalysis(
                        comment.Text,
                        trade.Side,
                        trade.RealizedPLEUR,
                        trade.Instrument,
                        trade.EntryType,
                        trade.Greed,
                        comment.Attachments
                    );

                    comment.AiAnalysis = aiResponse.Text;
                    comment.AiAnalysisRendered = aiResponse;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao gerar análise de IA");
                    comment.AiAnalysis = GenerateFallbackAnalysis(comment.Text, trade);
                    comment.AiAnalysisRendered = new AiAnalysisResponse
                    {
                        Author = "🤖 Assistente IA",
                        Badge = "Análise",
                        Text = comment.AiAnalysis,
                        Timestamp = "Agora",
                        AvatarType = "ai"
                    };
                }
            }
            else
            {
                comment.AiAnalysis = GenerateFallbackAnalysis(comment.Text, trade);
                comment.AiAnalysisRendered = new AiAnalysisResponse
                {
                    Author = "🤖 Assistente IA",
                    Badge = "Análise",
                    Text = comment.AiAnalysis,
                    Timestamp = "Agora",
                    AvatarType = "ai"
                };
            }

            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.ObjectId, tradeId),
                Builders<Trade>.Filter.ElemMatch(t => t.Comments,
                    Builders<Comment>.Filter.Eq(c => c.Id, commentId))
            );

            var update = Builders<Trade>.Update
                .Set("comments.$.aiAnalysis", comment.AiAnalysis)
                .Set("comments.$.aiAnalysisRendered", comment.AiAnalysisRendered);

            await _trades.UpdateOneAsync(filter, update);

            return comment;
        }

        private string GenerateFallbackAnalysis(string commentText, Trade trade)
        {
            var isWinner = trade.RealizedPLEUR >= 0;
            var entryTypeText = trade.EntryType < 30 ? "impulsiva" :
                               trade.EntryType > 70 ? "operacional" : "balanceada";

            var analysis = new StringBuilder();

            if (isWinner)
            {
                analysis.AppendLine($"Boa execução! Trade vencedor com P/L de €{trade.RealizedPLEUR:F2}. 🎯");
                analysis.AppendLine($"Sua entrada {entryTypeText} funcionou bem neste caso.");
            }
            else
            {
                analysis.AppendLine($"Trade com resultado negativo de €{trade.RealizedPLEUR:F2}. ⚠️");
                analysis.AppendLine("Revise se havia confluência suficiente de fatores SMC antes da entrada.");
            }

            if (!string.IsNullOrWhiteSpace(commentText))
            {
                if (commentText.ToLower().Contains("volume"))
                {
                    analysis.AppendLine("Excelente observação sobre volume! Continue monitorando esse fator.");
                }

                if (commentText.ToLower().Contains("divergência"))
                {
                    analysis.AppendLine("Divergências são úteis, mas sempre confirme com a estrutura de mercado.");
                }
            }

            if (trade.Greed)
            {
                analysis.AppendLine("\n⚠️ Cuidado com a ganância. Use gestão de parciais para proteger lucros.");
            }

            analysis.AppendLine($"\nPara melhorar: sempre aguarde o preço retornar à OTE Zone (61.8%-78.6%) antes de entrar. Continue registrando seus trades! 🚀");

            return analysis.ToString();
        }

        public async Task<List<Comment>> GetCommentsAsync(string tradeId, string userId)
        {
            var trade = await GetTradeByIdAsync(tradeId, userId);
            return trade?.Comments?.OrderByDescending(c => c.CreatedAt).ToList() ?? new List<Comment>();
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