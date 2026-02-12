'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ChevronRight, Minus, Plus, Users } from 'lucide-react'

export interface MindmapNodeData extends Record<string, unknown> {
  name: string
  role: string
  city?: string | null
  childrenCount: number
  isMe?: boolean
  status?: string
  hasChildren?: boolean
  level?: number
  isExpanded?: boolean
  onExpand?: (e: React.MouseEvent) => void
  onCollapse?: (e: React.MouseEvent) => void
}

function MindmapNodeComponent(props: NodeProps<Node<MindmapNodeData>>) {
  const { data, selected } = props
  const isMe = data.isMe ?? false
  const isActive = data.status === 'ACTIVE'
  const hasChildren = (data.hasChildren ?? data.childrenCount > 0)
  const isExpanded = data.isExpanded ?? false
  const onExpand = data.onExpand
  const onCollapse = data.onCollapse

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2 !border-slate-500 !bg-slate-700" />
      <div
        className={`
          min-w-[160px] max-w-[200px] rounded-xl border-2 shadow-lg transition-all duration-200
          ${isMe
            ? 'bg-emerald-900/90 border-emerald-500 shadow-emerald-500/20'
            : 'bg-slate-800/95 border-slate-600 hover:border-slate-500'
          }
          ${selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}
        `}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-1">
            <p className={`font-semibold truncate text-sm ${isMe ? 'text-emerald-100' : 'text-white'}`}>
              {data.name}
            </p>
            {hasChildren && (
              <span className="shrink-0 flex items-center gap-0.5">
                {isExpanded ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCollapse?.(e) }}
                    className="w-6 h-6 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-slate-300"
                    title="Collapse"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onExpand?.(e) }}
                    className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
                    title="Expand"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
              {data.role}
            </span>
            {data.childrenCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-slate-400">
                <Users className="w-3 h-3" />
                {data.childrenCount}
              </span>
            )}
          </div>
          {data.city && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{data.city}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isActive ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
              title={isActive ? 'Active' : 'Inactive'}
            />
            {isMe && (
              <span className="text-xs font-medium text-emerald-400">Me</span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2 !border-slate-500 !bg-slate-700" />
    </>
  )
}

export const MindmapNode = memo(MindmapNodeComponent)
