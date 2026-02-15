import { Tab } from '../types/tab'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab: () => void
}

export default function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }: TabBarProps) {
  return (
    <div className="flex bg-gray-800 border-b border-gray-700">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center px-3 py-2 cursor-pointer ${
            activeTabId === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span>{tab.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onTabClose(tab.id) }}
            className="ml-2 text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="px-3 py-2 text-gray-400 hover:text-white"
      >
        +
      </button>
    </div>
  )
}
