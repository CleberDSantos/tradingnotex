using System.Collections.Generic;

namespace TradingNoteX.Models.DTOs.Response
{
    public class GeneratePartialPlanResponse
    {
        public List<PartialRow> Rows { get; set; }
        public decimal PlanPnL { get; set; }
        public decimal FullHoldPnL { get; set; }
        public string Hint { get; set; }
    }
}
