using TradingNoteX.Models.Entities;

namespace TradingNoteX.Services.Interfaces
{
    public interface IAIAnalysisService
    {
        Task<string> AnalyzeTradeCommentAsync(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument = null,
            decimal entryType = 50,
            bool greed = false,
            List<CommentAttachment> attachments = null);

        Task<AiAnalysisResponse> GenerateFormattedAnalysis(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed,
            List<CommentAttachment> attachments);
    }
}