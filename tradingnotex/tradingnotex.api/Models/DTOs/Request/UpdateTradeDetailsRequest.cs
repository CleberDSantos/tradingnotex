namespace TradingNoteX.Models.DTOs.Request
{
    public class UpdateTradeDetailsRequest
    {
        public decimal? EntryType { get; set; }
        public bool? Greed { get; set; }
        public string YoutubeLink { get; set; }
        public bool? DailyGoalReached { get; set; }
        public bool? DailyLossReached { get; set; }
    }
}
