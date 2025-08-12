using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class AIAnalysisService : IAIAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIAnalysisService> _logger;
        private readonly string _aiProvider;
        private readonly string _apiKey;

        // Personalidade do assistente SMC/OTE
        private const string SMC_OTE_SYSTEM_PROMPT = @"
        Você é um especialista em Smart Money Concepts (SMC) e Optimal Trade Entry (OTE) com mais de 10 anos de experiência em trading institucional.
        
        Seu conhecimento inclui:
        - Estrutura de mercado e mudanças de caráter (CHoCH/BOS)
        - Order Blocks (Bullish OB, Bearish OB, Breaker Blocks)
        - Fair Value Gaps (FVG) e Imbalances
        - OTE Zone (61.8% - 78.6% Fibonacci retracement)
        - Liquidity Pools e Stop Hunts
        - Premium/Discount Zones
        - Market Structure Shift (MSS)
        - Inducement e Judas Swing
        - Asian Session Range e Kill Zones
        
        Ao analisar trades e comentários:
        1. Sempre relacione com conceitos SMC
        2. Identifique possíveis melhorias na entrada usando OTE
        3. Aponte estruturas de mercado relevantes
        4. Sugira gestão de risco baseada em Order Blocks
        5. Use terminologia técnica mas explique de forma clara
        6. Seja específico sobre níveis e zonas
        7. Mencione confluências quando relevante
        
        Mantenha um tom profissional mas acessível, como um mentor experiente.";

        public AIAnalysisService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<AIAnalysisService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            // Configurar provider de IA (OpenAI, Gemini, Claude, etc)
            _aiProvider = _configuration["AI:Provider"] ?? "openai";
            _apiKey = _configuration[$"AI:{_aiProvider}:ApiKey"];
        }

        public async Task<string> AnalyzeTradeCommentAsync(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument = null,
            decimal entryType = 50,
            bool greed = false)
        {
            try
            {
                var prompt = BuildAnalysisPrompt(commentText, tradeSide, tradePL, instrument, entryType, greed);

                string analysis = _aiProvider.ToLower() switch
                {
                    "openai" => await CallOpenAIAsync(prompt),
                    "gemini" => await CallGeminiAsync(prompt),
                    "claude" => await CallClaudeAsync(prompt),
                    "local" => GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed),
                    _ => GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed)
                };

                return analysis;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao analisar comentário com IA");
                return GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed);
            }
        }

        private string BuildAnalysisPrompt(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed)
        {
            return $@"
            Analise o seguinte comentário de trade no contexto SMC/OTE:
            
            Instrumento: {instrument ?? "TECH100"}
            Direção: {tradeSide}
            P/L: €{tradePL}
            Tipo de Entrada: {(entryType < 30 ? "Impulsiva" : entryType > 70 ? "Operacional" : "Balanceada")}
            Ganância detectada: {(greed ? "Sim" : "Não")}
            
            Comentário do trader: ""{commentText}""
            
            Por favor, forneça:
            1. Análise técnica baseada em SMC
            2. Avaliação da entrada em relação à OTE Zone
            3. Identificação de possíveis estruturas perdidas
            4. Sugestões específicas de melhoria
            5. Gestão de risco recomendada
            
            Responda de forma concisa mas completa, como um mentor SMC.";
        }

        private async Task<string> CallOpenAIAsync(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("API Key OpenAI não configurada");
                return GenerateLocalAnalysis("", "", 0, "", 50, false);
            }

            var request = new
            {
                model = _configuration["AI:openai:Model"] ?? "gpt-4-turbo-preview",
                messages = new[]
                {
                    new { role = "system", content = SMC_OTE_SYSTEM_PROMPT },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7,
                max_tokens = 500
            };

            var json = JsonConvert.SerializeObject(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _httpClient.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                content
            );

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(responseJson);
                return result.choices[0].message.content;
            }

            _logger.LogError($"OpenAI API error: {response.StatusCode}");
            return GenerateLocalAnalysis("", "", 0, "", 50, false);
        }

        private async Task<string> CallGeminiAsync(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("API Key Gemini não configurada");
                return GenerateLocalAnalysis("", "", 0, "", 50, false);
            }

            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = SMC_OTE_SYSTEM_PROMPT + "\n\n" + prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 500
                }
            };

            var json = JsonConvert.SerializeObject(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var model = _configuration["AI:gemini:Model"] ?? "gemini-pro";
            var url = $"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={_apiKey}";

            var response = await _httpClient.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(responseJson);
                return result.candidates[0].content.parts[0].text;
            }

            _logger.LogError($"Gemini API error: {response.StatusCode}");
            return GenerateLocalAnalysis("", "", 0, "", 50, false);
        }

        private async Task<string> CallClaudeAsync(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("API Key Claude não configurada");
                return GenerateLocalAnalysis("", "", 0, "", 50, false);
            }

            var request = new
            {
                model = _configuration["AI:claude:Model"] ?? "claude-3-opus-20240229",
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                system = SMC_OTE_SYSTEM_PROMPT,
                max_tokens = 500,
                temperature = 0.7
            };

            var json = JsonConvert.SerializeObject(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var response = await _httpClient.PostAsync(
                "https://api.anthropic.com/v1/messages",
                content
            );

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(responseJson);
                return result.content[0].text;
            }

            _logger.LogError($"Claude API error: {response.StatusCode}");
            return GenerateLocalAnalysis("", "", 0, "", 50, false);
        }

        private string GenerateLocalAnalysis(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed)
        {
            var analysis = new StringBuilder();

            analysis.AppendLine("📊 **Análise SMC/OTE do Trade:**\n");

            // Análise do resultado
            if (tradePL >= 0)
            {
                analysis.AppendLine($"✅ **Trade vencedor** com P/L de €{tradePL:F2}");
                analysis.AppendLine("• Possível entrada em Order Block válido");
                analysis.AppendLine("• Estrutura de mercado provavelmente respeitada\n");
            }
            else
            {
                analysis.AppendLine($"❌ **Trade perdedor** com P/L de €{tradePL:F2}");
                analysis.AppendLine("• Verifique se houve Break of Structure (BOS) antes da entrada");
                analysis.AppendLine("• Possível entrada fora da OTE Zone (61.8%-78.6%)\n");
            }

            // Análise do tipo de entrada
            if (entryType < 30)
            {
                analysis.AppendLine("⚡ **Entrada Impulsiva Detectada:**");
                analysis.AppendLine("• Alto risco de entrar em FOMO");
                analysis.AppendLine("• Recomendo aguardar retração para Order Block ou FVG");
                analysis.AppendLine("• A OTE Zone oferece melhor R:R\n");
            }
            else if (entryType > 70)
            {
                analysis.AppendLine("⚙️ **Entrada Operacional:**");
                analysis.AppendLine("• Boa disciplina aguardando setup completo");
                analysis.AppendLine("• Continue focando em confluências (OB + FVG + OTE)");
                analysis.AppendLine("• Considere time frames maiores para contexto\n");
            }

            // Análise de ganância
            if (greed)
            {
                analysis.AppendLine("⚠️ **Padrão de Ganância Identificado:**");
                analysis.AppendLine("• Provável que tenha movido stop loss prematuramente");
                analysis.AppendLine("• Recomendo usar parciais em níveis fixos (1:1, 1:2, 1:3)");
                analysis.AppendLine("• Proteja capital movendo SL para BE após 1:1\n");
            }

            // Recomendações SMC específicas
            analysis.AppendLine("🎯 **Recomendações SMC/OTE:**");

            if (tradeSide.ToLower() == "buy")
            {
                analysis.AppendLine("• Para COMPRAS: Procure Bullish Order Blocks em suporte");
                analysis.AppendLine("• Aguarde teste de FVG antes de entrar");
                analysis.AppendLine("• Stop Loss abaixo do último swing low");
            }
            else
            {
                analysis.AppendLine("• Para VENDAS: Identifique Bearish Order Blocks em resistência");
                analysis.AppendLine("• Confirme mudança de estrutura (CHoCH) antes");
                analysis.AppendLine("• Stop Loss acima do último swing high");
            }

            analysis.AppendLine("\n📈 **Próximos Passos:**");
            analysis.AppendLine("1. Marque todos os Order Blocks no gráfico");
            analysis.AppendLine("2. Identifique a OTE Zone (61.8%-78.6% Fib)");
            analysis.AppendLine("3. Aguarde confluência de pelo menos 3 fatores");
            analysis.AppendLine("4. Use no máximo 1% de risco por trade");

            // Análise do comentário do usuário
            if (!string.IsNullOrWhiteSpace(commentText))
            {
                analysis.AppendLine($"\n💭 **Sobre seu comentário:**");

                if (commentText.ToLower().Contains("volume"))
                {
                    analysis.AppendLine("• Excelente observação sobre volume!");
                    analysis.AppendLine("• Volume confirma movimentos institucionais (Smart Money)");
                }

                if (commentText.ToLower().Contains("resistência") || commentText.ToLower().Contains("suporte"))
                {
                    analysis.AppendLine("• Boa identificação de S/R");
                    analysis.AppendLine("• Confirme se são Order Blocks ou apenas retail S/R");
                }

                if (commentText.ToLower().Contains("divergência"))
                {
                    analysis.AppendLine("• Divergências são úteis, mas confirme com estrutura");
                    analysis.AppendLine("• SMC prioriza price action sobre indicadores");
                }
            }

            return analysis.ToString();
        }
    }
}