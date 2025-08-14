using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TradingNoteX.Models.DTOs.Request;
using TradingNoteX.Models.DTOs.Response;
using TradingNoteX.Models.Entities;
using TradingNoteX.Models.Settings;
using TradingNoteX.Services.Interfaces;

namespace TradingNoteX.Services.Implementations
{
    public class AccountService : IAccountService
    {
        private readonly IMongoCollection<Account> _accounts;
        private readonly IMongoCollection<Trade> _trades;

        public AccountService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _accounts = database.GetCollection<Account>("Accounts");
            _trades = database.GetCollection<Trade>(settings.Value.TradesCollection);

            // Criar índices
            CreateIndexes();
        }

        private void CreateIndexes()
        {
            _accounts.Indexes.CreateOne(new CreateIndexModel<Account>(
                Builders<Account>.IndexKeys.Ascending(a => a.OwnerId)
            ));

            _accounts.Indexes.CreateOne(new CreateIndexModel<Account>(
                Builders<Account>.IndexKeys
                    .Ascending(a => a.OwnerId)
                    .Ascending(a => a.Name)
            ));
        }

        public async Task<List<AccountResponse>> GetAccountsAsync(string userId, AccountFilterRequest filter)
        {
            var filterBuilder = Builders<Account>.Filter;
            var filters = new List<FilterDefinition<Account>>
            {
                filterBuilder.Eq(a => a.OwnerId, userId)
            };

            if (filter.IsActive.HasValue)
            {
                filters.Add(filterBuilder.Eq(a => a.IsActive, filter.IsActive.Value));
            }

            if (!string.IsNullOrEmpty(filter.AccountType))
            {
                filters.Add(filterBuilder.Eq(a => a.AccountType, filter.AccountType));
            }

            var combinedFilter = filterBuilder.And(filters);

            var sortDirection = filter.OrderBy.StartsWith("-") ? -1 : 1;
            var sortField = filter.OrderBy.TrimStart('-');
            var sort = sortDirection == -1
                ? Builders<Account>.Sort.Descending(sortField)
                : Builders<Account>.Sort.Ascending(sortField);

            var accounts = await _accounts.Find(combinedFilter)
                .Sort(sort)
                .Skip(filter.Skip)
                .Limit(filter.Limit)
                .ToListAsync();

            // Calcular estatísticas para cada conta
            var responses = new List<AccountResponse>();
            foreach (var account in accounts)
            {
                var response = MapToResponse(account);
                await CalculateAccountStatistics(response, userId);
                responses.Add(response);
            }

            return responses;
        }

        public async Task<AccountResponse> GetAccountByIdAsync(string accountId, string userId)
        {
            var filter = Builders<Account>.Filter.And(
                Builders<Account>.Filter.Eq(a => a.ObjectId, accountId),
                Builders<Account>.Filter.Eq(a => a.OwnerId, userId)
            );

            var account = await _accounts.Find(filter).FirstOrDefaultAsync();

            if (account == null)
                return null;

            var response = MapToResponse(account);
            await CalculateAccountStatistics(response, userId);

            return response;
        }

        public async Task<AccountResponse> CreateAccountAsync(CreateAccountRequest request, string userId)
        {
            // Verificar se já existe uma conta com o mesmo nome
            var existingFilter = Builders<Account>.Filter.And(
                Builders<Account>.Filter.Eq(a => a.OwnerId, userId),
                Builders<Account>.Filter.Eq(a => a.Name, request.Name)
            );

            var existing = await _accounts.Find(existingFilter).FirstOrDefaultAsync();
            if (existing != null)
            {
                throw new InvalidOperationException($"Já existe uma conta com o nome '{request.Name}'");
            }

            var account = new Account
            {
                Name = request.Name,
                Broker = request.Broker,
                AccountType = request.AccountType,
                Currency = request.Currency,
                Balance = request.Balance,
                IsActive = request.IsActive,
                Notes = request.Notes,
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ACL = new Dictionary<string, ACLPermission>
                {
                    { userId, new ACLPermission { Read = true, Write = true } }
                }
            };

            await _accounts.InsertOneAsync(account);

            return MapToResponse(account);
        }

