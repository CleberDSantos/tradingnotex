using System;

namespace TradingNoteX.Models.DTOs.Request
{
    public class TradeFilterRequest
    {
        public string? Instrument { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string OrderBy { get; set; } = "-createdAt";
        public int Limit { get; set; } = 100;
        public int Skip { get; set; } = 0;
    }
}
