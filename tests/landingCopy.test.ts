import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTACT_EMAIL, landingCopy, type Fragment } from "../src/components/landing/landingCopy";

const strings = (value: unknown): string[] => {
    if (typeof value === "string")
        return [value];
    if (Array.isArray(value))
        return value.flatMap(strings);
    if (value && typeof value === "object")
        return Object.values(value).flatMap(strings);
    return [];
};

const shape = (value: unknown): unknown => {
    if (typeof value === "string")
        return "string";
    if (typeof value === "boolean")
        return "boolean";
    if (Array.isArray(value))
        return ["list", ...new Set(value.map(item => JSON.stringify(shape(item))))];
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
    return typeof value;
};

test("landing copy has the same structure and no empty text in Korean and English", () => {
    // Lists may differ in length (the Korean headline wraps onto three lines) but not in item shape.
    assert.deepEqual(shape(landingCopy.ko), shape(landingCopy.en));
    for (const locale of ["ko", "en"] as const) {
        assert.equal(landingCopy[locale].how.steps.length, 3);
        assert.equal(landingCopy[locale].record.rows.length, 4);
        assert.equal(landingCopy[locale].ticker.items.length, 4);
    }
    for (const locale of ["ko", "en"] as const)
        assert.ok(strings(landingCopy[locale]).every(text => text.trim().length > 0), `${locale} copy has an empty string`);
});

test("hero and final headlines carry the approved wording and one emphasised run", () => {
    const heroLines = (locale: "ko" | "en") => landingCopy[locale].hero.title.map(line => line.map(part => part.text).join(""));
    assert.deepEqual(heroLines("en"), ["Hire after", "one real project."]);
    assert.deepEqual(heroLines("ko"), ["이력서 말고,", "프로젝트 하나로", "결정하세요."]);
    for (const locale of ["ko", "en"] as const) {
        const strong = (parts: Fragment[]) => parts.filter(part => part.strong).length;
        assert.equal(landingCopy[locale].hero.title.reduce((total, line) => total + strong(line), 0), 1);
        assert.equal(strong(landingCopy[locale].final.title), 1);
    }
});

test("landing copy makes no unsupported statistic, testimonial, ranking or guarantee claim", () => {
    const banned = /\d\s*%|top\s*1|\d{2,}\s*\+|★|testimonial|guarantee|zero risk|보장|후기|상위|1위/i;
    for (const locale of ["ko", "en"] as const)
        for (const text of strings(landingCopy[locale]))
            assert.doesNotMatch(text, banned, `${locale}: "${text}"`);
});

test("escrow is described as in preparation, never as live", () => {
    for (const locale of ["ko", "en"] as const) {
        const escrow = landingCopy[locale].ticker.items.find(item => item.live === false);
        assert.ok(escrow, `${locale} has an in-preparation item`);
        assert.equal(landingCopy[locale].ticker.items.filter(item => item.live).length, 3);
    }
    assert.equal(CONTACT_EMAIL, "konexa.corp@gmail.com");
});
