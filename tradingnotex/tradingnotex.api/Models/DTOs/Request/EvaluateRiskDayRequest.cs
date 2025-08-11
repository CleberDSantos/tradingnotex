namespace TradingNoteX.Models.DTOs.Request
{
    public class EvaluateRiskDayRequest
    {
        public string Day { get; set; }
        public decimal GoalEUR { get; set; }
        public decimal MaxLossEUR { get; set; }
    }
}
