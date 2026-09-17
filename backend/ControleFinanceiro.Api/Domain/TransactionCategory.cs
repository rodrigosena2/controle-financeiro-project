namespace ControleFinanceiro.Api.Domain;

public enum TransactionCategory
{
    Salary = 1,
    Freelance = 2,
    Investments = 3,
    OtherIncome = 4,
    Food = 101,
    Housing = 102,
    Transportation = 103,
    Health = 104,
    Education = 105,
    Leisure = 106,
    Subscriptions = 107,
    OtherExpense = 108
}

public static class TransactionCategoryRules
{
    public static bool IsCompatible(TransactionCategory category, TransactionType type) => type switch
    {
        TransactionType.Income => category is TransactionCategory.Salary
            or TransactionCategory.Freelance
            or TransactionCategory.Investments
            or TransactionCategory.OtherIncome,
        TransactionType.Expense => category is TransactionCategory.Food
            or TransactionCategory.Housing
            or TransactionCategory.Transportation
            or TransactionCategory.Health
            or TransactionCategory.Education
            or TransactionCategory.Leisure
            or TransactionCategory.Subscriptions
            or TransactionCategory.OtherExpense,
        _ => false
    };

    public static string Label(TransactionCategory category) => category switch
    {
        TransactionCategory.Salary => "Salário",
        TransactionCategory.Freelance => "Freelance",
        TransactionCategory.Investments => "Investimentos",
        TransactionCategory.OtherIncome => "Outros",
        TransactionCategory.Food => "Alimentação",
        TransactionCategory.Housing => "Moradia",
        TransactionCategory.Transportation => "Transporte",
        TransactionCategory.Health => "Saúde",
        TransactionCategory.Education => "Educação",
        TransactionCategory.Leisure => "Lazer",
        TransactionCategory.Subscriptions => "Assinaturas",
        TransactionCategory.OtherExpense => "Outros",
        _ => throw new ArgumentOutOfRangeException(nameof(category))
    };
}
