// Type declarations for lucide-react
// Workaround for TypeScript module resolution issues with pnpm
declare module 'lucide-react' {
  import { type SVGProps } from 'react';

  export type Icon = React.ComponentType<SVGProps<SVGSVGElement>>;
  export type LucideIcon = Icon;

  // Common icons
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const X: Icon;
  export const Menu: Icon;
  export const Search: Icon;
  export const Plus: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const CheckCircle2: Icon;
  export const AlertCircle: Icon;
  export const Info: Icon;
  export const XCircle: Icon;
  export const Loader2: Icon;
  export const Users: Icon;
  export const MessageSquare: Icon;
  export const Zap: Icon;
  export const DollarSign: Icon;
  export const TrendingUp: Icon;
  export const TrendingDown: Icon;
  export const RefreshCw: Icon;
  export const FolderOpen: Icon;
  export const FileText: Icon;
  export const Settings: Icon;
  export const Trash2: Icon;
  export const Edit: Icon;
  export const Send: Icon;
  export const ExternalLink: Icon;
  export const Bot: Icon;
  export const ArrowRight: Icon;
  export const ArrowLeft: Icon;
  export const Sparkles: Icon;
  export const Database: Icon;
  export const Home: Icon;
  export const GraduationCap: Icon;
  export const BookOpen: Icon;
  export const Shield: Icon;
  export const Building2: Icon;
  export const FileCheck: Icon;
  export const Lock: Icon;
  export const MoreVertical: Icon;
  export const Calendar: Icon;
  export const Clock: Icon;
  export const Play: Icon;
  export const Pause: Icon;
  export const Volume2: Icon;
  export const ArrowUpDown: Icon;
  export const ArrowUp: Icon;
  export const ArrowDown: Icon;
  export const MessageCircle: Icon;
  export const User: Icon;
  export const LogOut: Icon;
  export const LogOutIcon: Icon;
  export const LayoutDashboard: Icon;
}


