import { useState, type FormEvent, type ReactNode } from "react";
import { useProgress, type Registrant } from "../context/ProgressContext";
import "./Registration.css";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  currentRole: string;
  organization: string;
  experience: string;
  primaryStack: string;
  portfolio: string;
  startDate: string;
  motivation: string;
  agree: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  timezone: "",
  currentRole: "",
  organization: "",
  experience: "",
  primaryStack: "",
  portfolio: "",
  startDate: "2026-07-13",
  motivation: "",
  agree: false,
};

const ROLE_OPTIONS = ["Student", "Professor"];

const START_DATE = "2026-07-13";

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "6–9 years",
  "10+ years",
];

const TIMEZONE_OPTIONS = [
  "GMT-8 (Pacific)",
  "GMT-5 (Eastern)",
  "GMT+0 (UTC / London)",
  "GMT+1 (Central Europe)",
  "GMT+3 (East Africa / Middle East)",
  "GMT+5:30 (India)",
  "GMT+8 (Singapore)",
];

export default function Registration() {
  const { addRegistration, verifyEmail } = useProgress();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [registrant, setRegistrant] = useState<Registrant | null>(null);
  const [verified, setVerified] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(state: FormState): Errors {
    const next: Errors = {};
    if (!state.firstName.trim()) next.firstName = "First name is required.";
    if (!state.lastName.trim()) next.lastName = "Last name is required.";
    if (!state.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      next.email = "Enter a valid email address.";
    }
    if (state.phone && !/^[+()\-\s\d]{7,}$/.test(state.phone)) {
      next.phone = "Enter a valid phone number.";
    }
    if (!state.country.trim()) next.country = "Country is required.";
    if (!state.experience) next.experience = "Select your experience level.";
    if (state.portfolio && !/^https?:\/\/.+/.test(state.portfolio)) {
      next.portfolio = "Include a full URL (https://…).";
    }
    if (!state.startDate) next.startDate = "A start date is required.";
    if (!state.agree) next.agree = "You must accept the terms to register.";
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      const created = addRegistration({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.currentRole || "Student",
        country: form.country.trim(),
        experience: form.experience,
        primaryStack: form.primaryStack.trim(),
      });
      setRegistrant(created);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const firstError = Object.keys(validation)[0];
      document.getElementById(`field-${firstError}`)?.focus();
    }
  }

  function resetForm() {
    setForm(INITIAL);
    setErrors({});
    setRegistrant(null);
    setVerified(false);
    setEmailOpen(false);
  }

  function handleVerify() {
    if (registrant && verifyEmail(registrant.verifyToken)) {
      setVerified(true);
    }
  }

  if (registrant) {
    return (
      <section id="register" className="section registration">
        <div className="container">
          <div className="registration__success" role="status">
            <div
              className={`registration__check ${
                verified ? "registration__check--verified" : ""
              }`}
              aria-hidden="true"
            >
              ✓
            </div>
            <h2 className="section-title">
              You're on the list, {registrant.firstName}!
            </h2>
            <p className="section-lead registration__success-lead">
              Thanks for registering for Ludwitt Academy Cohort 4 — that's your
              first move on the progress bar. Now confirm your email to activate
              your account.
            </p>

            <div className="verify">
              {verified ? (
                <p className="verify__done">
                  <span aria-hidden="true">✓</span> Email verified — welcome
                  aboard, {registrant.firstName}!
                </p>
              ) : (
                <>
                  <p className="verify__lead">
                    We sent a verification link to{" "}
                    <strong>{registrant.email}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost verify__toggle"
                    onClick={() => setEmailOpen((o) => !o)}
                  >
                    {emailOpen ? "Hide preview" : "Preview the email"}
                  </button>

                  {emailOpen && (
                    <div className="verify__email">
                      <div className="verify__email-head">
                        <span className="verify__from">
                          Ludwitt Academy &lt;no-reply@ludwitt.academy&gt;
                        </span>
                        <span className="verify__subject">
                          Verify your email to join Cohort 4
                        </span>
                      </div>
                      <p className="verify__email-body">
                        Hi {registrant.firstName}, please confirm your email
                        address to activate your Ludwitt Academy account.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleVerify}
                      >
                        Verify my email
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-ghost registration__another"
              onClick={resetForm}
            >
              Register another student
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="section registration">
      <div className="container registration__inner">
        <aside className="registration__aside">
          <span className="eyebrow">Registration</span>
          <h2 className="section-title">Join Cohort 4</h2>
          <p className="section-lead">
            Apply to the Hult Developer Program. Tell us about your background
            and we'll get you set up for Cohort 4.
          </p>
          <ul className="registration__points">
            <li>
              <span aria-hidden="true">◆</span> Hands-on customer deployment
              projects
            </li>
            <li>
              <span aria-hidden="true">◆</span> 1:1 mentorship from senior FDEs
            </li>
            <li>
              <span aria-hidden="true">◆</span> Industry-recognised completion
              certificate
            </li>
          </ul>
        </aside>

        <form className="registration__form" onSubmit={handleSubmit} noValidate>
          <div className="reg-grid">
            <Field
              id="field-firstName"
              label="First name"
              required
              error={errors.firstName}
            >
              <input
                id="field-firstName"
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Ada"
              />
            </Field>

            <Field
              id="field-lastName"
              label="Last name"
              required
              error={errors.lastName}
            >
              <input
                id="field-lastName"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Lovelace"
              />
            </Field>

            <Field
              id="field-email"
              label="Email address"
              required
              error={errors.email}
            >
              <input
                id="field-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="ada@example.com"
              />
            </Field>

            <Field id="field-phone" label="Phone" error={errors.phone}>
              <input
                id="field-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </Field>

            <Field
              id="field-country"
              label="Country"
              required
              error={errors.country}
            >
              <input
                id="field-country"
                type="text"
                autoComplete="country-name"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                placeholder="United Kingdom"
              />
            </Field>

            <Field id="field-timezone" label="Time zone">
              <select
                id="field-timezone"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              >
                <option value="">Select time zone…</option>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="field-currentRole" label="Current role / title">
              <select
                id="field-currentRole"
                value={form.currentRole}
                onChange={(e) => update("currentRole", e.target.value)}
              >
                <option value="">Select role…</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="field-organization" label="Company / organization">
              <input
                id="field-organization"
                type="text"
                autoComplete="organization"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
                placeholder="Acme Corp (optional)"
              />
            </Field>

            <Field
              id="field-experience"
              label="Years of experience"
              required
              error={errors.experience}
            >
              <select
                id="field-experience"
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
              >
                <option value="">Select experience…</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="field-primaryStack"
              label="Primary tech stack"
              error={errors.primaryStack}
              full
            >
              <input
                id="field-primaryStack"
                type="text"
                value={form.primaryStack}
                onChange={(e) => update("primaryStack", e.target.value)}
                placeholder="e.g. TypeScript, Python, React, AWS (optional)"
              />
            </Field>

            <Field
              id="field-portfolio"
              label="Portfolio / GitHub / LinkedIn"
              error={errors.portfolio}
              full
            >
              <input
                id="field-portfolio"
                type="url"
                value={form.portfolio}
                onChange={(e) => update("portfolio", e.target.value)}
                placeholder="https://github.com/yourhandle"
              />
            </Field>

            <Field
              id="field-startDate"
              label="Preferred start date"
              required
              error={errors.startDate}
              full
            >
              <input
                id="field-startDate"
                type="date"
                min={START_DATE}
                max={START_DATE}
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </Field>

            <Field
              id="field-motivation"
              label="Why do you want to join?"
              full
            >
              <textarea
                id="field-motivation"
                rows={4}
                value={form.motivation}
                onChange={(e) => update("motivation", e.target.value)}
                placeholder="Tell us what draws you to forward deployed engineering…"
              />
            </Field>
          </div>

          <label
            className={`reg-check ${errors.agree ? "reg-check--error" : ""}`}
          >
            <input
              id="field-agree"
              type="checkbox"
              checked={form.agree}
              onChange={(e) => update("agree", e.target.checked)}
            />
            <span>
              I agree to the Ludwitt Academy program terms and privacy policy.
            </span>
          </label>
          {errors.agree && <p className="field__error">{errors.agree}</p>}

          <button type="submit" className="btn btn-primary btn-block reg-submit">
            Submit registration
          </button>
        </form>
      </div>
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: ReactNode;
}

function Field({ id, label, required, error, full, children }: FieldProps) {
  return (
    <div className={`field ${full ? "field--full" : ""}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && <span className="field__req"> *</span>}
      </label>
      <div className={`field__control ${error ? "field__control--error" : ""}`}>
        {children}
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
