using Dashboard.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Web.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Transaction> Transactions => Set<Transaction>();
    }
}
