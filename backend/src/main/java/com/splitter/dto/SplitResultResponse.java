package com.splitter.dto;

import java.util.List;

public class SplitResultResponse {
    private double totalAmount;
    private double perPerson;
    private List<DebtRecord> debts;
    private List<ParticipantSummary> participants;

    public SplitResultResponse() {}

    public SplitResultResponse(double totalAmount, double perPerson,
                               List<DebtRecord> debts,
                               List<ParticipantSummary> participants) {
        this.totalAmount = totalAmount;
        this.perPerson = perPerson;
        this.debts = debts;
        this.participants = participants;
    }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public double getPerPerson() { return perPerson; }
    public void setPerPerson(double perPerson) { this.perPerson = perPerson; }

    public List<DebtRecord> getDebts() { return debts; }
    public void setDebts(List<DebtRecord> debts) { this.debts = debts; }

    public List<ParticipantSummary> getParticipants() { return participants; }
    public void setParticipants(List<ParticipantSummary> participants) {
        this.participants = participants;
    }

    public static class DebtRecord {
        private String from;
        private String to;
        private double amount;

        public DebtRecord() {}

        public DebtRecord(String from, String to, double amount) {
            this.from = from;
            this.to = to;
            this.amount = amount;
        }

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }

        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    public static class ParticipantSummary {
        private String name;
        private double totalSpent;
        private List<Item> items;

        public ParticipantSummary() {}

        public ParticipantSummary(String name, double totalSpent, List<Item> items) {
            this.name = name;
            this.totalSpent = totalSpent;
            this.items = items;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public double getTotalSpent() { return totalSpent; }
        public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }

        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }

        public static class Item {
            private String description;
            private double amount;

            public Item() {}

            public Item(String description, double amount) {
                this.description = description;
                this.amount = amount;
            }

            public String getDescription() { return description; }
            public void setDescription(String description) { this.description = description; }

            public double getAmount() { return amount; }
            public void setAmount(double amount) { this.amount = amount; }
        }
    }
}