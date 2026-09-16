import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  LayoutDashboard,
  Bell,
  Database,
  Save,
  RotateCcw,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  currency: "INR",
  compactNumbers: false,
  autoRefresh: true,
  refreshInterval: "15",
  emailNotifications: true,
  reportNotifications: true,
  dashboardDensity: "comfortable",
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("crm-analytics-settings");

    if (stored) {
      try {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      } catch {
        localStorage.removeItem("crm-analytics-settings");
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem(
      "crm-analytics-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("crm-analytics-settings");
    setSaved(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">SYSTEM</div>
          <h1>Settings</h1>
          <p>
            Configure dashboard behavior, data preferences, and
            notifications.
          </p>
        </div>

        <div className="settings-actions">
          <button className="secondary-button" onClick={resetSettings}>
            <RotateCcw size={16} />
            Reset
          </button>

          <button className="primary-button" onClick={saveSettings}>
            <Save size={16} />
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <section className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <SettingsIcon size={19} />
            </div>
            <div>
              <h2>General</h2>
              <p>Control how information is displayed across the application.</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-row">
              <div>
                <strong>Currency</strong>
                <span>Currency used for revenue and transaction values.</span>
              </div>

              <select
                value={settings.currency}
                onChange={(event) =>
                  updateSetting("currency", event.target.value)
                }
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>Compact numbers</strong>
                <span>
                  Display large values in abbreviated form such as 1.2M.
                </span>
              </div>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.compactNumbers}
                  onChange={(event) =>
                    updateSetting("compactNumbers", event.target.checked)
                  }
                />
                <span />
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <LayoutDashboard size={19} />
            </div>
            <div>
              <h2>Dashboard</h2>
              <p>Configure dashboard refresh and layout preferences.</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-row">
              <div>
                <strong>Automatic refresh</strong>
                <span>
                  Automatically refresh dashboard data at regular intervals.
                </span>
              </div>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(event) =>
                    updateSetting("autoRefresh", event.target.checked)
                  }
                />
                <span />
              </label>
            </div>

            <div className="settings-row">
              <div>
                <strong>Refresh interval</strong>
                <span>How frequently dashboard data should refresh.</span>
              </div>

              <select
                value={settings.refreshInterval}
                disabled={!settings.autoRefresh}
                onChange={(event) =>
                  updateSetting("refreshInterval", event.target.value)
                }
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>Dashboard density</strong>
                <span>Choose the amount of information shown on each screen.</span>
              </div>

              <select
                value={settings.dashboardDensity}
                onChange={(event) =>
                  updateSetting("dashboardDensity", event.target.value)
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <Bell size={19} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>Choose which application notifications are enabled.</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-row">
              <div>
                <strong>Email notifications</strong>
                <span>Receive important application updates by email.</span>
              </div>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) =>
                    updateSetting("emailNotifications", event.target.checked)
                  }
                />
                <span />
              </label>
            </div>

            <div className="settings-row">
              <div>
                <strong>Report notifications</strong>
                <span>Receive notifications when reports are ready.</span>
              </div>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.reportNotifications}
                  onChange={(event) =>
                    updateSetting(
                      "reportNotifications",
                      event.target.checked
                    )
                  }
                />
                <span />
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <Database size={19} />
            </div>
            <div>
              <h2>Data</h2>
              <p>Information about the analytics data source.</p>
            </div>
          </div>

          <div className="data-status">
            <div>
              <strong>CRM Analytics Database</strong>
              <span>Connected through the application API.</span>
            </div>

            <div className="connection-status">
              <span />
              Connected
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
