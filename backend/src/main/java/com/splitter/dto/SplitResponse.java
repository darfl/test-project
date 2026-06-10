package com.splitter.dto;

import java.util.List;

public class SplitResponse {
    private double average;
    private double total;
    private List<DebtDto> debts;

    public SplitResponse() {}

    public SplitResponse(double average, double total, List<DebtDto> debts) {
        this.average = average;
        this.total = total;
        this.debts = debts;
    }

    public double getAverage() { return average; }
    public void setAverage(double average) { this.average = average; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public List<DebtDto> getDebts() { return debts; }
    public void setDebts(List<DebtDto> debts) { this.debts = debts; }
}