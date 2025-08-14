using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace TradingNoteX.Models.Entities
{
    public class Account
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjectId { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("name")]
        public string Name { get; set; }

        [BsonElement("broker")]
        public string Broker { get; set; }

        [BsonElement("accountType")]
        public string AccountType { get; set; } // "demo", "real", "prop"

        [BsonElement("currency")]
        public string Currency { get; set; } = "EUR";

        [BsonElement("balance")]
        public decimal Balance { get; set; } = 0;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("notes")]
        public string Notes { get; set; }

        [BsonElement("ownerId")]
        public string OwnerId { get; set; }

        [BsonElement("acl")]
        public Dictionary<string, ACLPermission> ACL { get; set; }

        // Estatísticas agregadas (calculadas)
        [BsonIgnore]
        public int TotalTrades { get; set; }

        [BsonIgnore]
        public decimal TotalPL { get; set; }

        [BsonIgnore]
        public decimal WinRate { get; set; }
    }
}