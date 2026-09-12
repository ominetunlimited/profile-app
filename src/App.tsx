import { AccountProvider } from '@/app/AccountContext'
import { LanguageProvider } from '@/app/LanguageContext'
import { AppRouter } from '@/app/router'
import { AccountSwitcher } from '@/dev/AccountSwitcher'

export function App() {
  return (
    <LanguageProvider>
      <AccountProvider>
        <div className="pb-14">
          <AppRouter />
        </div>
        <AccountSwitcher />
      </AccountProvider>
    </LanguageProvider>
  )
}
