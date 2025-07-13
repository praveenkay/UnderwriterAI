import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import NotificationsPanel from "./NotificationsPanel";
import UserProfilePanel from "./UserProfilePanel";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const isAdmin = user?.role === 'zurich_admin';

  return (
    <header id="header" className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xl-swiss text-gray-900">Zurich Underwriter</span>
                  <div className="text-xs text-gray-500 font-medium tracking-wide">ZURICH AI UNDERWRITING</div>
                </div>
              </div>
            </Link>
            <nav className="flex space-x-8">
              <Link href="/" className={`text-sm tracking-wide pb-2 transition-colors ${
                isActive("/") 
                  ? "text-primary font-medium border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-900"
              }`}>
                DASHBOARD
              </Link>
              <Link href="/chat" className={`text-sm tracking-wide pb-2 transition-colors ${
                isActive("/chat") 
                  ? "text-primary font-medium border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-900"
              }`}>
                CHAT
              </Link>
              <Link href="/documents" className={`text-sm tracking-wide pb-2 transition-colors ${
                isActive("/documents") 
                  ? "text-primary font-medium border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-900"
              }`}>
                DOCUMENTS
              </Link>
              <Link href="/rules" className={`text-sm tracking-wide pb-2 transition-colors ${
                isActive("/rules") 
                  ? "text-primary font-medium border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-900"
              }`}>
                RULES
              </Link>
              <Link href="/analytics" className={`text-sm tracking-wide pb-2 transition-colors ${
                isActive("/analytics") 
                  ? "text-primary font-medium border-b-2 border-primary" 
                  : "text-gray-500 hover:text-gray-900"
              }`}>
                ANALYTICS
              </Link>
              {isAdmin && (
                <>
                  <Link href="/data-ingestion" className={`text-sm tracking-wide pb-2 transition-colors ${
                    isActive("/data-ingestion") 
                      ? "text-primary font-medium border-b-2 border-primary" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}>
                    DATA INGESTION
                  </Link>
                  <Link href="/document-library" className={`text-sm tracking-wide pb-2 transition-colors ${
                    isActive("/document-library") 
                      ? "text-primary font-medium border-b-2 border-primary" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}>
                    DOCUMENT LIBRARY
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationsPanel />
            <UserProfilePanel />
          </div>
        </div>
      </div>
    </header>
  );
}
