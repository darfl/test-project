package com.splitter.service;

import com.splitter.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SplitService {

    public SplitResponse calculate(SplitRequest request) {
        List<ParticipantDto> participants = request.getParticipants();
        String organizerName = request.getOrganizerName();

        double total = participants.stream()
                .mapToDouble(ParticipantDto::getAmount)
                .sum();

        int count = participants.size();
        double average = count > 0 ? total / count : 0;
        double roundedAverage = Math.round(average * 100.0) / 100.0;

        // Debts: everyone who is NOT the organizer transfers their amount to the organizer
        List<DebtDto> debts = new ArrayList<>();
        for (ParticipantDto p : participants) {
            if (!p.getName().equals(organizerName)) {
                double roundedAmount = Math.round(p.getAmount() * 100.0) / 100.0;
                debts.add(new DebtDto(p.getName(), organizerName, roundedAmount));
            }
        }

        // Pressure data: for each participant
        List<PressureDto> pressureData = new ArrayList<>();
        for (ParticipantDto p : participants) {
            double deviationPercent = 0;
            if (average > 0) {
                deviationPercent = Math.round(((p.getAmount() - average) / average) * 100.0);
            }
            int deviation = (int) deviationPercent;

            String level;
            if (deviation > 70) {
                level = "HIGH";
            } else if (deviation > 30) {
                level = "MEDIUM";
            } else {
                level = "LOW";
            }

            pressureData.add(new PressureDto(p.getName(), deviation, level));
        }

        return new SplitResponse(roundedAverage, Math.round(total * 100.0) / 100.0, debts, pressureData);
    }
}