        public async Task<AccountResponse> UpdateAccountAsync(string accountId, UpdateAccountRequest request, string userId)
        {
            var filter = Builders<Account>.Filter.And(
                Builders<Account>.Filter.Eq(a => a.ObjectId, accountId),
                Builders<Account>.Filter.Eq(a => a.OwnerId, userId)
            );

            var update = Builders<Account>.Update
                .Set(a => a.Name, request.Name)
                .Set(a => a.Broker, request.Broker)
                .Set(a => a.AccountType, request.AccountType)
                .Set(a => a.Currency, request.Currency)
                .Set(a => a.Balance, request.Balance)
                .Set(a => a.IsActive, request.IsActive)
                .Set(a => a.Notes, request.Notes)
                .Set(a => a.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<Account>
            {
                ReturnDocument = ReturnDocument.After
            };

            var updatedAccount = await _accounts.FindOneAndUpdateAsync(filter, update, options);

            if (updatedAccount == null)
                return null;

            var response = MapToResponse(updatedAccount);
            await CalculateAccountStatistics(response, userId);

            return response;
        }

        public async Task<bool> DeleteAccountAsync(string accountId, string userId)
        {
            // Verificar se existem trades associados
            var tradesFilter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId),
                Builders<Trade>.Filter.Eq(t => t.AccountId, accountId)
            );

            var tradesCount = await _trades.CountDocumentsAsync(tradesFilter);

            if (tradesCount > 0)
            {
                throw new InvalidOperationException($"Não é possível excluir a conta. Existem {tradesCount} trades associados.");
            }

            var filter = Builders<Account>.Filter.And(
                Builders<Account>.Filter.Eq(a => a.ObjectId, accountId),
                Builders<Account>.Filter.Eq(a => a.OwnerId, userId)
            );

            var result = await _accounts.DeleteOneAsync(filter);

            return result.DeletedCount > 0;
        }

        public async Task<bool> AccountExistsAsync(string accountId, string userId)
        {
            var filter = Builders<Account>.Filter.And(
                Builders<Account>.Filter.Eq(a => a.ObjectId, accountId),
                Builders<Account>.Filter.Eq(a => a.OwnerId, userId)
            );

            var count = await _accounts.CountDocumentsAsync(filter);

            return count > 0;
        }

        public async Task<Dictionary<string, AccountResponse>> GetAccountsDictionaryAsync(string userId)
        {
            var filter = Builders<Account>.Filter.Eq(a => a.OwnerId, userId);
            var accounts = await _accounts.Find(filter).ToListAsync();

            var dictionary = new Dictionary<string, AccountResponse>();

            foreach (var account in accounts)
            {
                var response = MapToResponse(account);
                await CalculateAccountStatistics(response, userId);
                dictionary[account.ObjectId] = response;
            }

            return dictionary;
        }

        private async Task CalculateAccountStatistics(AccountResponse account, string userId)
        {
            var filter = Builders<Trade>.Filter.And(
                Builders<Trade>.Filter.Eq(t => t.OwnerId, userId),
                Builders<Trade>.Filter.Eq(t => t.AccountId, account.ObjectId)
            );

            var trades = await _trades.Find(filter).ToListAsync();

            account.TotalTrades = trades.Count;

            if (trades.Any())
            {
                account.TotalPL = trades.Sum(t => t.RealizedPLEUR);
                var wins = trades.Count(t => t.RealizedPLEUR > 0);
                account.WinRate = (decimal)wins / trades.Count * 100;
            }
            else
            {
                account.TotalPL = 0;
                account.WinRate = 0;
            }
        }

        private AccountResponse MapToResponse(Account account)
        {
            return new AccountResponse
            {
                ObjectId = account.ObjectId,
                Name = account.Name,
                Broker = account.Broker,
                AccountType = account.AccountType,
                Currency = account.Currency,
                Balance = account.Balance,
                IsActive = account.IsActive,
                Notes = account.Notes,
                CreatedAt = account.CreatedAt,
                UpdatedAt = account.UpdatedAt
            };
        }
    }
}