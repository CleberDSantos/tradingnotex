using System.Threading.Tasks;

namespace TradingNoteX.Services.Interfaces
{
    public interface IAIAnalysisService
    {
        Task<string> AnalyzeTradeCommentAsync(string commentText, string tradeSide, decimal tradePL);
    }
}
