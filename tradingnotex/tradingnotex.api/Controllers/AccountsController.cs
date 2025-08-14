using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Controllers
{
    [ApiController]
    [Route("api/classes/Account")]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IAuthService _authService;

        public AccountsController(IAccountService accountService, IAuthService authService)
        {
            _accountService = accountService;
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
        public async Task<IActionResult> GetAccounts([FromQuery] AccountFilterRequest filter)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var accounts = await _accountService.GetAccountsAsync(userId, filter);
                return Ok(new { results = accounts });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("{objectId}")]
        public async Task<IActionResult> GetAccount(string objectId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var account = await _accountService.GetAccountByIdAsync(objectId, userId);

                if (account == null)
                {
                    return NotFound(new { message = "Conta não encontrada" });
                }

                return Ok(account);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Nome da conta é obrigatório" });
                }

                var account = await _accountService.CreateAccountAsync(request, userId);
                return Created($"/api/classes/Account/{account.ObjectId}", account);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{objectId}")]
        public async Task<IActionResult> UpdateAccount(string objectId, [FromBody] UpdateAccountRequest request)
        {
            try
            {
                var userId = await GetUserIdAsync();

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Nome da conta é obrigatório" });
                }

                var account = await _accountService.UpdateAccountAsync(objectId, request, userId);

                if (account == null)
                {
                    return NotFound(new { message = "Conta não encontrada" });
                }

                return Ok(account);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpDelete("{objectId}")]
        public async Task<IActionResult> DeleteAccount(string objectId)
        {
            try
            {
                var userId = await GetUserIdAsync();
                var deleted = await _accountService.DeleteAccountAsync(objectId, userId);

                if (!deleted)
                {
                    return NotFound(new { message = "Conta não encontrada" });
                }

                return Ok(new { deleted = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}