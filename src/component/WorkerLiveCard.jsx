import { useState, useEffect, useRef } from "react";

const STATES = ["not-checked-in", "active", "idle", "issue"];

const stateConfig = {
    "not-checked-in": {
        label: "Not Checked-in",
        color: "#94a3b8",
        colorLight: "#f1f5f9",
        colorBorder: "#cbd5e1",
        colorText: "#64748b",
        bgGrad: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        headerBg: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        pulse: false,
        icon: "⚪",
    },
    active: {
        label: "Active",
        color: "#22c55e",
        colorLight: "#f0fdf4",
        colorBorder: "#86efac",
        colorText: "#15803d",
        bgGrad: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        headerBg: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
        pulse: true,
        icon: "🟢",
    },
    idle: {
        label: "Idle",
        color: "#f59e0b",
        colorLight: "#fffbeb",
        colorBorder: "#fcd34d",
        colorText: "#b45309",
        bgGrad: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        headerBg: "linear-gradient(135deg, #78350f 0%, #92400e 100%)",
        pulse: true,
        icon: "🟡",
    },
    issue: {
        label: "Issue",
        color: "#ef4444",
        colorLight: "#fef2f2",
        colorBorder: "#fca5a5",
        colorText: "#b91c1c",
        bgGrad: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        headerBg: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
        pulse: true,
        icon: "🔴",
    },
};

const workerData = {
    name: "Rudi Hartono",
    role: "Security Guard",
    site: "Mall Alam Sutera",
    shift: "08:00 – 16:00",
    checkinTime: "07:58",
    battery: 73,
    connectivity: "Good",
    currentActivity: "Patrol Area B",
    lastActivity: "2 min ago",
    locationStatus: "Inside Site",
};

function Avatar() {
    return (
        <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#fff",
            border: "2.5px solid rgba(255,255,255,0.3)",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
        }}>
            RH
        </div>
    );
}

function PulseDot({ color, active }) {
    return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
            {active && (
                <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: color, opacity: 0.35,
                    animation: "pulse-ring 1.5s ease-out infinite",
                }} />
            )}
            <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color,
                display: "block",
                border: "2px solid #fff",
                boxShadow: `0 0 0 1px ${color}55`,
            }} />
        </span>
    );
}

function StatusBadge({ state }) {
    const cfg = stateConfig[state];
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: cfg.color + "22",
            border: `1.5px solid ${cfg.color}55`,
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700,
            color: cfg.colorText,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
        }}>
            <PulseDot color={cfg.color} active={cfg.pulse} />
            {cfg.label}
        </span>
    );
}

function BatteryIcon({ pct }) {
    const color = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
            <span style={{
                display: "inline-flex", alignItems: "center",
                border: "1.5px solid #94a3b8", borderRadius: 3,
                padding: "1px 2px", gap: 1, position: "relative"
            }}>
                <span style={{
                    width: Math.max(3, pct * 0.2), height: 8, borderRadius: 1.5,
                    background: color, transition: "width 0.3s"
                }} />
                <span style={{
                    position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 5, borderRadius: "0 2px 2px 0", background: "#94a3b8"
                }} />
            </span>
            <span style={{ fontWeight: 600, color }}>{pct}%</span>
        </span>
    );
}

function SignalIcon({ status }) {
    const color = status === "Good" ? "#22c55e" : status === "Weak" ? "#f59e0b" : "#ef4444";
    const bars = [0.35, 0.65, 1];
    const active = status === "Good" ? 3 : status === "Weak" ? 2 : 1;
    return (
        <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5 }}>
            {bars.map((h, i) => (
                <span key={i} style={{
                    width: 3, height: 10 * h, borderRadius: 1.5,
                    background: i < active ? color : "#cbd5e1",
                    display: "block", transition: "background 0.3s"
                }} />
            ))}
            <span style={{ fontSize: 11, marginLeft: 3, color: "#64748b", fontWeight: 600 }}>{status}</span>
        </span>
    );
}

function InfoRow({ icon, label, value, valueColor }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 80 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || "#1e293b", marginLeft: "auto" }}>{value}</span>
        </div>
    );
}

