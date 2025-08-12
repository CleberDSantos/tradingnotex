using System.Collections.Generic;

namespace TradingNoteX.Models.DTOs.Request
{
    public class ImportTradesRequest
    {
        public string Name { get; set; }
        public string StatementDateISO { get; set; }
        public List<TradeImportItem> Trades { get; set; }
    }

    public class TradeImportItem
    {
        public string ExecutedAtUTC { get; set; }
        public string Instrument { get; set; }
        public string Side { get; set; }
        public decimal RealizedPLEUR { get; set; }
        public int? DurationMin { get; set; }

        // Novos campos opcionais para importação
        public decimal? OpenPrice { get; set; }
        public decimal? ExecPrice { get; set; }
        public decimal? Spread { get; set; }
        public decimal? OtherFees { get; set; }
        public bool? DailyGoalReached { get; set; }
        public bool? DailyLossReached { get; set; }
        public string Setup { get; set; }
        public string Notes { get; set; }
        public List<string> Tags { get; set; }
    }

    public class ChartDataRequest
    {
        public string Symbol { get; set; }
        public string Interval { get; set; } = "15min";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
