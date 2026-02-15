import { Pane, SplitNode } from '../types/tab'

interface SplitPaneProps {
  node: SplitNode | Pane
  renderPane: (pane: Pane) => React.ReactNode
}

export default function SplitPane({ node, renderPane }: SplitPaneProps) {
  if ('sessionId' in node) {
    return <div className="h-full">{renderPane(node)}</div>
  }

  const direction = node.direction
  const isHorizontal = direction === 'horizontal'

  return (
    <div className={`flex h-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
      <div className={isHorizontal ? 'w-1/2' : 'h-1/2'}>
        <SplitPane node={node.children[0]} renderPane={renderPane} />
      </div>
      <div className="bg-gray-700" style={isHorizontal ? { width: 2 } : { height: 2 }} />
      <div className={isHorizontal ? 'w-1/2' : 'h-1/2'}>
        <SplitPane node={node.children[1]} renderPane={renderPane} />
      </div>
    </div>
  )
}
