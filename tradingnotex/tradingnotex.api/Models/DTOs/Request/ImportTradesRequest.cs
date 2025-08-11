using System.Collections.Generic;

namespace TradingNoteX.Models.DTOs.Request
{
    public class ImportTradesRequest
    {
        public string Name { get; set; }
        public string StatementDateISO { get; set; }
        public List<TradeImportItem> Trades { get; set; }
    }
    
    public class TradeImportItem
    {
        public string ExecutedAtUTC { get; set; }
        public string Instrument { get; set; }
        public string Side { get; set; }
        public decimal RealizedPLEUR { get; set; }
        public int? DurationMin { get; set; }
    }
}
