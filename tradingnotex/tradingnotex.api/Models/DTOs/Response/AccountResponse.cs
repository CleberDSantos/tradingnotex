namespace TradingNoteX.Models.DTOs.Response
{
    public class AccountResponse
    {
        public string ObjectId { get; set; }
        public string Name { get; set; }
        public string Broker { get; set; }
        public string AccountType { get; set; }
        public string Currency { get; set; }
        public decimal Balance { get; set; }
        public bool IsActive { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Estatísticas
        public int TotalTrades { get; set; }
        public decimal TotalPL { get; set; }
        public decimal WinRate { get; set; }
    }
}