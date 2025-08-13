using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using TradingNoteX.Models.Entities;
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
        8. Se houver screenshots/imagens, analise os gráficos identificando padrões SMC
        
        Mantenha um tom profissional mas acessível, como um mentor experiente.
        Suas respostas devem ser concisas mas completas, focadas em valor prático.";

        public AIAnalysisService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<AIAnalysisService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            _aiProvider = _configuration["AI:Provider"] ?? "openai";
            _apiKey = _configuration[$"AI:{_aiProvider}:ApiKey"];
        }

        public async Task<string> AnalyzeTradeCommentAsync(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument = null,
            decimal entryType = 50,
            bool greed = false,
            List<CommentAttachment> attachments = null)
        {
            try
            {
                var formattedAnalysis = await GenerateFormattedAnalysis(
                    commentText, tradeSide, tradePL, instrument, entryType, greed, attachments);

                return formattedAnalysis.Text;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao analisar comentário com IA");
                return GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed, attachments?.Count ?? 0);
            }
        }

        public async Task<AiAnalysisResponse> GenerateFormattedAnalysis(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed,
            List<CommentAttachment> attachments)
        {
            try
            {
                var prompt = BuildAnalysisPrompt(commentText, tradeSide, tradePL, instrument, entryType, greed, attachments);

                string analysisText = _aiProvider.ToLower() switch
                {
                    "openai" => await CallOpenAIWithImagesAsync(prompt, attachments),
                    "gemini" => await CallGeminiWithImagesAsync(prompt, attachments),
                    "claude" => await CallClaudeWithImagesAsync(prompt, attachments),
                    _ => GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed, attachments?.Count ?? 0)
                };

                return new AiAnalysisResponse
                {
                    Author = "🤖 Assistente IA",
                    Badge = "Análise",
                    Text = analysisText,
                    Timestamp = "Agora",
                    AvatarType = "ai"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar análise formatada");

                return new AiAnalysisResponse
                {
                    Author = "🤖 Assistente IA",
                    Badge = "Análise",
                    Text = GenerateLocalAnalysis(commentText, tradeSide, tradePL, instrument, entryType, greed, attachments?.Count ?? 0),
                    Timestamp = "Agora",
                    AvatarType = "ai"
                };
            }
        }

        private string BuildAnalysisPrompt(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed,
            List<CommentAttachment> attachments)
        {
            var hasImages = attachments?.Any(a => a.Type == "image") ?? false;

            return $@"
            Analise o seguinte comentário de trade no contexto SMC/OTE:
            
            Instrumento: {instrument ?? "TECH100"}
            Direção: {tradeSide}
            P/L: €{tradePL}
            Tipo de Entrada: {(entryType < 30 ? "Impulsiva" : entryType > 70 ? "Operacional" : "Balanceada")}
            Ganância detectada: {(greed ? "Sim" : "Não")}
            {(hasImages ? $"Imagens anexadas: {attachments.Count(a => a.Type == "image")} screenshots" : "")}
            
            Comentário do trader: ""{commentText}""
            
            {(hasImages ? @"
            Analise também as imagens anexadas identificando:
            - Order Blocks visíveis
            - Fair Value Gaps (FVGs)
            - Estrutura de mercado (HH/HL ou LL/LH)
            - Zonas Premium/Discount
            - Possíveis inducements ou stop hunts" : "")}
            
            Forneça uma análise CONCISA mas COMPLETA incluindo:
            1. Avaliação técnica baseada em SMC (máximo 2 frases)
            2. Identificação de melhorias específicas (máximo 2 sugestões)
            3. Gestão de risco recomendada (1 frase)
            {(hasImages ? "4. Observações sobre os gráficos anexados (máximo 2 frases)" : "")}
            
            Mantenha um tom de mentor experiente. Use emojis apropriados (🎯, ✅, ⚠️, 💡).
            Responda de forma direta e prática, sem introduções desnecessárias. 
            quero uma resposta curta e formatada com quebras de linhas de no maximo 1000 caracteres, não responda nada fora do escopo de trading";
        }

        private async Task<string> CallOpenAIWithImagesAsync(string prompt, List<CommentAttachment> attachments)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogWarning("API Key OpenAI não configurada");
                return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
            }

            // Preparar mensagens para o chat completions
                    var messages = new List<object>
            {
                new { role = "system", content = SMC_OTE_SYSTEM_PROMPT }
            };

            // Construir conteúdo do usuário com prompt e referências a imagens
            var userContentParts = new List<string> { prompt };

            if (attachments != null)
            {
                foreach (var att in attachments.Where(a => a.Type == "image"))
                {
                    var url = att.Data;

                    // Se vier apenas base64 cru, opcionalmente prefixar data URL
                    if (!string.IsNullOrWhiteSpace(url) &&
                        !url.StartsWith("http", StringComparison.OrdinalIgnoreCase) &&
                        !url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    {
                        var mime = string.IsNullOrWhiteSpace(att.MimeType) ? "image/png" : att.MimeType;
                        url = $"data:{mime};base64,{url}";
                    }

                    if (!string.IsNullOrWhiteSpace(url))
                    {
                        userContentParts.Add($"Imagem: {url}");
                    }
                }
            }

            var userContent = string.Join(Environment.NewLine, userContentParts);
            messages.Add(new { role = "user", content = userContent });

            // Modelo a usar (default gpt-5-nano)
            var model = _configuration["AI:openai:Model"] ?? "gpt-5-nano";

            // Corpo da API de chat completions
            var body = new
            {
                model,
                messages,
                reasoning_effort = "minimal"

            };

            string payload;
            try
            {
                var json = JsonConvert.SerializeObject(body);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

                // Endpoint da API de chat completions
                using var resp = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
                payload = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                {
                    _logger.LogError("OpenAI {Status}: {Body}", resp.StatusCode, payload);
                    return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
                }

                dynamic result = JsonConvert.DeserializeObject(payload);
                // Obter o conteúdo da primeira escolha
                string answer = (string)(result?.choices?[0]?.message?.content ?? "");

                // Em caso de ausência de conteúdo, tentar fallback
                if (string.IsNullOrWhiteSpace(answer))
                {
                    answer = (string)(result?.choices?[0]?.text ?? "");
                }

                return answer;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao chamar OpenAI");
                return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
            }
        }


        private async Task<string> CallGeminiWithImagesAsync(string prompt, List<CommentAttachment> attachments)
        {
            // Implementação similar para Gemini com suporte a imagens
            // Gemini suporta imagens através do modelo gemini-pro-vision

            if (string.IsNullOrEmpty(_apiKey))
            {
                return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
            }

            var parts = new List<object> { new { text = SMC_OTE_SYSTEM_PROMPT + "\n\n" + prompt } };

            if (attachments != null)
            {
                foreach (var attachment in attachments.Where(a => a.Type == "image"))
                {
                    // Extrair apenas o base64 se for data URL
                    var base64Data = attachment.Data;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }

                    parts.Add(new
                    {
                        inline_data = new
                        {
                            mime_type = attachment.MimeType ?? "image/png",
                            data = base64Data
                        }
                    });
                }
            }

            var request = new
            {
                contents = new[]
                {
                    new { parts = parts }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 600
                }
            };

            var json = JsonConvert.SerializeObject(request);
            var contentBody = new StringContent(json, Encoding.UTF8, "application/json");

            var model = attachments?.Any(a => a.Type == "image") == true
                ? "gemini-pro-vision"
                : "gemini-pro";

            var url = $"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={_apiKey}";

            var response = await _httpClient.PostAsync(url, contentBody);

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(responseJson);
                return result.candidates[0].content.parts[0].text;
            }

            return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
        }

        private async Task<string> CallClaudeWithImagesAsync(string prompt, List<CommentAttachment> attachments)
        {
            // Claude 3 suporta imagens nativamente
            if (string.IsNullOrEmpty(_apiKey))
            {
                return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
            }

            var messages = new List<object>();
            var messageContent = new List<object> { new { type = "text", text = prompt } };

            if (attachments != null)
            {
                foreach (var attachment in attachments.Where(a => a.Type == "image"))
                {
                    var base64Data = attachment.Data;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }

                    messageContent.Add(new
                    {
                        type = "image",
                        source = new
                        {
                            type = "base64",
                            media_type = attachment.MimeType ?? "image/png",
                            data = base64Data
                        }
                    });
                }
            }

            messages.Add(new { role = "user", content = messageContent });

            var request = new
            {
                model = _configuration["AI:claude:Model"] ?? "claude-3-opus-20240229",
                messages = messages,
                system = SMC_OTE_SYSTEM_PROMPT,
                max_tokens = 600,
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

            return GenerateLocalAnalysis("", "", 0, "", 50, false, attachments?.Count ?? 0);
        }

        private string GenerateLocalAnalysis(
            string commentText,
            string tradeSide,
            decimal tradePL,
            string instrument,
            decimal entryType,
            bool greed,
            int imageCount)
        {
            var analysis = new StringBuilder();

            // Análise principal baseada no resultado
            if (tradePL >= 0)
            {
                analysis.AppendLine($"Sua entrada foi bem fundamentada! 🎯 O resultado positivo de €{tradePL:F2} sugere que você identificou corretamente a estrutura do mercado.");

                if (!string.IsNullOrWhiteSpace(commentText))
                {
                    if (commentText.ToLower().Contains("resistência") || commentText.ToLower().Contains("suporte"))
                    {
                        analysis.AppendLine("O rompimento que você mencionou provavelmente foi um Order Block válido. Continue assim!");
                    }
                    if (commentText.ToLower().Contains("volume"))
                    {
                        analysis.AppendLine("Excelente uso do volume como confluência! No SMC, isso confirma participação institucional.");
                    }
                }
            }
            else
            {
                analysis.AppendLine($"Trade com resultado negativo (€{tradePL:F2}), mas isso faz parte do processo. ⚠️");
                analysis.AppendLine("Para próximas operações, verifique se houve um Change of Character (CHoCH) claro antes da entrada.");
            }

            // Sugestões específicas baseadas no tipo de entrada
            if (entryType < 30)
            {
                analysis.AppendLine("\n💡 Detectei entrada impulsiva. Tente aguardar o preço retornar à OTE Zone (61.8%-78.6% do movimento) para melhor R:R.");
            }
            else if (entryType > 70)
            {
                analysis.AppendLine("\n✅ Boa disciplina operacional! Continue priorizando confluências: Order Block + FVG + OTE Zone.");
            }

            // Análise de ganância
            if (greed)
            {
                analysis.AppendLine("\n⚠️ Padrão de ganância identificado. Use parciais fixas em 1:1, 1:2 e deixe o resto correr com stop no breakeven.");
            }

            // Se há imagens anexadas
            if (imageCount > 0)
            {
                analysis.AppendLine($"\n📊 Vi que você anexou {imageCount} screenshot(s). Para análises futuras, marque sempre: Order Blocks, FVGs e a estrutura de mercado (HH/HL ou LL/LH).");
            }

            // Fechamento motivacional
            analysis.AppendLine($"\nPara o próximo trade em {instrument ?? "TECH100"}: foque em entradas na Premium/Discount zone apropriada para o side. Parabéns pelo registro detalhado! 🚀");

            return analysis.ToString();
        }
    }
}