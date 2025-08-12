namespace TradingNoteX.Models.DTOs.Request
{
    public class UpdateTradeDetailsRequest
    {
        // Preços e níveis
        public decimal? OpenPrice { get; set; }
        public decimal? ExecPrice { get; set; }
        public decimal? StopPrice { get; set; }
        public decimal? TargetPrice { get; set; }
        public decimal? Spread { get; set; }
        public decimal? OtherFees { get; set; }

        // Comportamento
        public decimal? EntryType { get; set; }
        public bool? Greed { get; set; }
        public string YoutubeLink { get; set; }

        // Status
        public bool? DailyGoalReached { get; set; }
        public bool? DailyLossReached { get; set; }
        public string TradeStatus { get; set; }
    }
}
