using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;

namespace TradingNoteX.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<LoginResponse> RegisterAsync(RegisterRequest request);
        Task LogoutAsync(string sessionToken);
        Task<string> ValidateSessionAsync(string sessionToken);
    }
}
