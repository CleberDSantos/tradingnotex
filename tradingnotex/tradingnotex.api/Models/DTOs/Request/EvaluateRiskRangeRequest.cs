namespace TradingNoteX.Models.DTOs.Request
{
    public class EvaluateRiskRangeRequest
    {
        public string Start { get; set; }
        public string End { get; set; }
        public decimal GoalEUR { get; set; }
        public decimal MaxLossEUR { get; set; }
    }
}
