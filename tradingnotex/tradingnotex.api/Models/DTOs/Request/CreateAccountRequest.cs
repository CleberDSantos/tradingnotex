namespace TradingNoteX.Models.DTOs.Request
{
    public class CreateAccountRequest
    {
        public string Name { get; set; }
        public string Broker { get; set; }
        public string AccountType { get; set; } = "real"; // "demo", "real", "prop"
        public string Currency { get; set; } = "EUR";
        public decimal Balance { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string Notes { get; set; }
    }

    public class UpdateAccountRequest
    {
        public string Name { get; set; }
        public string Broker { get; set; }
        public string AccountType { get; set; }
        public string Currency { get; set; }
        public decimal Balance { get; set; }
        public bool IsActive { get; set; }
        public string Notes { get; set; }
    }

    public class AccountFilterRequest
    {
        public bool? IsActive { get; set; }
        public string AccountType { get; set; }
        public string OrderBy { get; set; } = "-createdAt";
        public int Limit { get; set; } = 100;
        public int Skip { get; set; } = 0;
    }
}

