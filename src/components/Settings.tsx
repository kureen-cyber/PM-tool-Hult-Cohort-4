import { useEffect, useState } from "react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import "./Settings.css";

const SETTINGS_KEY = "hult-app-settings";

export interface AppSettings {
  aiAssistantEnabled: boolean;
  showProgressBars: boolean;
  emailDigest: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  aiAssistantEnabled: true,
  showProgressBars: true,
  emailDigest: false,
};

export function loadAppSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveAppSettings(next: AppSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("hult-settings-changed", { detail: next }));
}

export default function Settings() {
  const { user, firebaseEnabled, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="section settings">
      <div className="container settings__inner">
        <div className="settings__head">
          <span className="eyebrow">Workspace</span>
          <h2 className="section-title">Settings</h2>
          <p className="section-lead">
            Manage your account, theme, and assistant preferences for the cohort
            PM tool.
          </p>
        </div>

        <div className="settings__grid">
          <article className="settings-card">
            <h3>Account</h3>
            {user ? (
              <dl className="settings-dl">
                <div>
                  <dt>Name</dt>
                  <dd>{user.displayName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{ROLE_LABELS[user.role]}</dd>
                </div>
                <div>
                  <dt>Email verified</dt>
                  <dd>{user.emailVerified ? "Yes" : "Pending"}</dd>
                </div>
                <div>
                  <dt>Auth</dt>
                  <dd>
                    {firebaseEnabled
                      ? "Firebase (multi-user / cohort-scale)"
                      : "Not configured"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="settings-muted">
                Sign in with your real participant credentials to sync projects
                across the cohort.
              </p>
            )}
            {user && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  void logout();
                }}
              >
                Log out
              </button>
            )}
          </article>

          <article className="settings-card">
            <h3>Appearance</h3>
            <label className="settings-field">
              <span>Theme</span>
              <select
                value={theme}
                onChange={(e) =>
                  setTheme(e.target.value as "light" | "dark")
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.showProgressBars}
                onChange={(e) => update("showProgressBars", e.target.checked)}
              />
              Show personal &amp; cohort progress bars
            </label>
          </article>

          <article className="settings-card">
            <h3>AI assistant</h3>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.aiAssistantEnabled}
                onChange={(e) =>
                  update("aiAssistantEnabled", e.target.checked)
                }
              />
              Enable floating AI assistant
            </label>
            <p className="settings-muted">
              The assistant uses your live projects and tasks to suggest next
              steps. Optional cloud model: set{" "}
              <code>VITE_OPENAI_API_KEY</code> in <code>.env.local</code>.
            </p>
          </article>

          <article className="settings-card">
            <h3>Notifications</h3>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.emailDigest}
                onChange={(e) => update("emailDigest", e.target.checked)}
              />
              Prefer weekly digest reminders (stored locally for now)
            </label>
          </article>
        </div>
      </div>
    </section>
  );
}
