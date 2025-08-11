using System.Collections.Generic;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;

namespace TradingNoteX.Services.Interfaces
{
    public interface IImportService
    {
        Task<ImportTradesResponse> ImportTradesAsync(ImportTradesRequest request, string userId);
        Task<List<Import>> GetImportsAsync(string userId);
        Task<Import> GetImportByIdAsync(string importId, string userId);
        Task<bool> DeleteImportAsync(string importId, string userId);
    }
}
