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
        
        [BsonElement("acl")]
        public Dictionary<string, ACLPermission> ACL { get; set; }
        
        // Novos campos para Trading Detail
        [BsonElement("entryType")]
        public decimal EntryType { get; set; } = 50; // 0-100 (impulso vs operacional)
        
        [BsonElement("greed")]
        public bool Greed { get; set; } = false;
        
        [BsonElement("youtubeLink")]
        public string YoutubeLink { get; set; }
        
        [BsonElement("comments")]
        public List<Comment> Comments { get; set; } = new List<Comment>();
        
        [BsonElement("dailyGoalReached")]
        public bool DailyGoalReached { get; set; } = false;
        
        [BsonElement("dailyLossReached")]
        public bool DailyLossReached { get; set; } = false;
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
        public string Screenshot { get; set; } // base64 ou URL
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("aiAnalysis")]
        public string AiAnalysis { get; set; }
    }
}
