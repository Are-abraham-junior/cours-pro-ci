import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <main className="lg:ml-64">
        {/* Header - only show if title is provided */}
        {title && (
          <header className="bg-card border-b pl-16 pr-4 py-4 lg:px-8 lg:py-6">
            <div className="max-w-7xl">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm lg:text-base text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </header>
        )}

        {/* Page content */}
        <div className="p-4 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
