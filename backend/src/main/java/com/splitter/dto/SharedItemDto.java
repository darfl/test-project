package com.splitter.dto;

public class SharedItemDto {
    private String name;
    private double amount;

    public SharedItemDto() {}

    public SharedItemDto(String name, double amount) {
        this.name = name;
        this.amount = amount;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
}