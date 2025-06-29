import React from 'react';
import { TabType } from '@/types/type';

interface NavTabsProps {
    tabs: TabType[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <nav className="bg-black shadow items-center content-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 justify-center"> 
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center px-3 py-4 text-sm font-sans border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-300 hover:text-gray-400 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default NavTabs;