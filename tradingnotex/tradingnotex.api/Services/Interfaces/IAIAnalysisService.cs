using System.Threading.Tasks;

namespace TradingNoteX.Services.Interfaces
{
    public interface IAIAnalysisService
    {
        /// <summary>
        /// Analisa um comentário de trade usando IA especializada em SMC/OTE
        /// </summary>
        /// <param name="commentText">Texto do comentário do trader</param>
        /// <param name="tradeSide">Direção do trade (buy/sell)</param>
        /// <param name="tradePL">P/L do trade em EUR</param>
        /// <param name="instrument">Instrumento negociado</param>
        /// <param name="entryType">Tipo de entrada (0-100, impulso vs operacional)</param>
        /// <param name="greed">Indica se houve ganância no trade</param>
        /// <returns>Análise detalhada em formato texto</returns>
        Task<string> AnalyzeTradeCommentAsync(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument = null,
            decimal entryType = 50,
            bool greed = false
        );
    }
}