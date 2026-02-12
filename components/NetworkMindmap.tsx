'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  BackgroundVariant,
  Position,
  getBezierPath,
  BaseEdge,
  type EdgeProps,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MindmapNode, type MindmapNodeData } from './NetworkMindmapNode'
import { authHeaders } from '@/lib/authFetch'
import { buildTreeFromFlat, radialLayout } from '@/lib/mindmapLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Home, ChevronRight, List, Map as MapIcon, EyeOff } from 'lucide-react'

const nodeTypes = { mindmap: MindmapNode }

interface TreeMember {
  id: string
  name: string
  email?: string | null
  city?: string | null
  role: string
  status: string
  parentId: string | null
  childrenCount: number
}

function CustomBezierEdge({ id, sourceX, sourceY, targetX, targetY, style, data }: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Top,
    targetPosition: Position.Bottom,
  })
  const depth = (data?.depth as number) ?? 0
  const opacity = Math.max(0.35, 0.85 - depth * 0.15)
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        ...style,
        stroke: 'rgb(100 116 139)',
        strokeWidth: 1.5,
        strokeOpacity: opacity,
      }}
    />
  )
}

const edgeTypes = { default: CustomBezierEdge }

function getDepthMap(tree: TreeMember[], rootId: string): Map<string, number> {
  const depthMap = new Map<string, number>()
  depthMap.set(rootId, 0)
  const byParent = new Map<string, TreeMember[]>()
  for (const n of tree) {
    const pid = n.parentId ?? 'root'
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid)!.push(n)
  }
  let queue: string[] = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()!
    const children = byParent.get(id) ?? []
    for (const c of children) {
      depthMap.set(c.id, (depthMap.get(id) ?? 0) + 1)
      queue.push(c.id)
    }
  }
  return depthMap
}

function getVisibleIds(
  tree: TreeMember[],
  focusRootId: string,
  depthLimit: number,
  expandedNodeIds: Set<string>,
  depthMap: Map<string, number>
): Set<string> {
  const visible = new Set<string>([focusRootId])
  const queue: string[] = [focusRootId]
  while (queue.length > 0) {
    const id = queue.shift()!
    const children = tree.filter((n) => n.parentId === id)
    for (const c of children) {
      const d = depthMap.get(c.id) ?? 0
      const parentExpanded = expandedNodeIds.has(id)
      const withinDepth = d <= depthLimit
      if (withinDepth || parentExpanded) {
        visible.add(c.id)
        queue.push(c.id)
      }
    }
  }
  return visible
}

