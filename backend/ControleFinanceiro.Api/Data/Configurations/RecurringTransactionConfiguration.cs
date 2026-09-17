using ControleFinanceiro.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ControleFinanceiro.Api.Data.Configurations;

public sealed class RecurringTransactionConfiguration : IEntityTypeConfiguration<RecurringTransaction>
{
    public void Configure(EntityTypeBuilder<RecurringTransaction> builder)
    {
        builder.ToTable("RecurringTransactions");
        builder.HasKey(recurrence => recurrence.Id);
        builder.Property(recurrence => recurrence.Description).HasMaxLength(200).IsRequired();
        builder.Property(recurrence => recurrence.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(recurrence => recurrence.Type).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(recurrence => recurrence.Category).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(recurrence => recurrence.Frequency).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(recurrence => recurrence.NextOccurrenceDate).HasColumnType("date").IsRequired();
        builder.Property(recurrence => recurrence.CreatedAt).HasPrecision(0).IsRequired();
        builder.Property(recurrence => recurrence.EndedAt).HasPrecision(0);
        builder.HasIndex(recurrence => new { recurrence.UserId, recurrence.IsActive, recurrence.NextOccurrenceDate });
        builder.HasOne(recurrence => recurrence.User)
            .WithMany(user => user.RecurringTransactions)
            .HasForeignKey(recurrence => recurrence.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
