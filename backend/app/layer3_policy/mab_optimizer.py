"""Multi-Armed Bandit (MAB) Reinforcement Learning Policy Optimizer.

Simulates an adaptive reinforcement learning engine (Thompson Sampling / Epsilon-Greedy)
that dynamically discovers the highest-converting recovery corridor across:
- Channel (WhatsApp, SMS, Email, In-App)
- Incentive Level (0%, 3%, 5%)
- Delay Timing (+5 mins, +15 mins, +60 mins, Next Morning)

This demonstrates true autonomous policy optimization beyond hardcoded heuristics.
"""

from pydantic import BaseModel
from typing import Optional
import random
import math
from datetime import datetime


class RecoveryArm(BaseModel):
    arm_id: str
    channel: str
    incentive_pct: float
    delay_window: str
    description: str
    trials: int = 0
    successes: int = 0
    revenue_recovered: float = 0.0
    cost_incurred: float = 0.0
    conversion_rate: float = 0.0
    alpha: float = 1.0  # Beta distribution prior for Thompson Sampling
    beta_param: float = 1.0


class MABState(BaseModel):
    total_decisions: int = 0
    total_conversions: int = 0
    exploration_count: int = 0
    exploitation_count: int = 0
    epsilon: float = 0.15  # Exploration probability
    arms: list[RecoveryArm] = []
    last_updated: datetime = datetime.utcnow()


# Initial recovery arms
INITIAL_ARMS = [
    RecoveryArm(
        arm_id="arm_wa_no_disc_fast",
        channel="WhatsApp",
        incentive_pct=0.0,
        delay_window="5 mins",
        description="WhatsApp Smart Link (Immediate, 0% Incentive)",
        trials=142,
        successes=34,
        revenue_recovered=84966.0,
        cost_incurred=106.50,  # 142 * ₹0.75
        conversion_rate=23.94,
        alpha=35.0,
        beta_param=109.0,
    ),
    RecoveryArm(
        arm_id="arm_wa_disc_3pct_fast",
        channel="WhatsApp",
        incentive_pct=3.0,
        delay_window="15 mins",
        description="WhatsApp + 3% Dynamic Incentive (Optimal Balance)",
        trials=188,
        successes=62,
        revenue_recovered=154938.0,
        cost_incurred=4789.0,  # Messaging + discount cost
        conversion_rate=32.98,
        alpha=63.0,
        beta_param=127.0,
    ),
    RecoveryArm(
        arm_id="arm_wa_disc_5pct_bounded",
        channel="WhatsApp",
        incentive_pct=5.0,
        delay_window="30 mins",
        description="WhatsApp + 5% Bounded Ceiling (High Margin Loss)",
        trials=95,
        successes=35,
        revenue_recovered=87465.0,
        cost_incurred=4444.0,
        conversion_rate=36.84,
        alpha=36.0,
        beta_param=61.0,
    ),
    RecoveryArm(
        arm_id="arm_sms_no_disc",
        channel="SMS",
        incentive_pct=0.0,
        delay_window="5 mins",
        description="SMS 1-Click Link (Low Cost, Moderate Conv)",
        trials=120,
        successes=18,
        revenue_recovered=44982.0,
        cost_incurred=18.00,  # 120 * ₹0.15
        conversion_rate=15.00,
        alpha=19.0,
        beta_param=103.0,
    ),
    RecoveryArm(
        arm_id="arm_email_detailed",
        channel="Email",
        incentive_pct=0.0,
        delay_window="60 mins",
        description="Email In-Depth Invoice Breakdown (B2B/High Value)",
        trials=76,
        successes=16,
        revenue_recovered=119984.0,
        cost_incurred=7.60,
        conversion_rate=21.05,
        alpha=17.0,
        beta_param=61.0,
    ),
]


class MABOptimizerEngine:
    def __init__(self):
        self.state = MABState(
            total_decisions=sum(a.trials for a in INITIAL_ARMS),
            total_conversions=sum(a.successes for a in INITIAL_ARMS),
            exploration_count=98,
            exploitation_count=523,
            epsilon=0.12,
            arms=INITIAL_ARMS,
            last_updated=datetime.utcnow(),
        )

    def select_arm(self, segment: str = "standard", amount: float = 2500.0) -> RecoveryArm:
        """Select best arm using Thompson Sampling (sampling from Beta distribution)."""
        sampled_values = []
        is_exploration = random.random() < self.state.epsilon

        if is_exploration:
            selected = random.choice(self.state.arms)
            self.state.exploration_count += 1
        else:
            # Thompson Sampling: sample from Beta(alpha, beta) for each arm
            best_arm = None
            max_sample = -1.0

            for arm in self.state.arms:
                # Random draw from Beta distribution
                sample = random.betavariate(arm.alpha, arm.beta_param)
                if sample > max_sample:
                    max_sample = sample
                    best_arm = arm

            selected = best_arm or self.state.arms[0]
            self.state.exploitation_count += 1

        self.state.total_decisions += 1
        return selected

    def record_outcome(self, arm_id: str, success: bool, amount_recovered: float = 0.0):
        """Update Bayesian posterior and empirical metrics for the chosen arm."""
        for arm in self.state.arms:
            if arm.arm_id == arm_id:
                arm.trials += 1
                if success:
                    arm.successes += 1
                    arm.revenue_recovered += amount_recovered
                    arm.alpha += 1.0
                    self.state.total_conversions += 1
                else:
                    arm.beta_param += 1.0

                arm.conversion_rate = round((arm.successes / arm.trials) * 100, 2)
                break

        self.state.last_updated = datetime.utcnow()

    def get_analytics(self) -> dict:
        """Get summarized bandit analytics for frontend visualization."""
        total_revenue = sum(a.revenue_recovered for a in self.state.arms)
        total_cost = sum(a.cost_incurred for a in self.state.arms)
        net_profit = total_revenue - total_cost

        # Identify current optimal arm
        best_arm = max(self.state.arms, key=lambda a: a.conversion_rate if a.trials > 20 else 0)

        # Baseline conversion (arm with lowest trials / no incentive)
        baseline_rate = 14.50
        current_overall_rate = round((self.state.total_conversions / max(1, self.state.total_decisions)) * 100, 2)
        lift_pct = round(((current_overall_rate - baseline_rate) / baseline_rate) * 100, 1)

        return {
            "total_decisions": self.state.total_decisions,
            "total_conversions": self.state.total_conversions,
            "overall_conversion_rate": current_overall_rate,
            "baseline_conversion_rate": baseline_rate,
            "relative_lift_pct": lift_pct,
            "exploration_ratio": round((self.state.exploration_count / max(1, self.state.total_decisions)) * 100, 1),
            "exploitation_ratio": round((self.state.exploitation_count / max(1, self.state.total_decisions)) * 100, 1),
            "epsilon": self.state.epsilon,
            "best_performing_arm": best_arm.model_dump(mode="json"),
            "total_revenue_recovered": round(total_revenue, 2),
            "total_cost_incurred": round(total_cost, 2),
            "net_revenue_lift": round(net_profit, 2),
            "arms": [a.model_dump(mode="json") for a in self.state.arms],
        }


# Global singleton optimizer instance
mab_engine = MABOptimizerEngine()
