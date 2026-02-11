'use client'

import { useCallback, useEffect, useState, memo } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'

export interface TreeNode {
  id: string
  name: string
  role: string
  city?: string | null
  status: string
  childrenCount: number
  children?: TreeNode[]
  _loaded?: boolean
  parentId?: string | null
}

function getHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function buildTreeFromFlat(flat: (TreeNode & { parentId?: string | null })[]): TreeNode | null {
  const byId = new Map<string, TreeNode>()
  flat.forEach((n) => byId.set(n.id, { ...n, children: [], parentId: undefined, _loaded: true }))
  let root: TreeNode | null = null
  flat.forEach((n) => {
    const node = byId.get(n.id)!
    if (!n.parentId) {
      root = node
      return
    }
    const parent = byId.get(n.parentId)
    if (parent?.children) parent.children.push(node)
  })
  return root
}

const NodeCard = memo(function NodeCard({
  node,
  isMe,
  depth,
  isExpanded,
  onToggle,
  onLoadChildren,
}: {
  node: TreeNode
  isMe: boolean
  depth: number
  isExpanded: boolean
  onToggle: () => void
  onLoadChildren: () => void
}) {
  const hasChildren = node.childrenCount > 0
  const showExpand = hasChildren && !node._loaded
  const showCollapse = hasChildren && node._loaded && (node.children?.length ?? 0) > 0

  const handleExpand = () => {
    if (!node._loaded) onLoadChildren()
    onToggle()
  }

  const isActive = node.status === 'ACTIVE'
  const indent = depth * 24

  return (
    <div className="flex items-stretch" style={{ marginLeft: indent }}>
      <div
        className={`
          flex-1 min-w-0 rounded-xl border-2 shadow-md transition-all duration-200
          ${isMe
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 text-white shadow-emerald-900/30'
            : 'bg-slate-700 border-slate-600 text-white hover:border-emerald-500/70 hover:bg-slate-600/90'
          }
        `}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          {(showExpand || showCollapse) && (
            <button
              type="button"
              onClick={handleExpand}
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-600 hover:bg-emerald-600/50 text-slate-200'}
              `}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-8 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${isMe ? 'text-white' : 'text-white'}`}>
              {node.name}
              {isMe && (
                <span className="ml-2 text-emerald-200 text-sm font-medium">(You)</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                  ${isMe ? 'bg-white/20 text-emerald-100' : 'bg-slate-600 text-slate-200'}
                `}
              >
                {node.role}
              </span>
              {node.childrenCount > 0 && (
                <span
                  className={`
                    inline-flex items-center gap-1 text-xs
                    ${isMe ? 'text-emerald-200' : 'text-slate-300'}
                  `}
                >
                  <Users className="w-3.5 h-3.5" />
                  {node.childrenCount} in team
                </span>
              )}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`}
                title={isActive ? 'Active' : 'Inactive'}
              />
            </div>
            {node.city && (
              <p className={`text-xs mt-0.5 truncate ${isMe ? 'text-emerald-200/90' : 'text-slate-400'}`}>
                {node.city}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

const TreeLevel = memo(function TreeLevel({
  node,
  meId,
  depth,
  expandedIds,
  setExpandedIds,
  loadChildren,
  patchNode,
}: {
  node: TreeNode
  meId: string
  depth: number
  expandedIds: Set<string>
  setExpandedIds: (fn: (prev: Set<string>) => Set<string>) => void
  loadChildren: (id: string) => void
  patchNode: (id: string, patch: Partial<TreeNode> | ((n: TreeNode) => TreeNode)) => void
}) {
  const isMe = node.id === meId
  const isExpanded = expandedIds.has(node.id)
  const children = node.children ?? []

  return (
    <div className="space-y-2">
      <NodeCard
        node={node}
        isMe={isMe}
        depth={depth}
        isExpanded={isExpanded}
        onToggle={() =>
          setExpandedIds((prev) => {
            const next = new Set(prev)
            if (next.has(node.id)) next.delete(node.id)
            else next.add(node.id)
            return next
          })
        }
        onLoadChildren={() => loadChildren(node.id)}
      />
      {isExpanded && children.length > 0 && (
        <div className="relative border-l-2 border-slate-500 pl-4 ml-2 space-y-2">
            {children.map((child) => (
              <TreeLevel
                key={child.id}
                node={child}
                meId={meId}
                depth={depth + 1}
                expandedIds={expandedIds}
                setExpandedIds={setExpandedIds}
                loadChildren={loadChildren}
                patchNode={patchNode}
              />
            ))}
        </div>
      )}
    </div>
  )
})

export function NetworkTreeView({
  meId,
  meName,
  rootId: rootIdProp,
  rootName,
  isAdmin,
  fullNetwork,
}: {
  meId: string
  meName: string
  rootId?: string | null
  rootName?: string | null
  isAdmin?: boolean
  fullNetwork?: boolean
}) {
  const rootId = rootIdProp ?? meId
  const mindmapDepth = fullNetwork ? 25 : (isAdmin ? 12 : 2)
  const [root, setRoot] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const isViewingAsOther = rootId !== meId

  const patchNode = useCallback((id: string, patch: Partial<TreeNode> | ((n: TreeNode) => TreeNode)) => {
    setRoot((r) => {
      if (!r) return r
      const visit = (n: TreeNode): TreeNode => {
        if (n.id === id) {
          return typeof patch === 'function' ? patch(n) : { ...n, ...patch }
        }
        return { ...n, children: n.children?.map(visit) }
      }
      return visit(r) as TreeNode
    })
  }, [])

  const loadChildren = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/network/children?userId=${encodeURIComponent(userId)}`, {
        headers: getHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const list: TreeNode[] = (data.children ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        city: c.city,
        status: c.status,
        childrenCount: c.childrenCount ?? 0,
        children: [],
      }))
      patchNode(userId, (n) => ({
        ...n,
        children: list,
        _loaded: true,
      }))
      setExpandedIds((prev) => new Set(prev).add(userId))
    } catch (e) {
      console.error(e)
    }
  }, [patchNode])

  useEffect(() => {
    const cancelled = { current: false }
    setLoading(true)
    setError(null)
    fetch(`/api/network/mindmap?rootId=${encodeURIComponent(rootId)}&depth=${mindmapDepth}`, {
      headers: getHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data) => {
        if (cancelled.current) return
        const flat: (TreeNode & { parentId?: string | null })[] = (data.tree ?? []).map((n: any) => ({
          id: n.id,
          name: n.name,
          role: n.role,
          city: n.city,
          status: n.status,
          parentId: n.parentId ?? null,
          childrenCount: n.childrenCount ?? 0,
          children: [],
        }))
        const tree = buildTreeFromFlat(flat)
        setRoot(tree)
        if (tree) setExpandedIds(new Set([tree.id]))
      })
      .catch((e) => {
        if (!cancelled.current) setError(e instanceof Error ? e.message : 'Failed to load network')
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false)
      })
    return () => { cancelled.current = true }
  }, [rootId, mindmapDepth])

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-800 border border-slate-600 p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-500" />
        <p className="mt-3 text-slate-300 font-medium">Loading your network…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-slate-800 border border-red-900/50 p-8 text-center">
        <p className="text-red-300 font-medium">{error}</p>
      </div>
    )
  }

  if (!root) {
    return (
      <div className="rounded-2xl bg-slate-800 border border-slate-600 p-8 text-center">
        <p className="text-slate-300">No network data yet. Invite people to see your tree here.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-600 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-600 bg-slate-700/50">
        <h2 className="text-lg font-semibold text-white">Network tree</h2>
        <p className="text-sm text-slate-300">
          {isViewingAsOther && rootName ? `Viewing as: ${rootName}. Expand a card to see their team.` : 'Expand a card to see their team. You\'re at the top.'}
        </p>
      </div>
      <div className="p-6 overflow-x-auto bg-slate-800/50">
        <div className="min-w-[320px] max-w-2xl mx-auto space-y-2">
          <TreeLevel
            node={root}
            meId={meId}
            depth={0}
            expandedIds={expandedIds}
            setExpandedIds={setExpandedIds}
            loadChildren={loadChildren}
            patchNode={patchNode}
          />
        </div>
      </div>
    </div>
  )
}
