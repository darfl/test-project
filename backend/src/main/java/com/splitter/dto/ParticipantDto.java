package com.splitter.dto;

public class ParticipantDto {
    private String name;
    private String order;
    private double amount;

    public ParticipantDto() {}

    public ParticipantDto(String name, String order, double amount) {
        this.name = name;
        this.order = order;
        this.amount = amount;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOrder() { return order; }
    public void setOrder(String order) { this.order = order; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
}