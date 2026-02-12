"use client"

import * as React from "react"

export type ToastActionElement = React.ReactElement

export interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ToastState {
  toasts: ToastProps[]
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastState: ToastState = {
  toasts: [],
}

const listeners: Array<(state: ToastState) => void> = []

function setState(updater: (state: ToastState) => ToastState) {
  const next = updater(toastState)
  Object.assign(toastState, next)
  listeners.forEach((listener) => listener(toastState))
}

function addToast(props: Omit<ToastProps, "id">) {
  const id = genId()
  const toast: ToastProps = { ...props, id }
  setState((state) => ({
    toasts: [toast, ...state.toasts].slice(0, TOAST_LIMIT),
  }))
  return id
}

function dismiss(id: string) {
  setState((state) => ({
    toasts: state.toasts.map((t) =>
      t.id === id ? { ...t, open: false } : t
    ),
  }))
  setTimeout(() => {
    setState((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  }, TOAST_REMOVE_DELAY)
}

export function useToast() {
  const [state, setStateSnapshot] = React.useState(toastState)

  React.useEffect(() => {
    const listener = (s: ToastState) => setStateSnapshot(s)
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast: addToast,
    dismiss,
  }
}
