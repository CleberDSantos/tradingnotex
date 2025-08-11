using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Controllers
{
    [ApiController]
    [Route("api/classes/Trade")]
    public class TradesController : ControllerBase
    {
        private readonly ITradeService _tradeService;
        private readonly IAuthService _authService;
        
        public TradesController(ITradeService tradeService, IAuthService authService)
        {
            _tradeService = tradeService;
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
        
        [HttpGet]
        public async Task<IActionResult> GetTrades([FromQuery] TradeFilterRequest filter)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var trades = await _tradeService.GetTradesAsync(userId, filter);
                return Ok(new { results = trades });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("{objectId}")]
        public async Task<IActionResult> GetTrade(string objectId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var trade = await _tradeService.GetTradeByIdAsync(objectId, userId);
                
                if (trade == null)
                {
                    return NotFound();
                }
                
                return Ok(trade);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost]
        public async Task<IActionResult> CreateTrade([FromBody] Trade trade)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var created = await _tradeService.CreateTradeAsync(trade, userId);
                return Created($"/api/classes/Trade/{created.ObjectId}", created);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPut("{objectId}")]
        public async Task<IActionResult> UpdateTrade(string objectId, [FromBody] Trade trade)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var updated = await _tradeService.UpdateTradeAsync(objectId, trade, userId);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPut("{objectId}/details")]
        public async Task<IActionResult> UpdateTradeDetails(string objectId, [FromBody] UpdateTradeDetailsRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var updated = await _tradeService.UpdateTradeDetailsAsync(objectId, userId, request);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpDelete("{objectId}")]
        public async Task<IActionResult> DeleteTrade(string objectId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var deleted = await _tradeService.DeleteTradeAsync(objectId, userId);
                
                if (!deleted)
                {
                    return NotFound();
                }
                
                return Ok(new { deleted = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("{objectId}/comments")]
        public async Task<IActionResult> GetComments(string objectId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var comments = await _tradeService.GetCommentsAsync(objectId, userId);
                return Ok(comments);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost("{objectId}/comments")]
        public async Task<IActionResult> AddComment(string objectId, [FromBody] AddCommentRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var comment = await _tradeService.AddCommentAsync(objectId, userId, request);
                return Created($"/api/classes/Trade/{objectId}/comments/{comment.Id}", comment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost("{objectId}/comments/{commentId}/analyze")]
        public async Task<IActionResult> AnalyzeComment(string objectId, string commentId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var comment = await _tradeService.AnalyzeCommentAsync(objectId, userId, commentId);
                return Ok(comment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        
        [HttpDelete("{objectId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(string objectId, string commentId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var deleted = await _tradeService.DeleteCommentAsync(objectId, userId, commentId);
                
                if (!deleted)
                {
                    return NotFound();
                }
                
                return Ok(new { deleted = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("kpis")]
        public async Task<IActionResult> GetKPIs([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var kpis = await _tradeService.GetKPIsAsync(userId, startDate, endDate);
                return Ok(kpis);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("heatmap")]
        public async Task<IActionResult> GetHourlyHeatmap()
        {
            try
            {
                var userId = await GetUserIdAsync();
                var heatmap = await _tradeService.GetHourlyHeatmapAsync(userId);
                return Ok(heatmap);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("insights")]
        public async Task<IActionResult> GetInsights()
        {
            try
            {
                var userId = await GetUserIdAsync();
                var insights = await _tradeService.GetInsightsAsync(userId);
                return Ok(insights);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
