using System;

namespace TradingNoteX.Models.DTOs.Response
{
    public class CurvePoint
    {
        public DateTime Time { get; set; }
        public decimal Equity { get; set; }
    }
}
