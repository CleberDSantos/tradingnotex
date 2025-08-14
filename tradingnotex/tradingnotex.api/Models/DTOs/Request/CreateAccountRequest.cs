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
            /// <summary>
            /// Tipo de conta para filtrar (opcional)
            /// </summary>
            public string? AccountType { get; set; }

            /// <summary>
            /// Status da conta (opcional)
            /// </summary>
            public bool? IsActive { get; set; }

            /// <summary>
            /// Moeda da conta (opcional)
            /// </summary>
            public string? Currency { get; set; }

            /// <summary>
            /// Corretora (opcional)
            /// </summary>
            public string? Broker { get; set; }

            /// <summary>
            /// Ordenação dos resultados (opcional)
            /// Exemplo: "name", "-createdAt"
            /// </summary>
            public string? OrderBy { get; set; }

            /// <summary>
            /// Limite de resultados (opcional)
            /// </summary>
            public int? Limit { get; set; }

            /// <summary>
            /// Número de resultados para pular (opcional)
            /// </summary>
            public int? Skip { get; set; }
        }
    
}

