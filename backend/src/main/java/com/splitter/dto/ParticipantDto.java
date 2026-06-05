package com.splitter.dto;

import java.util.ArrayList;
import java.util.List;

public class ParticipantDto {
    private String name;
    private String order;        // deprecated - kept for backward compatibility
    private double amount;       // computed from items
    private double contribution;
    private List<OrderItemDto> items;

    public ParticipantDto() {
        this.items = new ArrayList<>();
    }

    public ParticipantDto(String name, String order, double amount) {
        this.name = name;
        this.order = order;
        this.amount = amount;
        this.contribution = 0;
        this.items = new ArrayList<>();
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOrder() { return order; }
    public void setOrder(String order) { this.order = order; }

    public double getAmount() {
        if (items != null && !items.isEmpty()) {
            return items.stream().mapToDouble(OrderItemDto::getAmount).sum();
        }
        return amount;
    }
    public void setAmount(double amount) { this.amount = amount; }

    public double getContribution() { return contribution; }
    public void setContribution(double contribution) { this.contribution = contribution; }

    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}