function MindmapInner({
  meId,
  focusRootId,
  setFocusRootId,
  depth,
  setDepth,
  onSwitchToList,
  breadcrumb,
  setBreadcrumb,
}: {
  meId: string
  focusRootId: string
  setFocusRootId: (id: string) => void
  depth: number
  setDepth: (d: number) => void
  onSwitchToList: () => void
  breadcrumb: { id: string; name: string }[]
  setBreadcrumb: (b: { id: string; name: string }[]) => void
}) {
  const [tree, setTree] = useState<TreeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<TreeMember[]>([])
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [minimapVisible, setMinimapVisible] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindmapNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const getHeaders = useCallback(() => authHeaders(), [])

  useEffect(() => {
    setExpandedNodeIds(new Set())
  }, [focusRootId])

  const loadMindmap = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/network/mindmap?rootId=${encodeURIComponent(focusRootId)}&depth=${depth}`,
        { headers: getHeaders() }
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      const list: TreeMember[] = data.tree || []
      setTree(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [focusRootId, depth, getHeaders])

  useEffect(() => {
    loadMindmap()
  }, [loadMindmap])

  const handleExpand = useCallback(async (nodeId: string) => {
    setExpandedNodeIds((prev) => new Set(prev).add(nodeId))
    try {
      const res = await fetch(`/api/network/children?userId=${encodeURIComponent(nodeId)}`, {
        headers: getHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const children: TreeMember[] = data.children ?? []
      setTree((prev) => {
        const ids = new Set(prev.map((n) => n.id))
        const newNodes = children.filter((c) => !ids.has(c.id))
        return newNodes.length ? [...prev, ...newNodes] : prev
      })
    } catch (e) {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev)
        next.delete(nodeId)
        return next
      })
    }
  }, [getHeaders])

  const handleCollapse = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev)
      next.delete(nodeId)
      return next
    })
  }, [])

  useEffect(() => {
    if (tree.length === 0) {
      setNodes([])
      setEdges([])
      return
    }
    const rootId = tree.find((n) => n.parentId === null)?.id ?? focusRootId
    const depthMap = getDepthMap(tree, rootId)
    const visibleIds = getVisibleIds(tree, rootId, depth, expandedNodeIds, depthMap)
    const visibleTree = tree.filter((n) => visibleIds.has(n.id))
    const root = buildTreeFromFlat(visibleTree.map((n) => ({ id: n.id, parentId: n.parentId })))
    const maxDepth = Math.max(depth, ...Array.from(depthMap.values()))
    const positions = radialLayout(root, Math.min(6, maxDepth + 1))
    const byId = new Map(visibleTree.map((n) => [n.id, n]))

    const flowNodes: Node<MindmapNodeData>[] = []
    const flowEdges: Edge[] = []

    visibleTree.forEach((n) => {
      const pos = positions.get(n.id)
      if (!pos) return
      const nodeDepth = depthMap.get(n.id) ?? 0
      flowNodes.push({
        id: n.id,
        type: 'mindmap',
        position: pos,
        data: {
          name: n.name,
          role: n.role,
          city: n.city,
          childrenCount: n.childrenCount,
          isMe: n.id === meId,
          status: n.status,
          hasChildren: n.childrenCount > 0,
          level: nodeDepth,
          isExpanded: expandedNodeIds.has(n.id),
          onExpand: (e: React.MouseEvent) => { e.stopPropagation(); handleExpand(n.id) },
          onCollapse: (e: React.MouseEvent) => { e.stopPropagation(); handleCollapse(n.id) },
        },
        draggable: false,
        selectable: true,
      })
      if (n.parentId && visibleIds.has(n.parentId)) {
        const targetDepth = depthMap.get(n.id) ?? 0
        flowEdges.push({
          id: `e-${n.parentId}-${n.id}`,
          source: n.parentId,
          target: n.id,
          type: 'default',
          data: { depth: targetDepth },
        })
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  // Only re-run when tree structure or visibility changes; handleExpand/handleCollapse are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, expandedNodeIds, depth, focusRootId, meId])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    const q = search.toLowerCase()
    const matches = tree.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.email && n.email.toLowerCase().includes(q)) ||
        (n.city && n.city.toLowerCase().includes(q))
    )
    setSearchResults(matches)
  }, [search, tree])

  const { fitView, setCenter } = useReactFlow()

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const member = tree.find((t) => t.id === node.id)
      if (!member) return
      setFocusRootId(node.id)
      const path: { id: string; name: string }[] = []
      let current: TreeMember | undefined = member
      while (current) {
        path.unshift({ id: current.id, name: current.name })
        current = tree.find((t) => t.id === current!.parentId)
      }
      setBreadcrumb(path)
    },
    [tree, setFocusRootId, setBreadcrumb]
  )

  const handleRecenter = useCallback(() => {
    setFocusRootId(meId)
    setBreadcrumb([{ id: meId, name: 'Me' }])
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 })
    }, 100)
  }, [meId, setFocusRootId, setBreadcrumb, fitView])

  const handleBackToMyNetwork = useCallback(() => {
    handleRecenter()
  }, [handleRecenter])

  const handleSearchSelect = useCallback(
    (member: TreeMember) => {
      setFocusRootId(member.id)
      const path: { id: string; name: string }[] = []
      let current: TreeMember | undefined = member
      while (current) {
        path.unshift({ id: current.id, name: current.name })
        current = tree.find((t) => t.id === current!.parentId)
      }
      setBreadcrumb(path)
      setSearch('')
      setSearchResults([])
      setTimeout(() => {
        setCenter(
          (nodes.find((n) => n.id === member.id)?.position?.x ?? 0) + 100,
          (nodes.find((n) => n.id === member.id)?.position?.y ?? 0) + 50,
          { zoom: 1, duration: 300 }
        )
      }, 150)
    },
    [tree, setFocusRootId, setBreadcrumb, setCenter, nodes]
  )

  const isFocusedOnMe = focusRootId === meId

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes as React.ComponentProps<typeof ReactFlow>['nodeTypes']}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgb(51 65 85)" className="opacity-40" />
        <Controls
          className="!bg-slate-800 !border-slate-600 !rounded-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-white"
          position="bottom-right"
        />
        {minimapVisible && (
          <MiniMap
            nodeColor="#334155"
            nodeStrokeColor="#475569"
            maskColor="rgb(15 23 42 / 0.8)"
            className="!bg-slate-800 !border-slate-600 rounded-lg"
            position="bottom-left"
          />
        )}
        <Panel position="top-left" className="flex flex-col gap-2 m-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRecenter}
              className="bg-slate-800/90 border-slate-600 text-white hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-1" /> Re-center on Me
            </Button>
            {!isFocusedOnMe && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBackToMyNetwork}
                className="bg-emerald-900/50 border-emerald-600 text-emerald-200 hover:bg-emerald-800"
              >
                Back to My Network
              </Button>
            )}
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg border border-slate-600 px-2 py-1">
              <span className="text-slate-400 text-xs">Depth:</span>
              {[2, 3, 4].map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    depth === d ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMinimapVisible((v) => !v)}
              className="bg-slate-800/90 border-slate-600 text-white hover:bg-slate-700"
              title={minimapVisible ? 'Hide minimap' : 'Show minimap'}
            >
              {minimapVisible ? <EyeOff className="w-4 h-4 mr-1" /> : <MapIcon className="w-4 h-4 mr-1" />}
              {minimapVisible ? 'Hide map' : 'Map'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSwitchToList}
              className="md:hidden bg-slate-800/90 border-slate-600 text-white"
            >
              <List className="w-4 h-4 mr-1" /> List
            </Button>
          </div>
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap text-sm text-slate-400 bg-slate-800/90 rounded-lg border border-slate-600 px-3 py-1.5">
              {breadcrumb.map((b, i) => (
                <span key={b.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => {
                      setFocusRootId(b.id)
                      setBreadcrumb(breadcrumb.slice(0, i + 1))
                      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100)
                    }}
                    className={`rounded px-0.5 py-0.5 -m-0.5 hover:bg-slate-700/80 ${
                      b.id === meId ? 'text-emerald-400 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {b.id === meId ? 'Me' : b.name}
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search in network..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
            {searchResults.length > 0 && (
              <ul className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl z-10">
                {searchResults.slice(0, 10).map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => handleSearchSelect(m)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex flex-col"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-slate-500">{m.role} {m.city ? ` · ${m.city}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </ReactFlow>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
          <div className="animate-pulse text-slate-400">Loading mindmap…</div>
        </div>
      )}
    </div>
  )
}

function useMobileDefaultDepth() {
  const [depth, setDepth] = useState(2)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches) setDepth(1)
  }, [])
  return [depth, setDepth] as const
}

export function NetworkMindmap({
  meId,
  onSwitchToList,
}: {
  meId: string
  onSwitchToList: () => void
}) {
  const [focusRootId, setFocusRootId] = useState(meId)
  const [depth, setDepth] = useMobileDefaultDepth()
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([{ id: meId, name: 'Me' }])

  return (
    <ReactFlowProvider>
      <MindmapInner
        meId={meId}
        focusRootId={focusRootId}
        setFocusRootId={setFocusRootId}
        depth={depth}
        setDepth={setDepth}
        onSwitchToList={onSwitchToList}
        breadcrumb={breadcrumb}
        setBreadcrumb={setBreadcrumb}
      />
    </ReactFlowProvider>
  )
}
