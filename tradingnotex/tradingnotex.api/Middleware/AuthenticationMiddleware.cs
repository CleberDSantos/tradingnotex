using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace TradingNoteX.Middleware
{
    public class AuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        
        public AuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        
        public async Task Invoke(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            
            if (endpoint != null)
            {
                var allowAnonymous = endpoint.Metadata.GetMetadata<AllowAnonymousAttribute>();
                
                if (allowAnonymous == null)
                {
                    var sessionToken = context.Request.Headers["X-Parse-Session-Token"].FirstOrDefault();
                    
                    if (string.IsNullOrEmpty(sessionToken))
                    {
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsJsonAsync(new { message = "Session token required" });
                        return;
                    }
                }
            }
            
            await _next(context);
        }
    }
}
