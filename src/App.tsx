import { AccountProvider } from '@/app/AccountContext'
import { LanguageProvider } from '@/app/LanguageContext'
import { AppRouter } from '@/app/router'
import { AccessibilityEffects } from '@/shared/ui/AccessibilityEffects'

/** AccountSwitcher moved into router.tsx's RootLayout (same pattern as
 * CommandPalette) — it needs `useNavigate`, which only works inside the
 * Router tree; it was previously a sibling of <AppRouter/> here, outside
 * that tree, which is why its demo buttons could never navigate anywhere. */
export function App() {
  return (
    <LanguageProvider>
      <AccountProvider>
        <AccessibilityEffects />
        <div className="pb-14">
          <AppRouter />
        </div>
      </AccountProvider>
    </LanguageProvider>
  )
}
