using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;

namespace TradingNoteX.Services.Interfaces
{
    public interface ITradeService
    {
        Task<List<Trade>> GetTradesAsync(string userId, TradeFilterRequest filter);
        Task<Trade> GetTradeByIdAsync(string tradeId, string userId);
        Task<Trade> CreateTradeAsync(Trade trade, string userId);
        Task<Trade> UpdateTradeAsync(string tradeId, Trade trade, string userId);
        Task<bool> DeleteTradeAsync(string tradeId, string userId);
        Task<KPIsResponse> GetKPIsAsync(string userId, DateTime? startDate, DateTime? endDate);
        Task<HourlyHeatmapResponse> GetHourlyHeatmapAsync(string userId);
        Task<List<string>> GetInsightsAsync(string userId);
        
        // Novos métodos para Trading Detail
        Task<Trade> UpdateTradeDetailsAsync(string tradeId, string userId, UpdateTradeDetailsRequest request);
        Task<Comment> AddCommentAsync(string tradeId, string userId, AddCommentRequest request);
        Task<Comment> AnalyzeCommentAsync(string tradeId, string userId, string commentId);
        Task<List<Comment>> GetCommentsAsync(string tradeId, string userId);
        Task<bool> DeleteCommentAsync(string tradeId, string userId, string commentId);
    }
}
