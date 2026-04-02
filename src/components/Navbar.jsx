import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness, businessConfig } from '@/contexts/BusinessContext';
import {
  Home,
  Box,
  Layers,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  BarChart4,
  Settings,
  X,
  GraduationCap,
  ChevronDown,
  Check,
} from 'lucide-react';

const links = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/products', label: 'Products', icon: Box },
  { path: '/inventory', label: 'Inventory', icon: Layers },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/purchases', label: 'Purchases', icon: Truck },
  { path: '/suppliers', label: 'Suppliers', icon: Users },
  { path: '/students', label: 'Students', icon: GraduationCap },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/reports', label: 'Reports', icon: BarChart4 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const settings = useSettings();
  const { activeBusiness, switchBusiness } = useBusiness();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const shopName = settings?.shopName ?? 'Simple Shop';
  const currentConfig = businessConfig[activeBusiness];

  const handleSwitchBusiness = (business) => {
    switchBusiness(business);
    setShowSwitcher(false);
    setDrawerOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-lg lg:hidden"
      >
        <span className="text-lg">☰</span>
        <span>{shopName}</span>
      </button>

      <nav className="hidden w-72 flex-none flex-col border-r border-slate-200 bg-white px-4 py-6 text-slate-800 lg:flex">
        {/* Business Switcher */}
        <div className="mb-6">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-200 ${
              showSwitcher
                ? `${currentConfig.borderColor} ${currentConfig.lightBgColor}`
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentConfig.icon}</span>
              <div className="text-left">
                <p className="text-xs text-slate-500">Active Business</p>
                <p className="text-sm font-semibold text-slate-900">{currentConfig.name}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showSwitcher ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown switcher */}
          {showSwitcher && (
            <div className="mt-2 space-y-1 p-1">
              {(Object.keys(businessConfig)).map((biz) => {
                const config = businessConfig[biz];
                const isActive = activeBusiness === biz;
                return (
                  <button
                    key={biz}
                    onClick={() => handleSwitchBusiness(biz)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                      isActive
                        ? `${config.lightBgColor} border-2 ${config.borderColor} font-semibold`
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="flex-1 text-left text-slate-700">{config.name}</span>
                    {isActive && (
                      <Check className={`h-4 w-4 ${config.textColor}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Logo and Shop Name */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${currentConfig.gradient} text-white shadow-sm`}>
            ERP
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Offline Shop</p>
            <h1 className="text-xl font-semibold">{shopName}</h1>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1 flex-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                  active
                    ? `${currentConfig.lightBgColor} ${currentConfig.lightTextColor}`
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? currentConfig.textColor : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className={`mt-auto rounded-2xl border-2 ${currentConfig.borderColor} ${currentConfig.lightBgColor} p-4 text-sm ${currentConfig.lightTextColor}`}>
          <p className="font-medium">{currentConfig.name}</p>
          <p className="text-slate-500 text-xs mt-1">Fully offline ERP system</p>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white shadow-2xl transition-transform duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${currentConfig.gradient} text-white shadow-sm`}>
                  ERP
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Offline Shop</p>
                  <h1 className="text-base font-semibold text-slate-900">{shopName}</h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Business Switcher */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Active Business</p>
              <div className="flex gap-2">
                {(Object.keys(businessConfig)).map((biz) => {
                  const config = businessConfig[biz];
                  const isActive = activeBusiness === biz;
                  return (
                    <button
                      key={biz}
                      onClick={() => handleSwitchBusiness(biz)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? `${config.lightBgColor} border-2 ${config.borderColor} font-semibold`
                          : 'border-2 border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-[10px] text-center leading-tight">{config.name.split('/')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-1 px-4 py-4">
              {links.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? `${currentConfig.lightBgColor} ${currentConfig.lightTextColor}`
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? currentConfig.textColor : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}