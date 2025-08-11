namespace TradingNoteX.Models.DTOs.Response
{
    public class KPIsResponse
    {
        public decimal TotalPL { get; set; }
        public decimal WinRate { get; set; }
        public decimal Expectancy { get; set; }
        public decimal MaxGain { get; set; }
        public decimal MaxLoss { get; set; }
        public decimal Drawdown { get; set; }
        public int TotalTrades { get; set; }
    }
}
