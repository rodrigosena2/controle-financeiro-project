using ControleFinanceiro.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Api.Data.Configurations;

public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(transaction => transaction.Id);
        builder.Property(transaction => transaction.Description).HasMaxLength(200).IsRequired();
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(transaction => transaction.Type).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(transaction => transaction.Category).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(transaction => transaction.Date).HasColumnType("date").IsRequired();
        builder.Property(transaction => transaction.CreatedAt).HasPrecision(0).IsRequired();
        builder.Property(transaction => transaction.UpdatedAt).HasPrecision(0);
        builder.HasIndex(transaction => new { transaction.UserId, transaction.Date });
        builder.HasIndex(transaction => new { transaction.RecurringTransactionId, transaction.Date })
            .IsUnique()
            .HasFilter("[RecurringTransactionId] IS NOT NULL");
        builder
            .HasOne(transaction => transaction.User)
            .WithMany(user => user.Transactions)
            .HasForeignKey(transaction => transaction.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasOne(transaction => transaction.RecurringTransaction)
            .WithMany(recurrence => recurrence.Transactions)
            .HasForeignKey(transaction => transaction.RecurringTransactionId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
