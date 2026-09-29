'use client';

import * as React from 'react';
import { Search, Mail, ExternalLink } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  Skeleton,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@/components/ui';

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [buttonLoading, setButtonLoading] = React.useState(false);

  return (
    <div className="space-y-8" data-testid="design-system-showcase">
      {/* 1. Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">1. Buttons & Triggers</CardTitle>
          <CardDescription>Variants, sizes, loading states, and icon placements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="sky">Sky Engine</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="xs">Extra Small (xs)</Button>
            <Button size="sm">Small (sm)</Button>
            <Button size="md">Medium (md)</Button>
            <Button size="lg">Large (lg)</Button>
            <Button
              isLoading={buttonLoading}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 2000);
              }}
            >
              {buttonLoading ? 'Processing...' : 'Click for Loading State'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Form Inputs & Selects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">2. Form Inputs & Select Controls</CardTitle>
          <CardDescription>
            Accessible inputs, icons, validation states, and helper text
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Search Keywords"
              placeholder="e.g. Next.js, Lead Gen"
              leftIcon={<Search className="h-4 w-4" />}
              helperText="Press Enter to execute search filter."
            />
            <Input
              label="Operator Email"
              type="email"
              defaultValue="operator@system.local"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="API Token"
              type="password"
              error="Authentication token is expired."
              defaultValue="hunter_live_secret_key"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Opportunity Status Filter"
              defaultValue="new"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'new', label: 'New / Unreviewed' },
                { value: 'saved', label: 'Saved Opportunity' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'applied', label: 'Applied' },
              ]}
              helperText="Filters the unified opportunity pipeline."
            />
            <Select
              label="Discovery Engine"
              defaultValue="both"
              options={[
                { value: 'both', label: 'All Engines (Job & Lead)' },
                { value: 'job', label: 'Job Hunt AI only' },
                { value: 'lead', label: 'Lead Hunt AI only' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">3. Status Badges & Indicators</CardTitle>
          <CardDescription>Color tokens and live pulsing dots</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2.5">
          <Badge variant="emerald" dot dotPulse>
            Active Pipeline
          </Badge>
          <Badge variant="sky" dot>
            Job Hunt AI
          </Badge>
          <Badge variant="amber" dot>
            Pending Review
          </Badge>
          <Badge variant="rose" dot>
            Run Failed
          </Badge>
          <Badge variant="purple" dot>
            Enriched Contact
          </Badge>
          <Badge variant="secondary">Static Slate</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </CardContent>
      </Card>

      {/* 4. Responsive Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">4. Responsive Data Table</CardTitle>
          <CardDescription>Horizontal overflow container and row hover feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity / Target</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-white">Senior Fullstack Engineer</TableCell>
                <TableCell>
                  <Badge variant="sky" size="sm">
                    Job Hunt
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-slate-400">RemoteOK</TableCell>
                <TableCell>
                  <Badge variant="emerald" size="sm" dot>
                    New
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="xs">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white">Pacific Dental Group</TableCell>
                <TableCell>
                  <Badge variant="emerald" size="sm">
                    Lead Hunt
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-slate-400">Google Maps</TableCell>
                <TableCell>
                  <Badge variant="amber" size="sm" dot>
                    Gaps Detected
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="xs">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Dialog & Dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">5. Dialog Modal & Dropdown Menus</CardTitle>
          <CardDescription>Backdrop blur modals and accessible trigger menus</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="open-test-dialog">
                Open Test Dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Automated Discovery Trigger</DialogTitle>
                <DialogDescription>
                  This dialog is rendered through the Opportunity Hunter modal design system.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 text-xs text-slate-300">
                Modal accessibility features include keyboard trap, ESC listener, and blur overlay.
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setDialogOpen(false)}>
                  Confirm Execution
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="secondary" data-testid="open-test-dropdown">
                Open Dropdown Menu
              </Button>
            </DropdownTrigger>
            <DropdownContent align="left">
              <DropdownLabel>Quick Actions</DropdownLabel>
              <DropdownItem icon={<Search className="h-3.5 w-3.5" />}>Search Index</DropdownItem>
              <DropdownItem icon={<ExternalLink className="h-3.5 w-3.5" />}>
                Export Pipeline
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem destructive>Archive Records</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </CardContent>
      </Card>

      {/* 6. Skeletons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">6. Shimmer Loading Skeletons</CardTitle>
          <CardDescription>Loading states designed to avoid layout shifts</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SkeletonCard />
          <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Empty State & Error State */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">7. Empty State Component</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              compact
              title="No Search Runs Found"
              description="Start your first discovery query to see execution audit logs."
              action={<Button size="xs">Start Search</Button>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">8. Error State Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorState
              compact
              title="Search Run Timeout"
              message="The automated scraping worker did not return within the allocated threshold."
              error="Error: 504 Gateway Timeout connecting to n8n webhook"
              onRetry={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
