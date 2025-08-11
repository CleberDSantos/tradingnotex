using System.Threading.Tasks;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class AIAnalysisService : IAIAnalysisService
    {
        public async Task<string> AnalyzeTradeCommentAsync(string commentText, string tradeSide, decimal tradePL)
        {
            // Simulação de análise de IA
            // Em um cenário real, isso seria integrado com uma API de IA como OpenAI, Azure AI, etc.
            
            await Task.Delay(500); // Simular tempo de processamento
            
            string analysis = "Análise do comentário: ";
            
            // Analisa o sentimento do comentário
            if (commentText.ToLower().Contains("bom") || 
                commentText.ToLower().Contains("excelente") || 
                commentText.ToLower().Contains("ótimo"))
            {
                analysis += "O trader demonstra confiança na operação. ";
            }
            else if (commentText.ToLower().Contains("ruim") || 
                     commentText.ToLower().Contains("errado") || 
                     commentText.ToLower().Contains("perda"))
            {
                analysis += "O trader demonstra preocupação com o resultado. ";
            }
            
            // Analisa o resultado do trade
            if (tradePL >= 0)
            {
                analysis += $"O trade foi um sucesso com P/L de €{tradePL}. ";
            }
            else
            {
                analysis += $"O trade resultou em perda de €{Math.Abs(tradePL)}. ";
            }
            
            // Analisa o lado da operação
            if (tradeSide.ToLower() == "buy")
            {
                analysis += "Operação de compra (long). ";
            }
            else
            {
                analysis += "Operação de venda (short). ";
            }
            
            // Dá uma sugestão genérica
            analysis += "Recomendo revisar o plano de gerenciamento de risco para próximos trades.";
            
            return analysis;
        }
    }
}
