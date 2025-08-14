namespace TradingNoteX.Models.DTOs.Request
{
    public class UpdateTradeDetailsRequest
    {
        public string AccountId { get; set; } // Novo: atualizar conta do trade
        public decimal? OpenPrice { get; set; }
        public decimal? ExecPrice { get; set; }
        public decimal? StopPrice { get; set; }
        public decimal? TargetPrice { get; set; }
        public decimal? Spread { get; set; }
        public decimal? OtherFees { get; set; }
        public decimal? EntryType { get; set; }
        public bool? Greed { get; set; }
        public string YoutubeLink { get; set; }
        public bool? DailyGoalReached { get; set; }
        public bool? DailyLossReached { get; set; }
        public string TradeStatus { get; set; }
    }
}
