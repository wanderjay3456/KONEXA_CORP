import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { authCopy, authErrorMessage } from "../src/i18n/authCopy";
import { EARLY_BIRD_DEADLINE_AT, isEarlyBirdOpen } from "../src/config/earlyBird";
import EarlyBirdCampaign from "../src/components/landing/EarlyBirdCampaign";
import FoundingPartners from "../src/components/landing/FoundingPartners";
import { deferNotificationWork } from "../src/server/deferredWork";
import { loadWorkspaceProfiles } from "../src/lib/workspaceProfile";
import { UserRole } from "../src/types";
test("Korean and English auth languages have complete non-empty copy", () => {
    const keys = Object.keys(authCopy.en).sort();
    for (const locale of ["ko", "en"] as const) {
        assert.deepEqual(Object.keys(authCopy[locale]).sort(), keys);
        assert.ok(Object.values(authCopy[locale]).every(value => value.trim().length > 0));
    }
});
test("auth errors are actionable and never leak unknown provider details", () => {
    for (const locale of ["ko", "en"] as const) {
        assert.equal(authErrorMessage(new Error("Invalid login credentials"), locale), authCopy[locale].invalidCredentials);
        assert.equal(authErrorMessage(new Error("Email not confirmed"), locale), authCopy[locale].unconfirmed);
        assert.equal(authErrorMessage(new Error("fetch failed"), locale), authCopy[locale].networkError);
        assert.equal(authErrorMessage(new Error("429 Too many requests"), locale), authCopy[locale].rateLimited);
        assert.equal(authErrorMessage(new Error("otp_expired"), locale), authCopy[locale].expired);
        assert.equal(authErrorMessage(new Error("internal database secret=DO_NOT_SHOW"), locale), authCopy[locale].genericError);
    }
});
test("early-bird closes immediately after its Korean-time deadline", () => {
    assert.equal(isEarlyBirdOpen(EARLY_BIRD_DEADLINE_AT), true);
    assert.equal(isEarlyBirdOpen(EARLY_BIRD_DEADLINE_AT + 1), false);
    assert.equal(isEarlyBirdOpen(Date.parse("2026-09-14T00:00:00Z")), false);
});
test("expired early-bird shows current cohort rather than granting old discounts", context => {
    context.mock.method(Date, "now", () => Date.parse("2026-09-14T00:00:00Z"));
    const html = renderToStaticMarkup(React.createElement(EarlyBirdCampaign, { locale: "ko", onStudent() { }, onCompany() { } }));
    assert.match(html, /약 10명/);
    assert.match(html, /주차별 결과물/);
    assert.match(html, /신규 신청은 종료/);
    assert.doesNotMatch(html, /구독료 30% 할인/);
});
test("current cohort renders in every locale without invented student capacity", () => {
    for (const locale of ["ko", "en"] as const) {
        const html = renderToStaticMarkup(React.createElement(FoundingPartners, { locale, onStudent() { }, onCompany() { } }));
        assert.match(html, /10/);
        assert.match(html, /data-no-translate/);
        assert.doesNotMatch(html, /Zero Risk|100%|VVIP/);
    }
});
test("notification work is retained through completion", async () => {
    let release!: () => void;
    let finished = false;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let retained: Promise<void> | undefined;
    const pending = deferNotificationWork(async () => { await gate; finished = true; }, promise => { retained = promise; });
    assert.equal(retained, pending);
    assert.equal(finished, false);
    release();
    await retained;
    assert.equal(finished, true);
});
test("notification failures are handled and reported without rejecting the response", async () => {
    let failures = 0;
    await deferNotificationWork(async () => { throw new Error("provider unavailable"); }, () => { }, () => { failures++; });
    assert.equal(failures, 1);
});
const user = { uid: "test-only", email: "test@example.invalid", displayName: "Test", role: UserRole.STUDENT, createdAt: 1 };
test("missing onboarding stays incomplete and never receives a verified score", async () => {
    const result = await loadWorkspaceProfiles(user, async () => null);
    assert.equal(result.student?.onboardingCompleted, false);
    assert.equal(result.student?.trustScore, 0);
    assert.equal(result.company, null);
    const company = await loadWorkspaceProfiles({ ...user, role: UserRole.COMPANY }, async () => null);
    assert.equal(company.company?.verified, false);
    assert.equal(company.student, null);
});
test("profile load errors are not converted into a blank successful profile", async () => {
    await assert.rejects(loadWorkspaceProfiles(user, async () => { throw new Error("network unavailable"); }), /network unavailable/);
});
