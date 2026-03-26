/// <reference types="vite/client" />
import type { BriefKlarAPI } from '../../preload'

declare global {
  interface Window {
    briefklar: BriefKlarAPI
  }
}
