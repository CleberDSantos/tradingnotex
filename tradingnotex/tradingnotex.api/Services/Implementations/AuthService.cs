using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using BCrypt.Net;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IMongoCollection<User> _users;
        
        public AuthService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _users = database.GetCollection<User>(settings.Value.UsersCollection);
        }
        
        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _users.Find(u => u.Username == request.Username)
                .FirstOrDefaultAsync();
            
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }
            
            user.SessionToken = Guid.NewGuid().ToString();
            user.UpdatedAt = DateTime.UtcNow;
            
            await _users.ReplaceOneAsync(u => u.ObjectId == user.ObjectId, user);
            
            return new LoginResponse
            {
                ObjectId = user.ObjectId,
                SessionToken = user.SessionToken,
                Username = user.Username
            };
        }
        
        public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
        {
            var existing = await _users.Find(u => u.Username == request.Username)
                .FirstOrDefaultAsync();
            
            if (existing != null)
            {
                throw new InvalidOperationException("Username already exists");
            }
            
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                SessionToken = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _users.InsertOneAsync(user);
            
            return new LoginResponse
            {
                ObjectId = user.ObjectId,
                SessionToken = user.SessionToken,
                Username = user.Username
            };
        }
        
        public async Task LogoutAsync(string sessionToken)
        {
            var filter = Builders<User>.Filter.Eq(u => u.SessionToken, sessionToken);
            var update = Builders<User>.Update
                .Set(u => u.SessionToken, null)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);
            
            await _users.UpdateOneAsync(filter, update);
        }
        
        public async Task<string> ValidateSessionAsync(string sessionToken)
        {
            var user = await _users.Find(u => u.SessionToken == sessionToken)
                .FirstOrDefaultAsync();
            
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid session");
            }
            
            return user.ObjectId;
        }
    }
}
