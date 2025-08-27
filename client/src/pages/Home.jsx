import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ReactTyped } from "react-typed";

// Hook for quick actions
const useQuickActions = (user) => {
  return useMemo(() => {
    if (!user) return [];

    const baseActions = [
      {
        to: "/profile",
        icon: <img src="/user.png" className="h-12 w-12" />,
        bg: "bg-blue-100",
        title: "Profile",
        desc: "View and edit your profile",
      },
      {
        to: "/wallet",
        icon: <img src="/wallet.png" className="h-12 w-12" />,
        bg: "bg-green-100",
        title: "Wallet",
        desc: "Manage your transactions",
      },
      {
        to: "/orders",
        icon: <img src="/booking.png" className="h-12 w-12" />,
        bg: "bg-red-100",
        title: "Orders",
        desc: "Track and manage orders",
      },
    ];

    if (user.role === "MCP") {
      baseActions.push({
        to: "/partners",
        icon: <img src="/delivery-man.png" className="h-12 w-12" />,
        bg: "bg-purple-100",
        title: "Partners",
        desc: "Manage your pickup partners",
      });
    }

    if (user.role === "PICKUP_PARTNER") {
      baseActions.push({
        to: "/pickups",
        icon: <img src="/boy.png" className="h-12 w-12" />,
        bg: "bg-yellow-100",
        title: "Pickups",
        desc: "View and manage pickups",
      });
    }

    baseActions.push({
      href: "mailto:support@mcpsystem.com",
      icon: <img src="/gear.png" className="h-12 w-12" />,
      bg: "bg-gray-100",
      title: "Support",
      desc: "Contact our support team",
      isExternal: true,
    });

    return baseActions;
  }, [user]);
};

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const quickActions = useQuickActions(isAuthenticated ? user : null);

  // Show loading while auth state is being determined
  if (loading) {
  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="w-10 h-10 border-4 border-green-500 border-b-transparent rounded-full animate-spin"></div>
    </div>
  );
}


  return (
    <div className="w-full">
      <div className="relative isolate overflow-hidden sm:py-24 lg:py-32 rounded-lg">
        <img
          src="/delivery.jpg"
          alt="Delivery"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto px-6 lg:px-8">
          {/* TEXT SECTION */}
          <div className="text-left text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Fastest</h1>
            <h1 className="text-4xl font-bold tracking-tight text-orange-400 sm:text-6xl">
              <ReactTyped strings={["Delivery"]} typeSpeed={50} backSpeed={50} loop />
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

            {isAuthenticated ? (
              <button className="group relative flex pl-7 pr-7 justify-center rounded-full bg-green-600 px-3 py-3 mt-5 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-green-300">
                Get Started
              </button>
            ) : (
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

      {/* Quick Actions */}
      {isAuthenticated && user && (
        <div className="mt-12 px-4 text-center">

          {/* Hero Section Like Image */}
          <div className="relative bg-white py-10 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4 lg:px-8">
              
              {/* LEFT TEXT SECTION */}
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Your favorite food, just a few clicks away
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Discover an array of highly-rated local dining options that cater to every craving.
                  Indulge in delicious meals from your favorite restaurants, all while enjoying the
                  convenience of prompt and reliable delivery right to your doorstep. Experience the
                  joy of great food without the hassle, making every meal a delightful occasion.
                </p>

                {/* Stats */}
                <div className="mt-10 grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">5K+</p>
                    <p className="text-gray-600 text-sm">Satisfied Customer</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">15+</p>
                    <p className="text-gray-600 text-sm">Best Restaurants</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">10K+</p>
                    <p className="text-gray-600 text-sm">Food Delivered</p>
                  </div>
                </div>
              </div>

              {/* RIGHT IMAGE SECTION */}
              <div className="flex justify-center relative">
                <div className="bg-gradient-to-b from-pink-100 to-pink-200 rounded-3xl p-6">
                  <img
                    src="/boy.png"
                    alt="Delivery Guy"
                    className="w-72 h-auto object-cover"
                  />
                  {/* Floating buttons */}
                  <div className="absolute top-10 right-5 flex flex-col gap-3">
                    <button className="bg-white shadow px-4 py-2 rounded-full text-gray-800 font-medium">
                      Burgers
                    </button>
                    <button className="bg-white shadow px-4 py-2 rounded-full text-gray-800 font-medium">
                      Steaks
                    </button>
                    <button className="bg-white shadow px-4 py-2 rounded-full text-gray-800 font-medium">
                      Pizza
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-6 mt-4">Our Services</h2> 

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, idx) =>
            action.isExternal ? (
            <a
              key={idx}
              href={action.href}
              className={`block p-8 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 ${action.bg}`}
            >
              <div className="flex items-start gap-5 ">
                {/* Title + Desc on the right */}
                <div className="flex flex-col text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{action.desc}</p>
                </div>

                {/* Icon on the left */}
                <div className="flex h-12 w-12 items-center justify-center ">
                  <span className="text-2xl text-black">{action.icon}</span>
                </div>
              </div>
            </a>
           ) : (
          <Link
            key={idx}
            to={action.to}
            className={`block p-8 rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 ${action.bg}`}
          >
            <div className="flex items-start gap-5 ">
              {/* Title + Desc on the right */}
              <div className="flex flex-col text-left">
                <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{action.desc}</p>
              </div>

              {/* Icon on the left */}
              <div className="flex h-12 w-12 items-center justify-center ">
                <span className="text-2xl text-black">{action.icon}</span>
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
