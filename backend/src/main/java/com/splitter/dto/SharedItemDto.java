package com.splitter.dto;

import java.util.ArrayList;
import java.util.List;

public class SharedItemDto {
    private String name;
    private double amount;
    private String paidBy;
    private List<String> sharedWith; // names of participants sharing this item

    public SharedItemDto() {
        this.sharedWith = new ArrayList<>();
    }

    public SharedItemDto(String name, double amount, String paidBy) {
        this.name = name;
        this.amount = amount;
        this.paidBy = paidBy;
        this.sharedWith = new ArrayList<>();
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }

    public List<String> getSharedWith() { return sharedWith; }
    public void setSharedWith(List<String> sharedWith) { this.sharedWith = sharedWith; }
}