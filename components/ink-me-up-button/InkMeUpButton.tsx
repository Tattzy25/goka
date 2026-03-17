"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import styles from "./InkMeUpButton.module.css"

type InkMeUpButtonProps = {
  isLoading?: boolean
  onClick: () => void
  disabled?: boolean
}

export function InkMeUpButton({
  isLoading = false,
  onClick,
  disabled = false,
}: InkMeUpButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <div className={styles.buttonWrap}>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={isDisabled}
        data-loading={isLoading ? "true" : undefined}
        aria-label={isLoading ? "Creating" : "Ink me up"}
      >
        <span className={styles.wrap}>
          <p className={styles.text}>
            <span>
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  CREATING…
                </>
              ) : (
                <>
                  <span aria-hidden="true">✧</span>
                  <span aria-hidden="true">✦</span>
                  INK ME UP
                </>
              )}
            </span>
            <span>
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  CREATING…
                </>
              ) : (
                <>
                  <span aria-hidden="true">✧</span>
                  <span aria-hidden="true">✦</span>
                  INK ME UP
                </>
              )}
            </span>
          </p>
        </span>
      </button>
    </div>
  )
}

