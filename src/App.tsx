import { AccountProvider } from '@/app/AccountContext'
import { LanguageProvider } from '@/app/LanguageContext'
import { AppRouter } from '@/app/router'
import { AccountSwitcher } from '@/dev/AccountSwitcher'
import { AccessibilityEffects } from '@/shared/ui/AccessibilityEffects'

export function App() {
  return (
    <LanguageProvider>
      <AccountProvider>
        <AccessibilityEffects />
        <div className="pb-14">
          <AppRouter />
        </div>
        <AccountSwitcher />
      </AccountProvider>
    </LanguageProvider>
  )
}
