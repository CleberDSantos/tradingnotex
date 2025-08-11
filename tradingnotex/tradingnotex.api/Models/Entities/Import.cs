using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace TradingNoteX.Models.Entities
{
    public class Import
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
        
        [BsonElement("statementDate")]
        public DateTime? StatementDate { get; set; }
        
        [BsonElement("source")]
        public string Source { get; set; } = "t212";
        
        [BsonElement("count")]
        public int Count { get; set; }
        
        [BsonElement("ownerId")]
        public string OwnerId { get; set; }
        
        [BsonElement("acl")]
        public Dictionary<string, ACLPermission> ACL { get; set; }
    }
}
