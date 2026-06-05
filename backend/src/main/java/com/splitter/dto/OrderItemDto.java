package com.splitter.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderItemDto {
    private String name;
    private double amount;
    private List<String> sharedWith;

    public OrderItemDto() {
        this.sharedWith = new ArrayList<>();
    }

    public OrderItemDto(String name, double amount) {
        this.name = name;
        this.amount = amount;
        this.sharedWith = new ArrayList<>();
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public List<String> getSharedWith() { return sharedWith; }
    public void setSharedWith(List<String> sharedWith) { this.sharedWith = sharedWith; }
}