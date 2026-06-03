package com.splitter.dto;

public class SharedItemDto {
    private String name;
    private double amount;
    private String paidBy;

    public SharedItemDto() {}

    public SharedItemDto(String name, double amount, String paidBy) {
        this.name = name;
        this.amount = amount;
        this.paidBy = paidBy;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }
}
