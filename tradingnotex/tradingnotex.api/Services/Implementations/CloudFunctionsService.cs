using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class CloudFunctionsService : ICloudFunctionsService
    {
        private readonly IMongoCollection<Trade> _trades;
        private const decimal USD_PER_POINT_PER_CONTRACT = 2.0m;
        
        public CloudFunctionsService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);
        }
        
        public async Task<OptimizePartialsResponse> OptimizePartialsAsync(OptimizePartialsRequest request)
        {
            var best = new OptimizePartialsResponse { EV = decimal.MinValue };
            
            for (decimal r1 = 0.75m; r1 <= Math.Min(2.5m, request.TargetR - 0.5m); r1 += 0.25m)
            {
                for (decimal r2 = r1 + 0.25m; r2 <= Math.Min(4m, request.TargetR - 0.25m); r2 += 0.25m)
                {
                    for (int p1 = 20; p1 <= 70; p1 += 10)
                    {
                        for (int p2 = 0; p2 <= Math.Min(60, 100 - p1); p2 += 10)
                        {
                            int p3 = 100 - p1 - p2;
                            decimal ev = CalculateEV(request, r1, r2, request.TargetR, p1, p2, p3);
                            
                            if (ev > best.EV)
                            {
                                best = new OptimizePartialsResponse
                                {
                                    R1 = r1,
                                    R2 = r2,
                                    R3 = request.TargetR,
                                    P1 = p1,
                                    P2 = p2,
                                    P3 = p3,
                                    EV = Math.Round(ev, 2)
                                };
                            }
                        }
                    }
                }
            }
            
            return await Task.FromResult(best);
        }
        
        private decimal CalculateEV(OptimizePartialsRequest request, decimal r1, decimal r2, decimal r3,
            int p1, int p2, int p3)
        {
            var prob1 = ReachProbability(r1, request.CurvePreset);
            var prob2 = ReachProbability(r2, request.CurvePreset);
            var prob3 = ReachProbability(r3, request.CurvePreset);
            
            var lots1 = Math.Floor(request.Contracts * p1 / 100m);
            var lots2 = Math.Floor(request.Contracts * p2 / 100m);
            var lots3 = request.Contracts - (lots1 + lots2);
            
            var risk = request.StopPts * USD_PER_POINT_PER_CONTRACT * request.Contracts;
            var pnl1 = r1 * request.StopPts * USD_PER_POINT_PER_CONTRACT * lots1;
            var pnl2 = r2 * request.StopPts * USD_PER_POINT_PER_CONTRACT * lots2;
            var pnl3 = r3 * request.StopPts * USD_PER_POINT_PER_CONTRACT * lots3;
            
            return (prob1 * pnl1) + (prob2 * pnl2) + (prob3 * pnl3) - ((1 - prob1) * risk);
        }
        
        private decimal ReachProbability(decimal r, string preset)
        {
            decimal k = preset switch
            {
                "conservative" => 0.65m,
                "aggressive" => 0.30m,
                _ => 0.45m
            };
            
            var rr = Math.Max(0, r - 0.5m);
            return (decimal)Math.Max(0, Math.Min(1, Math.Exp((double)(-k * rr))));
        }
        
        public async Task<GeneratePartialPlanResponse> GeneratePartialPlanAsync(GeneratePartialPlanRequest request)
        {
            var lots1 = (int)Math.Floor(request.Contracts * request.P1 / 100m);
            var lots2 = (int)Math.Floor(request.Contracts * request.P2 / 100m);
            var lots3 = request.Contracts - (lots1 + lots2);
            
            var rows = new List<PartialRow>();
            decimal pnlAccum = 0;
            
            var steps = new[]
            {
                new { Label = "Parcial 1", R = request.R1, Lots = lots1, StopAction = "Mover stop para BE" },
                new { Label = "Parcial 2", R = request.R2, Lots = lots2, StopAction = "Trail: último swing/0.5R" },
                new { Label = "Final", R = request.R3, Lots = lots3, StopAction = "Manter trail / alvo da meta" }
            };
            
            foreach (var step in steps)
            {
                var points = step.R * request.StopPts;
                var price = request.Direction == "long" 
                    ? request.Entry + points 
                    : request.Entry - points;
                var pnl = points * request.UsdPerPointPerContract * step.Lots;
                pnlAccum += pnl;
                
                rows.Add(new PartialRow
                {
                    Label = step.Label,
                    R = step.R,
                    Points = Math.Round(points, 2),
                    Price = Math.Round(price, 2),
                    Lots = step.Lots,
                    PnL = Math.Round(pnl, 2),
                    PnLAccum = Math.Round(pnlAccum, 2),
                    StopAction = step.StopAction
                });
            }
            
            var fullHoldPnL = request.R3 * request.StopPts * request.UsdPerPointPerContract * request.Contracts;
            string hint = null;
            
            if (pnlAccum < fullHoldPnL && lots3 > 0)
            {
                var missing = fullHoldPnL - pnlAccum;
                var pointsNeeded = missing / (request.UsdPerPointPerContract * lots3);
                var rNeeded = Math.Max(request.R3, pointsNeeded / request.StopPts);
                hint = $"Ajuste R3 para ~{rNeeded:F1}R para equiparar meta de ${fullHoldPnL:F2}";
            }
            
            return await Task.FromResult(new GeneratePartialPlanResponse
            {
                Rows = rows,
                PlanPnL = Math.Round(pnlAccum, 2),
                FullHoldPnL = Math.Round(fullHoldPnL, 2),
                Hint = hint
            });
        }
        
        public async Task<EvaluateRiskDayResponse> EvaluateRiskDayAsync(EvaluateRiskDayRequest request, string userId)
        {
            var dayStart = DateTime.Parse(request.Day).Date;
            var dayEnd = dayStart.AddDays(1);
            
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId),
                Builders<Trade>.Filter.Gte(t => t.ExecutedAtUTC, dayStart),
                Builders<Trade>.Filter.Lt(t => t.ExecutedAtUTC, dayEnd)
            );
            
            var trades = await _trades.Find(filter)
                .Sort(Builders<Trade>.Sort.Ascending(t => t.ExecutedAtUTC))
                .ToListAsync();
            
            if (!trades.Any())
            {
                return new EvaluateRiskDayResponse
                {
                    Day = request.Day,
                    Curve = new List<CurvePoint>(),
                    Final = 0,
                    Disciplined = 0,
                    HitGoalAt = null,
                    HitLossAt = null,
                    Greed = false,
                    LossBreach = false,
                    Impact = 0
                };
            }
            
            var curve = new List<CurvePoint>();
            decimal cumulative = 0;
            decimal disciplined = 0;
            DateTime? hitGoalAt = null;
            DateTime? hitLossAt = null;
            
            foreach (var trade in trades)
            {
                cumulative += trade.RealizedPLEUR;
                curve.Add(new CurvePoint
                {
                    Time = trade.ExecutedAtUTC,
                    Equity = Math.Round(cumulative, 2)
                });
                
                if (!hitGoalAt.HasValue && cumulative >= request.GoalEUR)
                {
                    hitGoalAt = trade.ExecutedAtUTC;
                    disciplined = request.GoalEUR;
                    break;
                }
                
                if (!hitLossAt.HasValue && cumulative <= -request.MaxLossEUR)
                {
                    hitLossAt = trade.ExecutedAtUTC;
                    disciplined = -request.MaxLossEUR;
                    break;
                }
            }
            
            if (!hitGoalAt.HasValue && !hitLossAt.HasValue)
            {
                disciplined = cumulative;
            }
            
            var greed = hitGoalAt.HasValue && cumulative < request.GoalEUR;
            var lossBreach = hitLossAt.HasValue && cumulative < -request.MaxLossEUR;
            var impact = disciplined - cumulative;
            
            return new EvaluateRiskDayResponse
            {
                Day = request.Day,
                Curve = curve,
                Final = Math.Round(cumulative, 2),
                Disciplined = Math.Round(disciplined, 2),
                HitGoalAt = hitGoalAt,
                HitLossAt = hitLossAt,
                Greed = greed,
                LossBreach = lossBreach,
                Impact = Math.Round(impact, 2)
            };
        }
        
        public async Task<EvaluateRiskRangeResponse> EvaluateRiskRangeAsync(EvaluateRiskRangeRequest request, string userId)
        {
            var results = new List<EvaluateRiskDayResponse>();
            var current = DateTime.Parse(request.Start);
            var end = DateTime.Parse(request.End);
            
            while (current <= end)
            {
                var dayEvaluation = await EvaluateRiskDayAsync(new EvaluateRiskDayRequest
                {
                    Day = current.ToString("yyyy-MM-dd"),
                    GoalEUR = request.GoalEUR,
                    MaxLossEUR = request.MaxLossEUR
                }, userId);
                
                if (dayEvaluation.Curve.Any())
                {
                    results.Add(dayEvaluation);
                }
                
                current = current.AddDays(1);
            }
            
            return new EvaluateRiskRangeResponse { Results = results };
        }
    }
}
