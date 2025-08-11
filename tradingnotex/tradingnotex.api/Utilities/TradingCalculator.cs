using System;
using System.Collections.Generic;
using System.Linq;

namespace TradingNoteX.Utilities
{
    public static class TradingCalculator
    {
        public static decimal CalculateWinRate(List<decimal> pnls)
        {
            if (!pnls.Any()) return 0;
            var wins = pnls.Count(p => p > 0);
            return (decimal)wins / pnls.Count * 100;
        }
        
        public static decimal CalculateExpectancy(List<decimal> pnls)
        {
            if (!pnls.Any()) return 0;
            return pnls.Sum() / pnls.Count;
        }
        
        public static decimal CalculateProfitFactor(List<decimal> pnls)
        {
            if (!pnls.Any()) return 0;
            
            var grossProfit = pnls.Where(p => p > 0).Sum();
            var grossLoss = Math.Abs(pnls.Where(p => p < 0).Sum());
            
            return grossLoss == 0 ? (grossProfit > 0 ? decimal.MaxValue : 0) : grossProfit / grossLoss;
        }
        
        public static decimal CalculateMaxDrawdown(List<decimal> pnls)
        {
            if (!pnls.Any()) return 0;
            
            decimal peak = 0;
            decimal maxDrawdown = 0;
            decimal cumulative = 0;
            
            foreach (var pnl in pnls)
            {
                cumulative += pnl;
                if (cumulative > peak) peak = cumulative;
                var currentDrawdown = peak - cumulative;
                if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
            }
            
            return maxDrawdown;
        }
        
        public static decimal CalculateSharpeRatio(List<decimal> returns, decimal riskFreeRate = 0.02m)
        {
            if (!returns.Any()) return 0;
            
            var avgReturn = returns.Average();
            var stdDev = CalculateStandardDeviation(returns);
            
            return stdDev == 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
        }
        
        public static decimal CalculateStandardDeviation(List<decimal> values)
        {
            if (!values.Any()) return 0;
            
            var mean = values.Average();
            var squaredDifferences = values.Select(v => (double)Math.Pow((double)(v - mean), 2));
            var avgSquaredDifference = squaredDifferences.Average();
            
            return (decimal)Math.Sqrt(avgSquaredDifference);
        }
        
        public static (int consecutive, decimal total) CalculateConsecutiveWins(List<decimal> pnls)
        {
            int maxConsecutive = 0;
            int currentConsecutive = 0;
            decimal maxTotal = 0;
            decimal currentTotal = 0;
            
            foreach (var pnl in pnls)
            {
                if (pnl > 0)
                {
                    currentConsecutive++;
                    currentTotal += pnl;
                    
                    if (currentConsecutive > maxConsecutive)
                    {
                        maxConsecutive = currentConsecutive;
                        maxTotal = currentTotal;
                    }
                }
                else
                {
                    currentConsecutive = 0;
                    currentTotal = 0;
                }
            }
            
            return (maxConsecutive, maxTotal);
        }
        
        public static (int consecutive, decimal total) CalculateConsecutiveLosses(List<decimal> pnls)
        {
            int maxConsecutive = 0;
            int currentConsecutive = 0;
            decimal maxTotal = 0;
            decimal currentTotal = 0;
            
            foreach (var pnl in pnls)
            {
                if (pnl < 0)
                {
                    currentConsecutive++;
                    currentTotal += Math.Abs(pnl);
                    
                    if (currentConsecutive > maxConsecutive)
                    {
                        maxConsecutive = currentConsecutive;
                        maxTotal = currentTotal;
                    }
                }
                else
                {
                    currentConsecutive = 0;
                    currentTotal = 0;
                }
            }
            
            return (maxConsecutive, maxTotal);
        }
    }
}
