namespace tradingnotex.api.Models.DTOs.Request
{
    public class CreateTradeRequest
    {
        public DateTime ExecutedAtUTC { get; set; }
        public string Instrument { get; set; }
        public string Side { get; set; }              // "buy" / "sell"
        public decimal RealizedPLEUR { get; set; }
        public int? DurationMin { get; set; }
        public string Setup { get; set; } = "SMC";
        public string TradeStatus { get; set; }       // opcional; se vazio, derivamos do P/L
        public string AccountId { get; set; }         // Novo: conta associada ao trade

        // O resto é opcional no formulário
        public decimal? OpenPrice { get; set; }
        public decimal? ExecPrice { get; set; }
        public decimal? StopPrice { get; set; }
        public decimal? TargetPrice { get; set; }
        public decimal? Spread { get; set; }
        public decimal? OtherFees { get; set; }
        public decimal EntryType { get; set; } = 50;
        public bool DailyGoalReached { get; set; } = false;
        public bool DailyLossReached { get; set; } = false;
        public bool Greed { get; set; } = false;
    }
}
