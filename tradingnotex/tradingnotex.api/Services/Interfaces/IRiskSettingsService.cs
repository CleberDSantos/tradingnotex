using System.Threading.Tasks;
using TradingNoteX.Models.Entities;

namespace TradingNoteX.Services.Interfaces
{
    public interface IRiskSettingsService
    {
        Task<RiskSettings> GetRiskSettingsAsync(string userId);
        Task<RiskSettings> SaveRiskSettingsAsync(RiskSettings settings, string userId);
        Task<RiskSettings> UpdateRiskSettingsAsync(string settingsId, RiskSettings settings, string userId);
    }
}
