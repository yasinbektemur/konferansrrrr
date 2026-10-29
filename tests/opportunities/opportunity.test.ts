import assert from "node:assert/strict";
import { test } from "node:test";
import { Opportunity, daysUntilDeadline } from "@/modules/opportunities/domain/opportunity";

test("nearestDeadline ignores expired deadlines and computes urgency", () => {
  const opportunity = new Opportunity({
    id: "opp", slug: "opp", type: "conference", title: "Test", summary: "Test", description: "",
    attendanceMode: "online", officialUrl: "https://example.org", trustLevel: "verified", confidenceScore: 90,
    sourceName: "Kaynak", topics: [], indexes: [], deadlines: [
      { id: "past", kind: "abstract", label: "Geçmiş", dueAt: "2026-01-01", isEstimated: false },
      { id: "next", kind: "full_paper", label: "Tam metin", dueAt: "2026-11-04", isEstimated: false },
    ],
  });

  const nearest = opportunity.nearestDeadline(new Date("2026-10-29T12:00:00+03:00"));
  assert.equal(nearest?.id, "next");
  assert.equal(nearest?.daysLeft, 6);
  assert.equal(opportunity.urgency(new Date("2026-10-29T12:00:00+03:00")), "critical");
});

test('date-only deadline counters share UTC day boundaries across server timezones',()=>{
  const nearMidnight=new Date('2026-10-29T02:30:00+03:00');
  assert.equal(daysUntilDeadline('2026-10-28',nearMidnight),0);
  assert.equal(daysUntilDeadline('2026-10-29',nearMidnight),1);
  assert.equal(daysUntilDeadline('2026-10-28',new Date('2026-10-29T00:00:00Z')),-1);
});
