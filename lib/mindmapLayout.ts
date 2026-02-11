/**
 * Radial mindmap layout: center = root, level 1 in circle, level 2+ in arcs outward.
 * Returns map of nodeId -> { x, y } in flow coordinates.
 */
const R0 = 0
const R1 = 220 // level 1 radius
const R_STEP = 200 // per-level radius increment

export interface TreeNode {
  id: string
  parentId: string | null
  children?: TreeNode[]
}

export function buildTreeFromFlat(nodes: { id: string; parentId: string | null }[]): TreeNode | null {
  const byId = new Map<string, TreeNode>()
  for (const n of nodes) {
    byId.set(n.id, { ...n, children: [] })
  }
  let root: TreeNode | null = null
  for (const n of nodes) {
    const node = byId.get(n.id)!
    if (!n.parentId) {
      root = node
      continue
    }
    const parent = byId.get(n.parentId)
    if (parent && parent.children) parent.children.push(node)
  }
  return root
}

export function radialLayout(
  root: TreeNode | null,
  maxDepth: number = 4
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  if (!root) return positions

  positions.set(root.id, { x: R0, y: R0 })

  function place(
    node: TreeNode,
    depth: number,
    startAngle: number, // degrees
    endAngle: number
  ) {
    if (depth > maxDepth) return
    const children = node.children || []
    if (children.length === 0) return

    const radius = R1 + (depth - 1) * R_STEP
    const sector = (endAngle - startAngle) / children.length
    children.forEach((child, i) => {
      const midAngle = startAngle + (i + 0.5) * sector
      const rad = (midAngle * Math.PI) / 180
      const x = radius * Math.cos(rad)
      const y = radius * Math.sin(rad)
      positions.set(child.id, { x, y })
      const childStart = startAngle + i * sector
      const childEnd = startAngle + (i + 1) * sector
      place(child, depth + 1, childStart, childEnd)
    })
  }

  const children = root.children || []
  if (children.length === 0) return positions
  const fullCircle = 360
  const sector = fullCircle / children.length
  children.forEach((child, i) => {
    const midAngle = (i + 0.5) * sector - 180 // -180 so first is left
    const rad = (midAngle * Math.PI) / 180
    const x = R1 * Math.cos(rad)
    const y = R1 * Math.sin(rad)
    positions.set(child.id, { x, y })
    const childStart = i * sector - 180
    const childEnd = (i + 1) * sector - 180
    place(child, 2, childStart, childEnd)
  })

  return positions
}
