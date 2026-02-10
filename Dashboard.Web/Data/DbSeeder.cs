using Dashboard.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Web.Data
{
    public static class DbSeeder
    {
        private static readonly string[] Categories = { "Retail", "Logistics", "SaaS", "Marketing", "Payroll", "Ops" };
        private static readonly string[] Statuses = { "Completed", "Pending", "Failed", "Reversed" };
        private static readonly string[] Types = { "Credit", "Debit" };
        private static readonly string[] Accounts = { "Aurora LLC", "Nova Group", "Vega Corp", "Orion Ltd", "Atlas Inc", "Lumen PLC" };

        public static async Task EnsureSeededAsync(AppDbContext db)
        {
            await db.Database.EnsureCreatedAsync();

            if (await db.Transactions.AnyAsync())
            {
                return;
            }

            var random = new Random(42);
            var now = DateTime.UtcNow;
            var list = new List<Transaction>();

            for (var i = 0; i < 1500; i++)
            {
                var daysBack = random.Next(0, 180);
                var date = now.AddDays(-daysBack).AddMinutes(-random.Next(0, 1440));
                var amount = Math.Round((decimal)(random.NextDouble() * 5000 + 50), 2);
                var volume = Math.Round(amount * (decimal)(random.NextDouble() * 2 + 0.5), 2);

                list.Add(new Transaction
                {
                    AccountName = Accounts[random.Next(Accounts.Length)],
                    Category = Categories[random.Next(Categories.Length)],
                    Status = Statuses[random.Next(Statuses.Length)],
                    Type = Types[random.Next(Types.Length)],
                    Amount = amount,
                    Volume = volume,
                    TransactionDate = date
                });
            }

            db.Transactions.AddRange(list);
            await db.SaveChangesAsync();
        }
    }
}