function ActionBtn({ label, icon, primary, color, onClick }) {
    const [pressed, setPressed] = useState(false);
    return (
        <button
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onClick={onClick}
            style={{
                flex: 1, minWidth: 0,
                padding: "10px 8px",
                borderRadius: 12,
                border: primary ? "none" : `1.5px solid ${color || "#e2e8f0"}`,
                background: primary
                    ? (color || "#3b82f6")
                    : "#fff",
                color: primary ? "#fff" : (color || "#475569"),
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                boxShadow: primary ? `0 4px 14px ${(color || "#3b82f6")}44` : "0 1px 3px rgba(0,0,0,0.07)",
                transform: pressed ? "scale(0.97)" : "scale(1)",
                transition: "all 0.13s",
                letterSpacing: "0.01em",
            }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

function AlertBanner({ icon, text, color }) {
    return (
        <div style={{
            background: color + "18",
            border: `1.5px solid ${color}55`,
            borderRadius: 10,
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
            animation: "alert-shake 0.4s ease"
        }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 12.5, color, fontWeight: 600 }}>{text}</span>
        </div>
    );
}

function WorkerCard({ state, showLabel }) {
    const cfg = stateConfig[state];
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const timeStr = time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return (
        <div style={{ width: "100%", maxWidth: 360 }}>
            {showLabel && (
                <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#94a3b8",
                    marginBottom: 8, paddingLeft: 4
                }}>
                    State: {cfg.label}
                </div>
            )}

            <div style={{
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: `0 8px 32px rgba(0,0,0,0.13), 0 1.5px 4px rgba(0,0,0,0.07)`,
                background: "#fff",
                border: `1px solid ${cfg.colorBorder}`,
                fontFamily: "'DM Sans', 'Nunito', sans-serif",
                transition: "box-shadow 0.3s",
            }}>

                {/* Header */}
                <div style={{
                    background: cfg.headerBg,
                    padding: "16px 18px 14px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Background pattern */}
                    <div style={{
                        position: "absolute", inset: 0, opacity: 0.07,
                        backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)",
                    }} />
                    <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        position: "relative", zIndex: 1,
                    }}>
                        <Avatar />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                                {workerData.name}
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: 500 }}>
                                {workerData.role} · {workerData.site}
                            </div>
                        </div>
                        <StatusBadge state={state} />
                    </div>

                    {/* Live clock */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        marginTop: 12, paddingTop: 10,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        position: "relative", zIndex: 1,
                    }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            🕐 Live
                        </span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                            {timeStr}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                            Shift: {workerData.shift}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "14px 18px", background: cfg.bgGrad }}>

                    {/* Not checked-in — minimal */}
                    {state === "not-checked-in" && (
                        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                            <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                                Not Yet Checked-in
                            </div>
                            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
                                Your shift starts at <b>08:00</b>. Please check in to begin work.
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <ActionBtn label="Check-in Now" icon="📍" primary color="#3b82f6" />
                                <ActionBtn label="Contact Supervisor" icon="📞" color="#64748b" />
                            </div>
                        </div>
                    )}

                    {/* Active — full info */}
                    {state === "active" && (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                                <InfoRow icon="📍" label="Location" value="Inside Site" valueColor="#15803d" />
                                <InfoRow icon="⏰" label="Check-in" value={`${workerData.checkinTime} WIB`} />
                                <InfoRow icon="🏃" label="Activity" value={workerData.currentActivity} valueColor="#1d4ed8" />
                                <InfoRow icon="🕐" label="Last Update" value={workerData.lastActivity} />
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 16,
                                background: "rgba(255,255,255,0.7)", borderRadius: 10,
                                padding: "8px 12px", marginBottom: 14,
                                border: "1px solid #dcfce7"
                            }}>
                                <BatteryIcon pct={workerData.battery} />
                                <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
                                <SignalIcon status={workerData.connectivity} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <ActionBtn label="Scan Patrol" icon="📷" primary color="#22c55e" />
                                <ActionBtn label="Submit Report" icon="📝" color="#3b82f6" />
                                <ActionBtn label="Check-out" icon="🚪" color="#64748b" />
                            </div>
                        </>
                    )}

                    {/* Idle — warning */}
                    {state === "idle" && (
                        <>
                            <AlertBanner icon="⚠️" text="No activity for 25 minutes. Please resume patrol." color="#f59e0b" />
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
                                <InfoRow icon="📍" label="Location" value="Inside Site" valueColor="#15803d" />
                                <InfoRow icon="⏰" label="Check-in" value={`${workerData.checkinTime} WIB`} />
                                <InfoRow icon="🏃" label="Last Activity" value="25 min ago" valueColor="#b45309" />
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 16,
                                background: "rgba(255,255,255,0.7)", borderRadius: 10,
                                padding: "8px 12px", marginBottom: 14,
                                border: "1px solid #fde68a"
                            }}>
                                <BatteryIcon pct={42} />
                                <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
                                <SignalIcon status="Weak" />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <ActionBtn label="Resume Work" icon="▶️" primary color="#f59e0b" />
                                <ActionBtn label="Scan Patrol" icon="📷" color="#64748b" />
                                <ActionBtn label="Report Reason" icon="📝" color="#64748b" />
                            </div>
                        </>
                    )}

                    {/* Issue — urgent */}
                    {state === "issue" && (
                        <>
                            <AlertBanner icon="🚨" text="Outside geofence! Return to assigned site immediately." color="#ef4444" />
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
                                <InfoRow icon="📍" label="Location" value="Outside Site" valueColor="#b91c1c" />
                                <InfoRow icon="⏰" label="Check-in" value={`${workerData.checkinTime} WIB`} />
                                <InfoRow icon="🏃" label="Last Activity" value="8 min ago" valueColor="#b91c1c" />
                                <InfoRow icon="📡" label="GPS" value="Detected 850m away" valueColor="#b91c1c" />
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 16,
                                background: "rgba(255,255,255,0.7)", borderRadius: 10,
                                padding: "8px 12px", marginBottom: 14,
                                border: "1px solid #fca5a5"
                            }}>
                                <BatteryIcon pct={18} />
                                <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
                                <SignalIcon status="Good" />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <ActionBtn label="Contact Supervisor" icon="📞" primary color="#ef4444" />
                                <ActionBtn label="Navigate Back" icon="🗺️" color="#ef4444" />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer tab */}
                <div style={{
                    background: "#f8fafc",
                    borderTop: `1px solid ${cfg.colorBorder}`,
                    padding: "8px 18px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                        🛡️ Autsorz Field Ops
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: cfg.colorText,
                        background: cfg.color + "18",
                        border: `1px solid ${cfg.color}44`,
                        borderRadius: 20, padding: "2px 10px"
                    }}>
                        {cfg.icon} {cfg.label}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const [activeState, setActiveState] = useState(null); // null = show all
    const [darkBg, setDarkBg] = useState(false);

    const shown = activeState ? [activeState] : STATES;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes alert-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }

        body {
          font-family: 'DM Sans', sans-serif;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

            <div style={{
                minHeight: "100vh",
                background: darkBg
                    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                    : "linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)",
                padding: "28px 16px 48px",
                transition: "background 0.4s",
            }}>

                {/* Page header */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: darkBg ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.8)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 99, padding: "4px 14px 4px 6px",
                        marginBottom: 14, backdropFilter: "blur(10px)",
                    }}>
                        <span style={{
                            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                            borderRadius: 99, padding: "3px 10px",
                            fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.06em"
                        }}>AUTSORZ</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: darkBg ? "#94a3b8" : "#64748b" }}>
                            Field Operations UI
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 22, fontWeight: 800,
                        color: darkBg ? "#f1f5f9" : "#0f172a",
                        letterSpacing: "-0.02em", marginBottom: 6,
                    }}>
                        Worker Live Operation Card
                    </h1>
                    <p style={{ fontSize: 13, color: darkBg ? "#64748b" : "#94a3b8", fontWeight: 500 }}>
                        Real-time status + action hub — 4 states
                    </p>
                </div>

                {/* State filter tabs */}
                <div style={{
                    display: "flex", gap: 8, justifyContent: "center",
                    flexWrap: "wrap", marginBottom: 28,
                }}>
                    <button onClick={() => setActiveState(null)} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        border: "1.5px solid",
                        borderColor: !activeState ? "#3b82f6" : "#e2e8f0",
                        background: !activeState ? "#3b82f6" : (darkBg ? "rgba(255,255,255,0.05)" : "#fff"),
                        color: !activeState ? "#fff" : (darkBg ? "#94a3b8" : "#64748b"),
                        cursor: "pointer", transition: "all 0.15s",
                    }}>All States</button>
                    {STATES.map(s => {
                        const cfg = stateConfig[s];
                        return (
                            <button key={s} onClick={() => setActiveState(s)} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                                border: `1.5px solid ${activeState === s ? cfg.color : "#e2e8f0"}`,
                                background: activeState === s ? cfg.color : (darkBg ? "rgba(255,255,255,0.05)" : "#fff"),
                                color: activeState === s ? "#fff" : (darkBg ? "#94a3b8" : "#64748b"),
                                cursor: "pointer", transition: "all 0.15s",
                            }}>{cfg.icon} {cfg.label}</button>
                        );
                    })}
                    <button onClick={() => setDarkBg(b => !b)} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        border: "1.5px solid #e2e8f0",
                        background: darkBg ? "rgba(255,255,255,0.1)" : "#fff",
                        color: darkBg ? "#94a3b8" : "#64748b",
                        cursor: "pointer",
                    }}>{darkBg ? "☀️ Light BG" : "🌙 Dark BG"}</button>
                </div>

                {/* Cards grid */}
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 24,
                    justifyContent: "center",
                    alignItems: "flex-start",
                }}>
                    {shown.map(s => (
                        <WorkerCard key={s} state={s} showLabel={!activeState} />
                    ))}
                </div>

                {/* Footer note */}
                <div style={{
                    textAlign: "center", marginTop: 36,
                    fontSize: 11, color: darkBg ? "#475569" : "#94a3b8", fontWeight: 500,
                }}>
                    Designed for Autsorz · Adrifa E-Patrol · Consteon Field Ops Platform
                </div>
            </div>
        </>
    );
}
