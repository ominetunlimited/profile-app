/**
 * PROFILE CHAT ICON SET. One family (Hugeicons, 1.6 stroke) for every messaging
 * control, plus two hand-drawn glyphs: the paper-plane Send mark and the
 * single/double delivery ticks. No emoji are used as UI icons anywhere in chat.
 */
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Archive02Icon, ArrowDown01Icon, ArrowTurnBackwardIcon, Attachment01Icon, Camera01Icon, Cancel01Icon, Clock01Icon,
  Copy01Icon, CheckListIcon, Delete02Icon, Download01Icon, FileAttachmentIcon, Flag01Icon, Image02Icon,
  InformationCircleIcon, LeftToRightListBulletIcon, Mic01Icon, MoreVerticalIcon, NotificationOff01Icon, Notification03Icon,
  PauseIcon, PlayIcon, QuoteDownIcon, Search01Icon, SmileIcon, StopIcon, TextBoldIcon, TextItalicIcon, UserBlock01Icon,
  ArrowTurnForwardIcon, Pdf01Icon, FileZipIcon, MusicNote01Icon, PlusSignIcon,
} from '@hugeicons/core-free-icons'

type P = { size?: number; className?: string }
type Def = Parameters<typeof HugeiconsIcon>[0]['icon']
const mk = (icon: Def) =>
  function ChatIcon({ size = 20, className }: P) {
    return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.6} color="currentColor" className={className} aria-hidden="true" />
  }

export const CAttach = mk(Attachment01Icon)
export const CCamera = mk(Camera01Icon)
export const CMic = mk(Mic01Icon)
export const CMore = mk(MoreVerticalIcon)
export const CClock = mk(Clock01Icon)
export const CReply = mk(ArrowTurnBackwardIcon)
export const CForward = mk(ArrowTurnForwardIcon)
export const CCopy = mk(Copy01Icon)
export const CTrash = mk(Delete02Icon)
export const CArchive = mk(Archive02Icon)
export const CMute = mk(NotificationOff01Icon)
export const CUnmute = mk(Notification03Icon)
export const CBlock = mk(UserBlock01Icon)
export const CFlag = mk(Flag01Icon)
export const CSearch = mk(Search01Icon)
export const CSmile = mk(SmileIcon)
export const CSelect = mk(CheckListIcon)
export const CImage = mk(Image02Icon)
export const CFile = mk(FileAttachmentIcon)
export const CPdf = mk(Pdf01Icon)
export const CZip = mk(FileZipIcon)
export const CAudio = mk(MusicNote01Icon)
export const CDownload = mk(Download01Icon)
export const CPlay = mk(PlayIcon)
export const CPause = mk(PauseIcon)
export const CStop = mk(StopIcon)
export const CClose = mk(Cancel01Icon)
export const CDown = mk(ArrowDown01Icon)
export const CInfo = mk(InformationCircleIcon)
export const CBold = mk(TextBoldIcon)
export const CItalic = mk(TextItalicIcon)
export const CList = mk(LeftToRightListBulletIcon)
export const CQuote = mk(QuoteDownIcon)
export const CPlus = mk(PlusSignIcon)

/** Send: filled paper plane, Telegram-style, with a fold cut-out. */
export function CSend({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M21.6 2.4a1.3 1.3 0 0 0-1.35-.2L2.7 9.2c-.95.38-.9 1.74.08 2l4.4 1.25 1.7 5.35c.22.7 1.1.92 1.62.4l2.3-2.25 4.35 3.2c.8.58 1.92.14 2.12-.83l3.05-14.9c.12-.6-.15-1.1-.72-1.0ZM9.1 12.9l8.4-6.2c.15-.1.3.1.17.22l-6.55 6.55a.6.6 0 0 0-.17.33l-.35 2.3c-.03.2-.3.24-.36.05L9.1 12.9Z"
      />
    </svg>
  )
}

/** Delivery ticks: one tick = sent, two = delivered/read. */
export function CTicks({ size = 16, double = false, className }: P & { double?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={double ? 'm2.5 12.5 4.2 4.2L15 7.5' : 'm5 12.5 4.5 4.5L19 7'} />
      {double && <path d="m10.5 16.6.6.6L21 7" />}
    </svg>
  )
}
