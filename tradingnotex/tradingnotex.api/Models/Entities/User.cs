using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TradingNoteX.Models.Entities
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjectId { get; set; }
        
        [BsonElement("username")]
        public string Username { get; set; }
        
        [BsonElement("email")]
        public string Email { get; set; }
        
        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; }
        
        [BsonElement("sessionToken")]
        public string SessionToken { get; set; }
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
