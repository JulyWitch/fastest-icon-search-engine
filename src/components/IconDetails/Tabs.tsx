import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs = ['Preview', 'Code', 'React'];
  
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 -mb-px ${
            activeTab === tab
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}