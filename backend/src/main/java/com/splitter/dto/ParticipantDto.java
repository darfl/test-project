package com.splitter.dto;

public class ParticipantDto {
    private String name;
    private String order;
    private double amount;
    private double contribution;

    public ParticipantDto() {}

    public ParticipantDto(String name, String order, double amount) {
        this.name = name;
        this.order = order;
        this.amount = amount;
        this.contribution = 0;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOrder() { return order; }
    public void setOrder(String order) { this.order = order; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public double getContribution() { return contribution; }
    public void setContribution(double contribution) { this.contribution = contribution; }
}