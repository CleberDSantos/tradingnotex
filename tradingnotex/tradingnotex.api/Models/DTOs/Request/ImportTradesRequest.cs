using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TradingNoteX.Models.DTOs.Request
{
    public class ImportTradesRequest
    {
        public string Name { get; set; }
        public DateTime? StatementDateISO { get; set; }
        public string AccountId { get; set; }
        public List<TradeImportItem> Trades { get; set; }
    }

    public class TradeImportItem
    {
        public DateTime ExecutedAtUTC { get; set; }
        public string Instrument { get; set; }
        public string Side { get; set; }
        public decimal RealizedPLEUR { get; set; }
        public int? DurationMin { get; set; }
        public string Setup { get; set; }
        public string Notes { get; set; }
        public List<string> Tags { get; set; }
        public string YoutubeLink { get; set; }
        public bool? DailyGoalReached { get; set; }
        public bool? DailyLossReached { get; set; }
        public bool? Greed { get; set; }
        public decimal? OpenPrice { get; set; }
        public decimal? ExecPrice { get; set; }
        public decimal? StopPrice { get; set; }
        public decimal? TargetPrice { get; set; }
        public decimal? Spread { get; set; }
        public decimal? OtherFees { get; set; }
        public int? EntryType { get; set; }
    }

   

  
}


