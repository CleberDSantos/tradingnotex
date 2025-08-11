namespace TradingNoteX.Models.DTOs.Response
{
    public class PartialRow
    {
        public string Label { get; set; }
        public decimal R { get; set; }
        public decimal Points { get; set; }
        public decimal Price { get; set; }
        public int Lots { get; set; }
        public decimal PnL { get; set; }
        public decimal PnLAccum { get; set; }
        public string StopAction { get; set; }
    }
}
