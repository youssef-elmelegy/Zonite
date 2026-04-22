// Icons barrel — single export surface for all icons
// Combines custom brand SVGs + lucide-react generic icons
// Contract: specs/003-design-handoff/contracts/primitives.contract.md §Icons

// Brand icons (custom SVG + handoff logos, non-replaceable)
export { IconCrownHost, ZoniteLogo, YalgamersLogo } from './brand/index';

// Lucide generic icons — all exported with Icon* prefix for uniformity
export {
  Copy as IconCopy,
  X as IconClose,
  ChevronDown as IconChevronDown,
  ChevronUp as IconChevronUp,
  Check as IconCheck,
  CheckCircle2 as IconCheckCircle,
  XCircle as IconXCircle,
  Search as IconSearch,
  Info as IconInfo,
  AlertTriangle as IconWarn,
  Eye as IconEye,
  EyeOff as IconEyeOff,
  Settings as IconSettings,
  Menu as IconMenu,
  ArrowRight as IconArrowRight,
  ArrowLeft as IconArrowLeft,
  Loader as IconLoader,
  User as IconUser,
} from 'lucide-react';
