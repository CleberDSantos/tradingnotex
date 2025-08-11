using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace TradingNoteX.Models.Entities
{
    public class RiskSettings
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjectId { get; set; }
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("ownerId")]
        public string OwnerId { get; set; }
        
        [BsonElement("goalEUR")]
        public decimal GoalEUR { get; set; } = 2.0m;
        
        [BsonElement("maxLossEUR")]
        public decimal MaxLossEUR { get; set; } = 2.0m;
        
        [BsonElement("acl")]
        public Dictionary<string, ACLPermission> ACL { get; set; }
    }
}
