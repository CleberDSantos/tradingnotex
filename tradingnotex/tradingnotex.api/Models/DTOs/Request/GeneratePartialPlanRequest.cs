namespace TradingNoteX.Models.DTOs.Request
{
    public class GeneratePartialPlanRequest
    {
        public decimal StopPts { get; set; }
        public int Contracts { get; set; }
        public string Direction { get; set; }
        public decimal Entry { get; set; }
        public decimal R1 { get; set; }
        public decimal R2 { get; set; }
        public decimal R3 { get; set; }
        public int P1 { get; set; }
        public int P2 { get; set; }
        public int P3 { get; set; }
        public decimal UsdPerPointPerContract { get; set; } = 2;
    }
}
