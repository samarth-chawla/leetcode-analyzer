import { AppShell } from '@/components/app-shell'
import { ExternalLink } from 'lucide-react'

export default function InstructorPage() {
  return (
    <AppShell active="/instructor">
      <style dangerouslySetInnerHTML={{ __html: `
        .instructor-card {
          padding: 0 !important;
        }
        .instructor-iframe {
          width: 125% !important;
          height: 125% !important;
          transform: scale(0.8) !important;
          transform-origin: top left !important;
        }
        @media (min-width: 640px) {
          .instructor-iframe {
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
          }
        }
      `}} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold text-primary">DSA Instructor</h1>
            <p className="mt-1.5 text-sm text-secondary">
              Interactive DSA lessons and coding instruction.
            </p>
          </div>
          <a
            href="https://dsa-instructor.samarthworks.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white h-10 px-4 text-sm font-medium text-primary hover:bg-surface transition-colors mx-auto sm:mx-0 w-fit sm:shrink-0"
          >
            Open in New Tab
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="card instructor-card mt-6 overflow-hidden -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] min-h-[500px]">
          <iframe
            src="https://dsa-instructor.samarthworks.in/"
            className="instructor-iframe border-0"
            allow="clipboard-write; storage-access"
            title="DSA Instructor"
          />
        </div>
      </div>
    </AppShell>
  )
}
