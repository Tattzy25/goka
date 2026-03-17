"use client"

import * as React from "react"

import styles from "./create-button.module.css"

type CreateButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  loading?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
  defaultContent: React.ReactNode
  hoverContent: React.ReactNode
}

export function CreateButton({
  onClick,
  disabled,
  loading,
  type = "button",
  className,
  defaultContent,
  hoverContent,
}: CreateButtonProps) {
  return (
    <div className={styles.buttonWrap}>
      <button
        type={type}
        className={[styles.button, className].filter(Boolean).join(" ")}
        onClick={onClick}
        disabled={disabled}
        data-loading={loading ? "true" : undefined}
      >
        <span className={styles.wrap}>
          <p className={styles.text}>
            <span>{defaultContent}</span>
            <span>{hoverContent}</span>
          </p>
        </span>
      </button>
    </div>
  )
}
