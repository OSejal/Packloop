import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiMail, FiUser, FiTruck, FiPackage, FiCreditCard } from "react-icons/fi";
import { ReactTyped } from "react-typed";

const useQuickActions = (user) => {
  return useMemo(() => {
    if (!user) return [];

    const baseActions = [
      {
        to: "/profile",
        icon: <FiUser className="h-6 w-6 text-blue-600" />,
        bg: "bg-blue-100",
        title: "Profile",
        desc: "View and edit your profile",
      },
      {
        to: "/wallet",
        icon: <FiCreditCard className="h-6 w-6 text-green-600" />,
        bg: "bg-green-100",
        title: "Wallet",
        desc: "Manage your transactions",
      },
      {
        to: "/orders",
        icon: <FiPackage className="h-6 w-6 text-red-600" />,
        bg: "bg-red-100",
        title: "Orders",
        desc: "Track and manage orders",
      },
    ];

    if (user.role === "MCP") {
      baseActions.push({
        to: "/partners",
        icon: <FiUser className="h-6 w-6 text-purple-600" />,
        bg: "bg-purple-100",
        title: "Partners",
        desc: "Manage your pickup partners",
      });
    }

    if (user.role === "PICKUP_PARTNER") {
      baseActions.push({
        to: "/pickups",
        icon: <FiTruck className="h-6 w-6 text-yellow-600" />,
        bg: "bg-yellow-100",
        title: "Pickups",
        desc: "View and manage pickups",
      });
    }

    baseActions.push({
      href: "mailto:support@mcpsystem.com",
      icon: <FiMail className="h-6 w-6 text-gray-600" />,
      bg: "bg-gray-100",
      title: "Support",
      desc: "Contact our support team",
      isExternal: true,
    });

    return baseActions;
  }, [user]);
};

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const quickActions = useQuickActions(user);

  return (
    <div className="w-full">
      <div className="relative isolate overflow-hidden sm:py-24 lg:py-32 rounded-lg">
        <img
          src="/delivery.jpg"
          alt="Delivery"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      {/* Overlay (optional for better text readability) */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* TEXT SECTION */}
        <div className="text-left text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Fastest
          </h1>
          <h1 className="text-4xl font-bold tracking-tight text-orange-400 sm:text-6xl">
            <ReactTyped
              strings={["Delivery"]}
              typeSpeed={50}
              backSpeed={50}
              loop
            />
            <span className="text-white">&</span>
          </h1>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="text-white">Easy</span>{" "}
            <span className="text-orange-400">Pickup</span>
            <span className="text-white">.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-200">
            A platform for managing material collection and recycling partnerships
          </p>

          {isAuthenticated && (
            <button className="group relative flex pl-7 pr-7 justify-center rounded-full bg-green-600 px-3 py-3 mt-5 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-green-300">
              Get Started
            </button>
          )}

          {!isAuthenticated && (
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Get started
              </Link>

              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-white"
              >
                Sign in <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>

        </div>
      </div>


      {isAuthenticated && (
        <div className="mt-12 px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, idx) =>
              action.isExternal ? (
                <a
                  key={idx}
                  href={action.href}
                  className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${action.bg} rounded-full`}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="text-gray-600">{action.desc}</p>
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  key={idx}
                  to={action.to}
                  className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${action.bg} rounded-full`}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="text-gray-600">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
