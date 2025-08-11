namespace TradingNoteX.Models.DTOs.Request
{
    public class OptimizePartialsRequest
    {
        public decimal StopPts { get; set; }
        public int Contracts { get; set; }
        public decimal TargetR { get; set; }
        public string CurvePreset { get; set; } = "neutral";
    }
}
