namespace TradingNoteX.Models.DTOs.Response
{
    public class OptimizePartialsResponse
    {
        public decimal R1 { get; set; }
        public decimal R2 { get; set; }
        public decimal R3 { get; set; }
        public int P1 { get; set; }
        public int P2 { get; set; }
        public int P3 { get; set; }
        public decimal EV { get; set; }
    }
}
