using System.Collections.Generic;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;

namespace TradingNoteX.Services.Interfaces
{
    public interface IAccountService
    {
        Task<List<AccountResponse>> GetAccountsAsync(string userId, AccountFilterRequest filter);
        Task<AccountResponse> GetAccountByIdAsync(string accountId, string userId);
        Task<AccountResponse> CreateAccountAsync(CreateAccountRequest request, string userId);
        Task<AccountResponse> UpdateAccountAsync(string accountId, UpdateAccountRequest request, string userId);
        Task<bool> DeleteAccountAsync(string accountId, string userId);
        Task<bool> AccountExistsAsync(string accountId, string userId);
        Task<Dictionary<string, AccountResponse>> GetAccountsDictionaryAsync(string userId);
    }
}