import { AccountProvider } from '@/app/AccountContext'
import { AdminProvider } from '@/app/AdminContext'
import { LanguageProvider } from '@/app/LanguageContext'
import { AppRouter } from '@/app/router'
import { AccessibilityEffects } from '@/shared/ui/AccessibilityEffects'

/** AccountSwitcher moved into router.tsx's RootLayout (same pattern as
 * CommandPalette) — it needs `useNavigate`, which only works inside the
 * Router tree; it was previously a sibling of <AppRouter/> here, outside
 * that tree, which is why its demo buttons could never navigate anywhere.
 *
 * AdminProvider is a sibling of AccountProvider, not nested inside it — the
 * Admin Centre's auth state (real Supabase platform_admins) is deliberately
 * independent of the consumer AccountContext (dev-only staffRole), so a
 * real admin and a consumer session are two separate things RequireStaff/
 * RequireOwner (guards.tsx) can each satisfy on their own. */
export function App() {
  return (
    <LanguageProvider>
      <AccountProvider>
        <AdminProvider>
          <AccessibilityEffects />
          <div className="pb-14">
            <AppRouter />
          </div>
        </AdminProvider>
      </AccountProvider>
    </LanguageProvider>
  )
}
