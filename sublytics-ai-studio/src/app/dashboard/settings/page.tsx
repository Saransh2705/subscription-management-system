import { Settings as SettingsIcon, User, Bell, Lock, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Settings <span className="gradient-text">&amp; Preferences</span>
        </h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: "Profile Settings",
            desc: "Update your personal information",
            icon: User,
            color: "from-primary to-orange-600",
          },
          {
            title: "Notifications",
            desc: "Configure email and push notifications",
            icon: Bell,
            color: "from-secondary to-purple-600",
          },
          {
            title: "Security",
            desc: "Password and authentication settings",
            icon: Lock,
            color: "from-accent to-pink-600",
          },
          {
            title: "Appearance",
            desc: "Theme and display preferences",
            icon: Palette,
            color: "from-green-500 to-emerald-600",
          },
        ].map((setting) => {
          const Icon = setting.icon;
          return (
            <div
              key={setting.title}
              className="glass-card p-6 rounded-2xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${setting.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:gradient-text-primary transition-all">
                {setting.title}
              </h3>
              <p className="text-sm text-muted-foreground">{setting.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Settings Form Placeholder */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input type="text" className="dark-input w-full" placeholder="Your Company" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" className="dark-input w-full" placeholder="admin@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select className="dark-input w-full">
              <option>Asia/Kolkata (IST)</option>
              <option>America/New_York (EST)</option>
              <option>Europe/London (GMT)</option>
            </select>
          </div>
          <button className="glow-button px-6 py-3 rounded-xl">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
