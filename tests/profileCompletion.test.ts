import assert from "node:assert/strict";
import test from "node:test";
import { getStudentCompletionErrors } from "../src/lib/profileCompletion";

const completeNonTechnicalProfile = {
  name: "QA Talent",
  nationality: "Vietnam",
  currentCountry: "Vietnam",
  timezone: "GMT+7",
  university: "QA University",
  degree: "Bachelor",
  major: "International Business",
  graduationYear: "2027",
  englishLevel: "Fluent",
  skills: ["Market Research & Strategy"],
  preferredJob: "Overseas Sales, Trade & Market Entry",
  availability: "Immediately",
  preferredWeeklyPayKrw: 300000,
  bio: "I support cross-border market research and customer interviews.",
  identityDocumentPath: "qa/academic-proof.pdf",
  resumeUrl: "qa/resume.pdf",
};

test("non-software talent can complete a profile without GitHub or public portfolio", () => {
  assert.deepEqual(getStudentCompletionErrors(completeNonTechnicalProfile), {});
});

test("private academic proof and resume remain mandatory", () => {
  const errors = getStudentCompletionErrors({
    ...completeNonTechnicalProfile,
    identityDocumentPath: "",
    resumeUrl: "",
  });
  assert.ok(errors.identityDocumentPath);
  assert.ok(errors.resumeUrl);
});
