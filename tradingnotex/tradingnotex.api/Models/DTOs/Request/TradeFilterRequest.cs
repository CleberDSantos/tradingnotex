using System;

namespace TradingNoteX.Models.DTOs.Request
{
    public class TradeFilterRequest
    {
        public string Instrument { get; set; }
        public List<string> Instruments { get; set; } // Novo: suporte a múltiplos instrumentos
        public string AccountId { get; set; } // Novo: filtro por conta
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string OrderBy { get; set; } = "-executedAtUTC";
        public int Limit { get; set; } = 100;
        public int Skip { get; set; } = 0;
    }
}
