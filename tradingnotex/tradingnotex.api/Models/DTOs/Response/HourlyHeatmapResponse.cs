using System.Collections.Generic;

namespace TradingNoteX.Models.DTOs.Response
{
    public class HourlyHeatmapResponse
    {
        public List<HourData> Heatmap { get; set; }
        public HourData BestHour { get; set; }
        public HourData WorstHour { get; set; }
    }
    
    public class HourData
    {
        public int Hour { get; set; }
        public decimal PL { get; set; }
        public int Trades { get; set; }
        public decimal AvgPL { get; set; }
    }
}
