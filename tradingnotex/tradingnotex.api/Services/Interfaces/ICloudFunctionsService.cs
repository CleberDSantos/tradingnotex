using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;

namespace TradingNoteX.Services.Interfaces
{
    public interface ICloudFunctionsService
    {
        Task<OptimizePartialsResponse> OptimizePartialsAsync(OptimizePartialsRequest request);
        Task<GeneratePartialPlanResponse> GeneratePartialPlanAsync(GeneratePartialPlanRequest request);
        Task<EvaluateRiskDayResponse> EvaluateRiskDayAsync(EvaluateRiskDayRequest request, string userId);
        Task<EvaluateRiskRangeResponse> EvaluateRiskRangeAsync(EvaluateRiskRangeRequest request, string userId);
    }
}
