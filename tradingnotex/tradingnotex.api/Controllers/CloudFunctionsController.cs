using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Controllers
{
    [ApiController]
    [Route("api/functions")]
    public class CloudFunctionsController : ControllerBase
    {
        private readonly ICloudFunctionsService _cloudFunctionsService;
        private readonly IImportService _importService;
        private readonly IAuthService _authService;
        
        public CloudFunctionsController(
            ICloudFunctionsService cloudFunctionsService,
            IImportService importService,
            IAuthService authService)
        {
            _cloudFunctionsService = cloudFunctionsService;
            _importService = importService;
            _authService = authService;
        }
        
        private async Task<string> GetUserIdAsync()
        {
            var sessionToken = Request.Headers["X-Parse-Session-Token"].FirstOrDefault();
            if (string.IsNullOrEmpty(sessionToken))
            {
                throw new UnauthorizedAccessException("Session token required");
            }
            return await _authService.ValidateSessionAsync(sessionToken);
        }
        
        [HttpPost("importTrades")]
        public async Task<IActionResult> ImportTrades([FromBody] ImportTradesRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var result = await _importService.ImportTradesAsync(request, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost("optimizePartials")]
        public async Task<IActionResult> OptimizePartials([FromBody] OptimizePartialsRequest request)
        {
            var result = await _cloudFunctionsService.OptimizePartialsAsync(request);
            return Ok(result);
        }
        
        [HttpPost("generatePartialPlan")]
        public async Task<IActionResult> GeneratePartialPlan([FromBody] GeneratePartialPlanRequest request)
        {
            var result = await _cloudFunctionsService.GeneratePartialPlanAsync(request);
            return Ok(result);
        }
        
        [HttpPost("evaluateRiskDay")]
        public async Task<IActionResult> EvaluateRiskDay([FromBody] EvaluateRiskDayRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var result = await _cloudFunctionsService.EvaluateRiskDayAsync(request, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost("evaluateRiskRange")]
        public async Task<IActionResult> EvaluateRiskRange([FromBody] EvaluateRiskRangeRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var result = await _cloudFunctionsService.EvaluateRiskRangeAsync(request, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
