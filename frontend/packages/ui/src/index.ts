/**
 * @cfc/ui — every shared component in the system.
 *
 * Apps import from here and never from the internals. shadcn primitives are
 * generated into ./primitives and re-exported below; `shadcn add` is never run
 * inside an app.
 */

// Utilities ------------------------------------------------------------------
export { cn } from "./lib/cn";
export {
  formatCurrency,
  formatCount,
  formatCurrencyAxis,
  formatDate,
  formatSchedule,
} from "./lib/format";
export { toCsv, downloadCsv, type CsvColumn } from "./lib/csv";
export { usePrefersReducedMotion } from "./lib/use-prefers-reduced-motion";
export { usePlatformModifier } from "./lib/use-platform-key";
export { useReorder, type ReorderHandlers } from "./lib/use-reorder";

// Primitives -----------------------------------------------------------------
export { Button, buttonVariants, type ButtonProps } from "./primitives/button";
export { Input, inputVariants, type InputProps } from "./primitives/input";
export { Badge, badgeVariants, type BadgeProps } from "./primitives/badge";
export { Skeleton } from "./primitives/skeleton";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./primitives/table";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./primitives/select";
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "./primitives/popover";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./primitives/dropdown-menu";
export { Calendar, type CalendarProps } from "./primitives/calendar";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./primitives/dialog";
export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./primitives/sheet";
export { Toaster, toast } from "./primitives/toast";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./primitives/alert-dialog";
export { Textarea } from "./primitives/textarea";
export { Switch } from "./primitives/switch";
export { Checkbox } from "./primitives/checkbox";
export { RadioGroup, RadioGroupItem } from "./primitives/radio-group";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./primitives/tabs";
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  initials,
} from "./primitives/avatar";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./primitives/tooltip";


// Components -----------------------------------------------------------------
export {
  DataTable,
  type CardLayout,
  type Column,
  type SortDir,
} from "./components/data-table";
export {
  BookingStatusBadge,
  DocumentStatusBadge,
  PayoutStatusBadge,
  ProApprovalBadge,
  ProAvailabilityBadge,
  ProBlockedBadge,
  QuotationStatusBadge,
  RefundStatusBadge,
  SlaClockBadge,
  TicketPriorityBadge,
  TicketStatusBadge,
  TransactionStatusBadge,
  type PayoutStatus,
} from "./components/status-badge";
export {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  NoResultsState,
} from "./components/states";
export { Pagination } from "./components/pagination";
export {
  PageHeader,
  type Crumb,
  type PageHeaderProps,
} from "./components/page-header";
export { InlineAlert, type InlineAlertProps } from "./components/inline-alert";
export {
  CommandPalette,
  Kbd,
  useCommandPalette,
  type CommandItem,
  type CommandPaletteProps,
} from "./components/command-palette";
export {
  Combobox,
  type ComboboxOption,
  type ComboboxProps,
} from "./components/combobox";
export {
  FilterBar,
  FilterMultiSelect,
  FilterSelect,
  type FilterBarProps,
  type FilterOption,
} from "./components/filter-bar";
export {
  Sparkline,
  StatCard,
  type StatCardProps,
} from "./components/stat-card";
// Consumer-facing composites. Built for the customer app; the pro app reuses
// StarRating and SnapScroller.
export { SnapScroller } from "./components/snap-scroller";
export { StarRating } from "./components/star-rating";
export { ServiceCard } from "./components/service-card";
export {
  DateRangePicker,
  type DateRange,
} from "./components/date-range-picker";
export {
  DetailCard,
  DetailList,
  DetailRow,
  DetailShell,
  Timeline,
  TimelineItem,
} from "./components/detail-shell";
export { FormField } from "./components/form-field";
export { FormShell } from "./components/form-shell";
export { MapView, type MapMarker, type MapViewProps } from "./components/map-view";

// Charts -----------------------------------------------------------------
export { BarChart, type BarSeriesDef } from "./charts/bar-chart";
export { LineChart, type LineSeriesDef } from "./charts/line-chart";
export { seriesColor } from "./charts/theme";
export { ChartFrame } from "./charts/chart-frame";
