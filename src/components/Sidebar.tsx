import { LayoutDashboard, Users, Network, Clock, FileText, Settings } from "lucide-react";
import { MonitorSmartphone } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import logo from "../assets/AGS_logo.png"
import { useAuth } from "../auth/AuthProvider";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/users", icon: Users },
    { label: "Devices", href: "/devices", icon: MonitorSmartphone },
    { label: "Reports", href: "/reports", icon: FileText },
    // { label: "Group Management", href: "/group-management", icon: Group },
    { label: "Remote/Time Group", href: "/remote-management", icon: Clock },
    // { label: "Firmware Check", href: "/firm-check", icon: IoHardwareChipSharp },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const {logout} = useAuth();

    const handleLogout = async () => {
       await logout();
        navigate("/login");
    };

    return (
        <div className="flex flex-col h-full bg-primary">

            {/* Navigation items */}
            <nav className="flex-1 space-y-2 p-5">
                <img src={logo} alt="logo" className="bg-white/90 p-4 rounded-2xl" />
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const active = location.pathname === href;

                    return (
                        <Link
                            key={href}
                            to={href}
                            className={`group flex items-center gap-3 p-2 rounded-md transition
        ${active
                                    ? "bg-secondary text-primary font-semibold"
                                    : "text-white hover:bg-gray-200 hover:text-primary"
                                }`}
                        >
                            <Icon
                                size={18}
                                className={`${active ? "text-primary" : "text-white group-hover:text-primary"}`}
                            />
                            <span>{label}</span>
                        </Link>
                    );
                })}


            </nav>

            {/* Logout section */}
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-2 m-3 rounded-md hover:bg-red-200 hover:text-red-600 border text-white transition mt-auto"
            >
                <LogOut size={18} />
                Logout
            </button>
        </div>
    );
}
