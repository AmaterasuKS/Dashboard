using Dashboard.Web.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=dashboard.db"));

var app = builder.Build();

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/dashboard", async (
    AppDbContext db,
    string? search,
    DateTime? dateFrom,
    DateTime? dateTo,
    DateTime? lastTxFrom,
    DateTime? lastTxTo,
    decimal? minVolume,
    decimal? maxVolume,
    decimal? minAmount,
    decimal? maxAmount,
    string? status,
    string? category,
    string? type,
    int? take) =>
{
    var query = db.Transactions.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(t => t.AccountName.Contains(search) || t.Category.Contains(search));
    }

    if (dateFrom.HasValue)
    {
        query = query.Where(t => t.TransactionDate >= dateFrom.Value);
    }

    if (dateTo.HasValue)
    {
        var end = dateTo.Value.Date.AddDays(1);
        query = query.Where(t => t.TransactionDate < end);
    }

    if (lastTxFrom.HasValue)
    {
        query = query.Where(t => t.TransactionDate >= lastTxFrom.Value);
    }

    if (lastTxTo.HasValue)
    {
        var end = lastTxTo.Value.Date.AddDays(1);
        query = query.Where(t => t.TransactionDate < end);
    }

    if (minVolume.HasValue)
    {
        query = query.Where(t => t.Volume >= minVolume.Value);
    }

    if (maxVolume.HasValue)
    {
        query = query.Where(t => t.Volume <= maxVolume.Value);
    }

    if (minAmount.HasValue)
    {
        query = query.Where(t => t.Amount >= minAmount.Value);
    }

    if (maxAmount.HasValue)
    {
        query = query.Where(t => t.Amount <= maxAmount.Value);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(t => t.Status == status);
    }

    if (!string.IsNullOrWhiteSpace(category))
    {
        query = query.Where(t => t.Category == category);
    }

    if (!string.IsNullOrWhiteSpace(type))
    {
        query = query.Where(t => t.Type == type);
    }

    var totalTransactions = await query.CountAsync();
    var totalVolume = await query.SumAsync(t => (decimal?)t.Volume) ?? 0m;
    var avgAmount = await query.AverageAsync(t => (decimal?)t.Amount) ?? 0m;
    var lastTransactionDate = await query.MaxAsync(t => (DateTime?)t.TransactionDate);

    var volumeByDay = await query
        .GroupBy(t => t.TransactionDate.Date)
        .Select(g => new { date = g.Key, total = g.Sum(x => x.Volume) })
        .OrderBy(x => x.date)
        .ToListAsync();

    var volumeByCategory = await query
        .GroupBy(t => t.Category)
        .Select(g => new { category = g.Key, total = g.Sum(x => x.Volume) })
        .OrderByDescending(x => x.total)
        .ToListAsync();

    var byStatus = await query
        .GroupBy(t => t.Status)
        .Select(g => new { status = g.Key, count = g.Count() })
        .OrderByDescending(x => x.count)
        .ToListAsync();

    var listTake = Math.Clamp(take ?? 100, 20, 500);
    var rows = await query
        .OrderByDescending(t => t.TransactionDate)
        .Take(listTake)
        .Select(t => new
        {
            t.Id,
            t.AccountName,
            t.Category,
            t.Status,
            t.Type,
            t.Amount,
            t.Volume,
            t.TransactionDate
        })
        .ToListAsync();

    var options = new
    {
        categories = await db.Transactions.Select(t => t.Category).Distinct().OrderBy(x => x).ToListAsync(),
        statuses = await db.Transactions.Select(t => t.Status).Distinct().OrderBy(x => x).ToListAsync(),
        types = await db.Transactions.Select(t => t.Type).Distinct().OrderBy(x => x).ToListAsync()
    };

    return Results.Ok(new
    {
        summary = new
        {
            totalTransactions,
            totalVolume,
            avgAmount,
            lastTransactionDate
        },
        charts = new
        {
            volumeByDay,
            volumeByCategory,
            byStatus
        },
        rows,
        options
    });
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.EnsureSeededAsync(db);
}

app.Run();
