package com.splitter.dto;

public class DebtDto {
    private String debtor;
    private String creditor;
    private double amount;

    public DebtDto() {}

    public DebtDto(String debtor, String creditor, double amount) {
        this.debtor = debtor;
        this.creditor = creditor;
        this.amount = amount;
    }

    public String getDebtor() { return debtor; }
    public void setDebtor(String debtor) { this.debtor = debtor; }

    public String getCreditor() { return creditor; }
    public void setCreditor(String creditor) { this.creditor = creditor; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
}