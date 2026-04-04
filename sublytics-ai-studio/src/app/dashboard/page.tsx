import { TrendingUp, Users, Activity, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { label: "AI Generated", value: "12.4K", icon: Activity, color: "from-primary to-orange-600" },
    { label: "Active Users", value: "847", icon: Users, color: "from-secondary to-purple-600" },
    { label: "Revenue", value: "₹2.4L", icon: DollarSign, color: "from-accent to-pink-600" },
    { label: "Growth", value: "+23%", icon: TrendingUp, color: "from-green-500 to-emerald-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Welcome back, <span className="gradient-text">Admin</span>
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-card p-6 rounded-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-black gradient-text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: "New user registered", time: "5 minutes ago", type: "success" },
              { action: "AI content generated", time: "12 minutes ago", type: "primary" },
              { action: "Payment received", time: "1 hour ago", type: "success" },
              { action: "New workflow created", time: "2 hours ago", type: "secondary" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === "success" ? "bg-green-500" :
                  activity.type === "primary" ? "bg-primary" :
                  "bg-secondary"
                } animate-glow-pulse`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Staff", href: "/dashboard/staff" },
              { label: "View Analytics", href: "/dashboard/analytics" },
              { label: "Generate Content", href: "#" },
              { label: "Settings", href: "/dashboard/settings" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="p-4 glass-card rounded-xl hover:glow-border transition-all text-center group"
              >
                <p className="text-sm font-medium group-hover:gradient-text-primary transition-all">
                  {action.label}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Performance Overview</h2>
        <div className="h-64 rounded-lg bg-muted/30 flex items-center justify-center">
          <p className="text-muted-foreground">Chart visualization will go here</p>
        </div>
      </div>
    </div>
  );
}
