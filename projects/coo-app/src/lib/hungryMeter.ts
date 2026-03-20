export interface HungryMeterResult {
  /** 0.0 (just fed) to 1.0 (likely hungry now) */
  fillLevel: number;
  /** Estimated minutes until next feed */
  estimatedMinutesUntilFeed: number;
  /** Confidence based on data quality */
  confidence: "low" | "medium" | "high";
  /** Visual zone */
  zone: "green" | "yellow" | "coral";
  /** Human-readable label */
  label: string;
}

interface FeedInput {
  startedAt: number;
  endedAt: number;
  amountMl: number | null;
}

export function calculateHungryMeter(
  lastFeed: { endedAt: number; amountMl: number | null; type: string } | null,
  feedingHistory: FeedInput[],
  babyAgeWeeks: number,
  now: number = Date.now()
): HungryMeterResult {
  // No data at all
  if (!lastFeed) {
    return {
      fillLevel: 0,
      estimatedMinutesUntilFeed: 0,
      confidence: "low",
      zone: "green",
      label: "Log your first feed to see predictions",
    };
  }

  // Step 1: Calculate intervals between consecutive feeds
  const intervals = computeIntervals(feedingHistory);

  // Step 2: Weighted moving average (recent feeds weighted more)
  const weightedAvgInterval = weightedMovingAverage(intervals, 0.85);

  // Step 3: Age-based baseline
  const ageBaseline = getAgeBaseline(babyAgeWeeks);

  // Step 4: Blend historical and age-based estimates
  const dataPoints = intervals.length;
  let confidence: "low" | "medium" | "high";
  let expectedInterval: number;

  if (dataPoints < 5) {
    expectedInterval = ageBaseline;
    confidence = "low";
  } else if (dataPoints < 20) {
    expectedInterval = weightedAvgInterval * 0.6 + ageBaseline * 0.4;
    confidence = "medium";
  } else {
    expectedInterval = weightedAvgInterval * 0.9 + ageBaseline * 0.1;
    confidence = "high";
  }

  // Step 5: Volume adjustment
  if (lastFeed.amountMl !== null && dataPoints >= 10) {
    const amounts = feedingHistory
      .map((f) => f.amountMl)
      .filter((a): a is number => a !== null);
    if (amounts.length > 0) {
      const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
      if (avgAmount > 0) {
        const volumeRatio = lastFeed.amountMl / avgAmount;
        expectedInterval *= 1 + (volumeRatio - 1) * 0.4;
      }
    }
  }

  // Step 6: Time-of-day adjustment (nighttime longer intervals)
  const hourOfDay = new Date(lastFeed.endedAt).getHours();
  if (hourOfDay >= 20 || hourOfDay < 6) {
    expectedInterval *= 1.15;
  }

  // Step 7: Compute fill level
  const minutesSinceLastFeed = (now - lastFeed.endedAt) / 60000;
  const fillLevel = Math.min(minutesSinceLastFeed / expectedInterval, 1.0);

  // Step 8: Zone and label
  const estimatedMinutesUntilFeed = Math.max(
    0,
    Math.round(expectedInterval - minutesSinceLastFeed)
  );

  let zone: "green" | "yellow" | "coral";
  let label: string;

  if (fillLevel < 0.6) {
    zone = "green";
    label =
      estimatedMinutesUntilFeed > 60
        ? `~${Math.round(estimatedMinutesUntilFeed / 60)}h ${estimatedMinutesUntilFeed % 60}m`
        : `~${estimatedMinutesUntilFeed} min`;
  } else if (fillLevel < 0.85) {
    zone = "yellow";
    label = `~${estimatedMinutesUntilFeed} min`;
  } else {
    zone = "coral";
    label =
      estimatedMinutesUntilFeed > 0
        ? `~${estimatedMinutesUntilFeed} min`
        : "Likely hungry";
  }

  return { fillLevel, estimatedMinutesUntilFeed, confidence, zone, label };
}

function computeIntervals(
  feeds: FeedInput[]
): number[] {
  const sorted = [...feeds].sort((a, b) => a.startedAt - b.startedAt);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].endedAt || sorted[i - 1].startedAt;
    const gap = (sorted[i].startedAt - prevEnd) / 60000;
    // Filter unreasonable gaps
    if (gap >= 15 && gap <= 480) {
      intervals.push(gap);
    }
  }
  return intervals;
}

function weightedMovingAverage(
  values: number[],
  decayFactor: number
): number {
  if (values.length === 0) return 0;
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    const weight = Math.pow(decayFactor, values.length - 1 - i);
    weightedSum += values[i] * weight;
    weightSum += weight;
  }
  return weightedSum / weightSum;
}

function getAgeBaseline(ageWeeks: number): number {
  if (ageWeeks < 2) return 90;
  if (ageWeeks < 8) return 120;
  if (ageWeeks < 16) return 150;
  if (ageWeeks < 26) return 180;
  if (ageWeeks < 39) return 210;
  if (ageWeeks < 52) return 240;
  return 270;
}
