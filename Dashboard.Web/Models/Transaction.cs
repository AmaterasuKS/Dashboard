using System;

namespace Dashboard.Web.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Credit / Debit
        public decimal Amount { get; set; }
        public decimal Volume { get; set; }
        public DateTime TransactionDate { get; set; }
    }
}
