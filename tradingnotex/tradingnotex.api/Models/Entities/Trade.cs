using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace TradingNoteX.Models.Entities
{
    public class Trade
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjectId { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("executedAtUTC")]
        public DateTime ExecutedAtUTC { get; set; }

        [BsonElement("instrument")]
        public string Instrument { get; set; }

        [BsonElement("side")]
        public string Side { get; set; } // buy/sell

        [BsonElement("realizedPLEUR")]
        public decimal RealizedPLEUR { get; set; }

        [BsonElement("durationMin")]
        public int? DurationMin { get; set; }

        [BsonElement("setup")]
        public string Setup { get; set; } = "SMC";

        [BsonElement("emotion")]
        public TradeEmotion Emotion { get; set; }

        [BsonElement("notes")]
        public string Notes { get; set; }

        [BsonElement("tags")]
        public List<string> Tags { get; set; } = new List<string>();

        [BsonElement("importId")]
        public string ImportId { get; set; }

        [BsonElement("ownerId")]
        public string OwnerId { get; set; }

        // NOVO CAMPO: Associação com conta
        [BsonElement("accountId")]
        public string AccountId { get; set; }

        [BsonElement("acl")]
        public Dictionary<string, ACLPermission> ACL { get; set; }

        // Preços e custos
        [BsonElement("openPrice")]
        public decimal? OpenPrice { get; set; }

        [BsonElement("execPrice")]
        public decimal? ExecPrice { get; set; }

        [BsonElement("stopPrice")]
        public decimal? StopPrice { get; set; }

        [BsonElement("targetPrice")]
        public decimal? TargetPrice { get; set; }

        [BsonElement("spread")]
        public decimal? Spread { get; set; }

        [BsonElement("otherFees")]
        public decimal? OtherFees { get; set; }

        // Comportamento e análise
        [BsonElement("entryType")]
        public decimal EntryType { get; set; } = 50; // 0-100 (impulso vs operacional)

        [BsonElement("greed")]
        public bool Greed { get; set; } = false;

        [BsonElement("youtubeLink")]
        public string YoutubeLink { get; set; }

        [BsonElement("comments")]
        public List<Comment> Comments { get; set; } = new List<Comment>();

        // Status diário
        [BsonElement("dailyGoalReached")]
        public bool DailyGoalReached { get; set; } = false;

        [BsonElement("dailyLossReached")]
        public bool DailyLossReached { get; set; } = false;

        // Status do trade
        [BsonElement("tradeStatus")]
        public string TradeStatus { get; set; } // "winner", "loser", "protection"

        // Screenshots do gráfico
        [BsonElement("chartScreenshots")]
        public List<ChartScreenshot> ChartScreenshots { get; set; } = new List<ChartScreenshot>();
    }

    public class TradeEmotion
    {
        [BsonElement("mood")]
        public string Mood { get; set; }

        [BsonElement("arousal")]
        public string Arousal { get; set; }
    }

    public class ACLPermission
    {
        [BsonElement("read")]
        public bool Read { get; set; }

        [BsonElement("write")]
        public bool Write { get; set; }
    }

    public class Comment
    {
        [BsonElement("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("author")]
        public string Author { get; set; }

        [BsonElement("text")]
        public string Text { get; set; }

        [BsonElement("screenshot")]
        public string Screenshot { get; set; }

        [BsonElement("attachments")]
        public List<CommentAttachment> Attachments { get; set; } = new List<CommentAttachment>();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("aiAnalysis")]
        public string AiAnalysis { get; set; }

        [BsonElement("aiAnalysisRendered")]
        public AiAnalysisResponse AiAnalysisRendered { get; set; }
    }

    public class CommentAttachment
    {
        [BsonElement("type")]
        public string Type { get; set; } // "image" ou "file"

        [BsonElement("data")]
        public string Data { get; set; } // Base64 ou URL

        [BsonElement("filename")]
        public string Filename { get; set; }

        [BsonElement("size")]
        public long Size { get; set; }

        [BsonElement("mimeType")]
        public string MimeType { get; set; }
    }

    public class AiAnalysisResponse
    {
        [BsonElement("author")]
        public string Author { get; set; } = "🤖 Assistente IA";

        [BsonElement("badge")]
        public string Badge { get; set; } = "Análise";

        [BsonElement("text")]
        public string Text { get; set; }

        [BsonElement("timestamp")]
        public string Timestamp { get; set; } = "Agora";

        [BsonElement("avatarType")]
        public string AvatarType { get; set; } = "ai";
    }

    public class ChartScreenshot
    {
        [BsonElement("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("timeframe")]
        public string Timeframe { get; set; } // "15m", "1h", etc

        [BsonElement("imageData")]
        public string ImageData { get; set; } // Base64

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("notes")]
        public string Notes { get; set; }
    }
}