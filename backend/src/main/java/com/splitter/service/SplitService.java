package com.splitter.service;

import com.splitter.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SplitService {

    public SplitResponse calculate(SplitRequest request) {
        List<ParticipantDto> participants = request.getParticipants() != null ? request.getParticipants() : List.of();
        List<SharedItemDto> sharedItems = request.getSharedItems() != null ? request.getSharedItems() : List.of();
        String organizerName = request.getOrganizerName();

        // Collect unique names from participants + sharedItems
        Set<String> nameSet = new LinkedHashSet<>();
        for (ParticipantDto p : participants) {
            if (p.getName() != null && !p.getName().isEmpty()) {
                nameSet.add(p.getName());
            }
        }
        for (SharedItemDto s : sharedItems) {
            if (s.getPaidBy() != null && !s.getPaidBy().isEmpty()) {
                nameSet.add(s.getPaidBy());
            }
            if (s.getSharedWith() != null) {
                for (String n : s.getSharedWith()) {
                    if (n != null && !n.isEmpty()) nameSet.add(n);
                }
            }
        }
        List<String> names = new ArrayList<>(nameSet);
        int n = names.size();
        if (n == 0) {
            return new SplitResponse(0, 0, List.of());
        }

        double personalTotal = 0;
        double sharedTotal = 0;

        // Net balance per person — start at 0
        Map<String, Double> balance = new LinkedHashMap<>();
        for (String name : names) {
            balance.put(name, 0.0);
        }

        // 1. Personal items — each item was bought by the participant listed under it,
        //    and may be shared with others.
        for (int i = 0; i < participants.size(); i++) {
            ParticipantDto p = participants.get(i);
            String buyer = names.get(i);
            if (p.getItems() == null) continue;
            for (OrderItemDto item : p.getItems()) {
                double itemAmount = item.getAmount();
                personalTotal += itemAmount;

                // Who shares this item? If none given, just the buyer.
                List<String> sharedWith = (item.getSharedWith() != null && !item.getSharedWith().isEmpty())
                        ? item.getSharedWith()
                        : List.of(buyer);

                int cnt = sharedWith.size();
                if (cnt == 0) continue;
                double share = Math.round((itemAmount / cnt) * 100.0) / 100.0;

                // Each sharer owes their share (balance +)
                for (String name : sharedWith) {
                    balance.merge(name, share, Double::sum);
                }

                // The organizer (who paid the bill) gets credit for the item
                balance.merge(organizerName, -itemAmount, Double::sum);

                // Rounding correction on the last sharer
                double totalShares = Math.round(share * cnt * 100.0) / 100.0;
                double diff = Math.round((itemAmount - totalShares) * 100.0) / 100.0;
                if (Math.abs(diff) > 0.001 && !sharedWith.isEmpty()) {
                    balance.merge(sharedWith.get(sharedWith.size() - 1), diff, Double::sum);
                }
            }
        }

        // 2. In-check shared items — paid by organizer, split among selected participants
        List<SharedItemDto> inCheckShared = request.getInCheckShared() != null ? request.getInCheckShared() : List.of();
        for (SharedItemDto s : inCheckShared) {
            double itemAmount = s.getAmount();
            List<String> sharedWith = (s.getSharedWith() != null && !s.getSharedWith().isEmpty())
                    ? s.getSharedWith()
                    : names;
            int cnt = sharedWith.size();
            if (cnt == 0) continue;
            double share = Math.round((itemAmount / cnt) * 100.0) / 100.0;
            for (String name : sharedWith) {
                balance.merge(name, share, Double::sum);
            }
            // Organizer paid this item
            balance.merge(organizerName, -itemAmount, Double::sum);
            double totalShares = Math.round(share * cnt * 100.0) / 100.0;
            double diff = Math.round((itemAmount - totalShares) * 100.0) / 100.0;
            if (Math.abs(diff) > 0.001 && !sharedWith.isEmpty()) {
                balance.merge(sharedWith.get(sharedWith.size() - 1), diff, Double::sum);
            }
        }

        // 2a. Count inCheckShared in sharedTotal for the overall total
        sharedTotal += inCheckShared.stream().mapToDouble(SharedItemDto::getAmount).sum();

        // 3. Shared (group) items — bought by paidBy, shared among sharedWith (or all)
        for (SharedItemDto s : sharedItems) {
            double itemAmount = s.getAmount();
            sharedTotal += itemAmount;

            List<String> sharedWith = (s.getSharedWith() != null && !s.getSharedWith().isEmpty())
                    ? s.getSharedWith()
                    : names;

            int cnt = sharedWith.size();
            if (cnt == 0) continue;
            double share = Math.round((itemAmount / cnt) * 100.0) / 100.0;

            for (String name : sharedWith) {
                balance.merge(name, share, Double::sum);
            }

            String payer = (s.getPaidBy() != null && !s.getPaidBy().isEmpty()) ? s.getPaidBy() : organizerName;
            balance.merge(payer, -itemAmount, Double::sum);

            double totalShares = Math.round(share * cnt * 100.0) / 100.0;
            double diff = Math.round((itemAmount - totalShares) * 100.0) / 100.0;
            if (Math.abs(diff) > 0.001 && !sharedWith.isEmpty()) {
                balance.merge(sharedWith.get(sharedWith.size() - 1), diff, Double::sum);
            }
        }

        // 3. Explicit contributions
        for (int i = 0; i < participants.size(); i++) {
            ParticipantDto p = participants.get(i);
            String name = names.get(i);
            if (p.getContribution() > 0.001) {
                balance.merge(name, -p.getContribution(), Double::sum);
                // assume contribution was paid to organizer (or just credit the contributor)
                balance.merge(organizerName, p.getContribution(), Double::sum);
            }
        }

        // Round all balances
        for (String name : balance.keySet()) {
            balance.put(name, Math.round(balance.get(name) * 100.0) / 100.0);
        }

        double total = personalTotal + sharedTotal;
        double average = n > 0 ? total / n : 0;
        double roundedAverage = Math.round(average * 100.0) / 100.0;

        // Greedy settlement — minimize number of transfers
        List<DebtDto> debts = new ArrayList<>();
        List<Map.Entry<String, Double>> positives = new ArrayList<>();
        List<Map.Entry<String, Double>> negatives = new ArrayList<>();

        for (Map.Entry<String, Double> e : balance.entrySet()) {
            double val = e.getValue();
            if (val > 0.001) positives.add(new AbstractMap.SimpleEntry<>(e.getKey(), val));
            if (val < -0.001) negatives.add(new AbstractMap.SimpleEntry<>(e.getKey(), -val));
        }

        positives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        negatives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        int pi = 0, ni = 0;
        while (pi < positives.size() && ni < negatives.size()) {
            Map.Entry<String, Double> debtor = positives.get(pi);
            Map.Entry<String, Double> creditor = negatives.get(ni);
            double amount = Math.round(Math.min(debtor.getValue(), creditor.getValue()) * 100.0) / 100.0;
            if (amount >= 0.01) {
                debts.add(new DebtDto(debtor.getKey(), creditor.getKey(), amount));
            }
            double newD = Math.round((debtor.getValue() - amount) * 100.0) / 100.0;
            double newC = Math.round((creditor.getValue() - amount) * 100.0) / 100.0;
            if (newD < 0.01) pi++;
            else positives.set(pi, new AbstractMap.SimpleEntry<>(debtor.getKey(), newD));
            if (newC < 0.01) ni++;
            else negatives.set(ni, new AbstractMap.SimpleEntry<>(creditor.getKey(), newC));
        }

        return new SplitResponse(roundedAverage, Math.round(total * 100.0) / 100.0, debts);
    }
}