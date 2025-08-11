using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var response = await _authService.RegisterAsync(request);
                return Created($"/api/users/{response.ObjectId}", response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var sessionToken = Request.Headers["X-Parse-Session-Token"].FirstOrDefault();
            if (string.IsNullOrEmpty(sessionToken))
            {
                return BadRequest(new { message = "Session token required" });
            }
            
            await _authService.LogoutAsync(sessionToken);
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
