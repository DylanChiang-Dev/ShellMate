export interface Tab {
  id: string
  title: string
  panes: Pane[]
  activePaneId: string
}

export interface Pane {
  id: string
  sessionId: string | null
  type: 'local' | 'ssh'
}

export type SplitDirection = 'horizontal' | 'vertical'

export interface SplitNode {
  id: string
  direction: SplitDirection
  children: [SplitNode | Pane, SplitNode | Pane]
}
