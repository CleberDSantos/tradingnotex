namespace TradingNoteX.Models.Settings
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
        public string TradesCollection { get; set; } = "Trades";
        public string ImportsCollection { get; set; } = "Imports";
        public string RiskSettingsCollection { get; set; } = "RiskSettings";
        public string UsersCollection { get; set; } = "Users";

        public string AccountsCollection { get; set; } = "Accounts";
    }
}
