package com.splitter.dto;

public class PressureDto {
    private String name;
    private int deviationPercent;
    private String level; // LOW, MEDIUM, HIGH

    public PressureDto() {}

    public PressureDto(String name, int deviationPercent, String level) {
        this.name = name;
        this.deviationPercent = deviationPercent;
        this.level = level;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getDeviationPercent() { return deviationPercent; }
    public void setDeviationPercent(int deviationPercent) { this.deviationPercent = deviationPercent; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
}