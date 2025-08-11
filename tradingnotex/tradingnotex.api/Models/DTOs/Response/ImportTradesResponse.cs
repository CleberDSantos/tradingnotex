namespace TradingNoteX.Models.DTOs.Response
{
    public class ImportTradesResponse
    {
        public string ImportId { get; set; }
        public int Created { get; set; }
        public int Skipped { get; set; }
    }
}
